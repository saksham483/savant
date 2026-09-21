import {
  Item,
  HintLevel,
  TutorHintRequest,
  TutorHintResponse,
  ExplainBackRequest,
  ExplainBackResponse,
  HintLevelDescriptions
} from '@savant/core';
import { GeminiClient } from './gemini-client.js';

export class TutorService {
  private client: GeminiClient;

  constructor(client?: GeminiClient) {
    this.client = client || new GeminiClient();
  }

  getClient(): GeminiClient {
    return this.client;
  }

  async getHint(req: TutorHintRequest, item: Item): Promise<TutorHintResponse> {
    const hintDesc = HintLevelDescriptions[req.level];
    const isL4 = req.level === 'L4';

    // If item already contains pre-authored verified hints, use them
    if (item.hints && item.hints.length >= 5) {
      const levelIndex = ['L0', 'L1', 'L2', 'L3', 'L4'].indexOf(req.level);
      if (levelIndex >= 0 && item.hints[levelIndex]) {
        return {
          level: req.level,
          message: item.hints[levelIndex],
          cost: hintDesc.cost,
          revealsFinalAnswer: isL4
        };
      }
    }

    const systemPrompt = `You are a Socratic tutor in SAVANT. 
Rules:
1. Under NO circumstances reveal the final answer if level is L0, L1, L2, or L3. Only L4 reveals the final answer.
2. Ask one focused question at a time. Keep reply under 120 words.
3. Level ${req.level}: ${hintDesc.name} - ${hintDesc.description}.
4. Ground your advice in: Problem: "${item.prompt}", Solution Outline: "${item.solution}".`;

    const prompt = `Current item: ${item.prompt}
Requested Hint Level: ${req.level} (${hintDesc.name})
Student's current attempt/thought: ${JSON.stringify(req.currentAttempt || 'Not yet submitted')}`;

    const fallback = (): TutorHintResponse => {
      switch (req.level) {
        case 'L0':
          return {
            level: 'L0',
            message: `Take a breath and examine what is given: "${item.prompt.slice(0, 100)}...". What is the exact mathematical entity you are being asked to find?`,
            guidingQuestion: 'Can you state the input and expected output in your own words?',
            cost: hintDesc.cost,
            revealsFinalAnswer: false
          };
        case 'L1':
          return {
            level: 'L1',
            message: `Recall the foundational definition and properties for this topic. Which formula or identity directly connects the given terms to the desired quantity?`,
            guidingQuestion: 'What core theorem applies directly to this setup?',
            cost: hintDesc.cost,
            revealsFinalAnswer: false
          };
        case 'L2':
          return {
            level: 'L2',
            message: `First set up the standard equation, then isolate the target variable or compute the invariant before substituting numbers.`,
            guidingQuestion: 'What is the immediate algebraic step before substitution?',
            cost: hintDesc.cost,
            revealsFinalAnswer: false
          };
        case 'L3':
          return {
            level: 'L3',
            message: `Here is the intermediate step: set up the characteristic equation or initial transformation: ${item.solution.slice(0, 80)}...`,
            guidingQuestion: 'Now apply the final simplification to solve for the target.',
            cost: hintDesc.cost,
            revealsFinalAnswer: false
          };
        case 'L4':
          return {
            level: 'L4',
            message: `Full worked solution: ${item.solution}. (A new similar variant has been queued to reinforce your mastery).`,
            cost: hintDesc.cost,
            revealsFinalAnswer: true
          };
      }
    };

    return this.client.generateStructuredResponse<TutorHintResponse>({
      systemInstruction: systemPrompt,
      prompt,
      purpose: `hint_${req.level}`,
      jsonSchemaDescription: `{ "level": "${req.level}", "message": string, "guidingQuestion": string, "cost": ${hintDesc.cost}, "revealsFinalAnswer": ${isL4} }`,
      mockFallback: fallback
    });
  }

  async evaluateExplainBack(req: ExplainBackRequest): Promise<ExplainBackResponse> {
    const systemPrompt = `You are a rigorous academic evaluator in SAVANT.
Evaluate the student's explanation against the provided rubric criteria.
For each criterion, determine if it was met and provide specific constructive feedback.`;

    const prompt = `Topic: ${req.topic}
Rubric criteria: ${JSON.stringify(req.rubricCriteria)}
Student explanation:
"${req.explanation}"`;

    const fallback = (): ExplainBackResponse => {
      const length = req.explanation.trim().split(/\s+/).length;
      const pass = length >= 15;
      const feedback = req.rubricCriteria.map((c, idx) => ({
        criterion: c,
        met: pass && idx === 0 ? true : length > 30,
        comment: length > 30 ? `Addressed the concept of ${c}` : `Could articulate ${c} with more precision.`
      }));

      const metCount = feedback.filter(f => f.met).length;
      const score = Math.max(0.2, metCount / Math.max(1, req.rubricCriteria.length));

      return {
        score: Math.min(1.0, score),
        rubricFeedback: feedback,
        strengths: length > 20 ? ['Clear intuition expressed in your own terms'] : ['Good initial attempt'],
        improvements: ['Include formal relationships between components', 'Mention boundary conditions or edge cases'],
        overallNote: pass ? 'Promising synthesis. Deepen the formal rigor to reach full solid mastery.' : 'Explanation is too brief; please elaborate.'
      };
    };

    return this.client.generateStructuredResponse<ExplainBackResponse>({
      systemInstruction: systemPrompt,
      prompt,
      purpose: 'explain_back_eval',
      jsonSchemaDescription: `{ "score": number (0-1), "rubricFeedback": [{ "criterion": string, "met": boolean, "comment": string }], "strengths": string[], "improvements": string[], "overallNote": string }`,
      mockFallback: fallback
    });
  }
}
