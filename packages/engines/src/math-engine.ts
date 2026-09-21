import { Item, GradeResult } from '@savant/core';
import { DomainEngine, FormatDef } from './engine-interface.js';
import { TutorService } from '@savant/tutor';

export class MathEngine implements DomainEngine {
  id = 'math';
  formats: FormatDef[] = [
    { format: 'computational', name: 'Computational Problem', description: 'CAS/Exact verified calculations' },
    { format: 'proof_scaffold', name: 'Proof Scaffold', description: 'Parsons-style logical step ordering' },
    { format: 'spot_the_error', name: 'Spot the Error', description: 'Find flaws in deceptive proofs' },
    { format: 'explain_back', name: 'Feynman Explain-Back', description: 'Rubric-graded conceptual synthesis' }
  ];

  private tutorService: TutorService;
  private verifierUrl: string;

  constructor(tutorService?: TutorService, verifierUrl: string = 'http://localhost:8001') {
    this.tutorService = tutorService || new TutorService();
    this.verifierUrl = verifierUrl;
  }

  async grade(item: Item, userResponse: any): Promise<GradeResult> {
    const key = item.answerKey;

    if (key.type === 'set-of-numbers') {
      // Parse response into array of numbers
      let userNums: number[] = [];
      if (Array.isArray(userResponse)) {
        userNums = userResponse.map(Number);
      } else if (typeof userResponse === 'string') {
        userNums = userResponse
          .replace(/[{}\[\]]/g, '')
          .split(/[\s,]+/)
          .filter(Boolean)
          .map(Number);
      }

      const targetNums = (key.value as number[]).map(Number).sort((a, b) => a - b);
      userNums.sort((a, b) => a - b);

      const isMatch =
        userNums.length === targetNums.length &&
        userNums.every((val, idx) => Math.abs(val - targetNums[idx]) < 0.001);

      return {
        score: isMatch ? 1.0 : 0.0,
        correct: isMatch,
        confidence: 'verified',
        errorTags: isMatch ? [] : ['computational_error'],
        feedback: isMatch ? 'Exact eigenvalues verified!' : `Expected ${JSON.stringify(targetNums)}, but received ${JSON.stringify(userNums)}.`,
        expertNotice: 'Notice how the sum of eigenvalues equals the trace of the matrix: tr(A) = 2 + 2 = 4 = 1 + 3.'
      };
    }

    if (key.type === 'ordered-sequence') {
      const userSeq = Array.isArray(userResponse) ? userResponse : [];
      const targetSeq = key.value as string[];

      const isMatch =
        userSeq.length === targetSeq.length &&
        userSeq.every((val, idx) => val === targetSeq[idx]);

      return {
        score: isMatch ? 1.0 : 0.0,
        correct: isMatch,
        confidence: 'verified',
        errorTags: isMatch ? [] : ['logical_ordering_error'],
        feedback: isMatch ? 'Logical proof deduction verified.' : 'Proof steps are out of deductive order.',
        expertNotice: 'A rigorous proof must always establish the algebraic definitions before applying recursive substitution.'
      };
    }

    if (key.type === 'rubric') {
      const rubricCriteria = key.rubricCriteria || [];
      const evalResult = await this.tutorService.evaluateExplainBack({
        skillId: item.skillId,
        topic: item.prompt,
        rubricCriteria,
        explanation: String(userResponse)
      });

      return {
        score: evalResult.score,
        correct: evalResult.score >= 0.7,
        confidence: 'rubric',
        errorTags: evalResult.score < 0.7 ? ['conceptual_gap'] : [],
        feedback: evalResult.overallNote,
        expertNotice: evalResult.strengths.length > 0 ? evalResult.strengths[0] : undefined
      };
    }

    // Default exact / multiple choice / numeric match
    const isExact = String(userResponse).trim().toLowerCase() === String(key.value).trim().toLowerCase();
    return {
      score: isExact ? 1.0 : 0.0,
      correct: isExact,
      confidence: 'verified',
      errorTags: isExact ? [] : ['answer_mismatch'],
      feedback: isExact ? 'Correct.' : `Expected: ${key.value}`,
      expertNotice: 'Focus on the structural definitions before computing.'
    };
  }

  async explain(item: Item, userResponse: any, grade: GradeResult): Promise<{
    explanation: string;
    expertNotice?: string;
    followUpTopic?: string;
  }> {
    return {
      explanation: item.solution,
      expertNotice: grade.expertNotice || 'An expert first checks the invariant structure before solving algebraically.',
      followUpTopic: item.skillId
    };
  }
}
