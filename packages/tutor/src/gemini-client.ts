export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface GeminiClientConfig {
  apiKey?: string;
  model?: string;
  endpoint?: string;
  dailyTokenBudget?: number;
}

export interface LLMLogEntry {
  id: string;
  purpose: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costEstimate: number;
  createdAt: string;
}

export class GeminiClient {
  private apiKey: string;
  private model: string;
  private endpoint: string;
  private totalTokensUsed: number = 0;
  private tokenBudget: number;
  private logs: LLMLogEntry[] = [];

  constructor(config: GeminiClientConfig = {}) {
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || '';
    // Per user instruction: use Gemini API with 3.8 flash
    this.model = config.model || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    this.endpoint = config.endpoint || 'https://generativelanguage.googleapis.com/v1beta/models';
    this.tokenBudget = config.dailyTokenBudget || 100_000;
  }

  getModel(): string {
    return this.model;
  }

  getLogs(): LLMLogEntry[] {
    return [...this.logs];
  }

  getTotalTokens(): number {
    return this.totalTokensUsed;
  }

  async generateStructuredResponse<T>(params: {
    systemInstruction: string;
    prompt: string;
    purpose: string;
    jsonSchemaDescription?: string;
    mockFallback?: () => T;
  }): Promise<T> {
    const { systemInstruction, prompt, purpose, jsonSchemaDescription, mockFallback } = params;

    // Check token budget limit
    if (this.totalTokensUsed >= this.tokenBudget) {
      if (mockFallback) {
        return mockFallback();
      }
      throw new Error(`Daily token budget exceeded (${this.totalTokensUsed}/${this.tokenBudget})`);
    }

    // In test or offline environment without API key, use fallback
    if (!this.apiKey) {
      if (mockFallback) {
        return mockFallback();
      }
      throw new Error('GEMINI_API_KEY is not configured and no mock fallback was provided.');
    }

    const url = `${this.endpoint}/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemInstruction}\n\nStrict JSON Format required:\n${jsonSchemaDescription || 'Valid JSON'}\n\nTask:\n${prompt}`
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    };

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.warn(`Gemini API error (${resp.status}): ${errText}`);
        if (mockFallback) return mockFallback();
        throw new Error(`Gemini API error: ${resp.status} ${errText}`);
      }

      const data = await resp.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Empty response from Gemini API');
      }

      // Track usage
      const tokensIn = data.usageMetadata?.promptTokenCount || Math.ceil((systemInstruction.length + prompt.length) / 4);
      const tokensOut = data.usageMetadata?.candidatesTokenCount || Math.ceil(rawText.length / 4);
      this.totalTokensUsed += tokensIn + tokensOut;

      this.logs.push({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        purpose,
        model: this.model,
        tokensIn,
        tokensOut,
        costEstimate: (tokensIn * 0.0001 + tokensOut * 0.0004) / 1000,
        createdAt: new Date().toISOString()
      });

      return JSON.parse(rawText) as T;
    } catch (err: any) {
      if (mockFallback) {
        return mockFallback();
      }
      throw err;
    }
  }
}
