import { Question } from '../../../shared/types/database';
import { RepositoryFactory } from '../../../data/repositories/RepositoryFactory';
import { PerTopicStats } from '../../../data/repositories/AttemptRepository';

export interface StartExamParams {
  mode: 'practice' | 'full-exam' | 'custom' | 'weak-areas';
  packId?: string;
  topicIds?: string[];
  questionCount?: number;
  durationMinutes?: number;
  difficulty?: ('easy' | 'med' | 'hard')[];
}

export interface ExamResult {
  sessionId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number; // percentage
  timeSpent: number; // milliseconds
  perTopicStats: PerTopicStats;
}

export class ExamController {
  private static instance: ExamController;

  static getInstance(): ExamController {
    if (!ExamController.instance) {
      ExamController.instance = new ExamController();
    }
    return ExamController.instance;
  }

  /**
   * Get questions for an exam session based on mode and parameters
   */
  async getQuestionsForExam(params: StartExamParams): Promise<Question[]> {
    switch (params.mode) {
      case 'practice':
        return this.getPracticeQuestions(params);
      
      case 'full-exam':
        return this.getFullExamQuestions(params);
      
      case 'custom':
        return this.getCustomQuestions(params);
      
      case 'weak-areas':
        return this.getWeakAreaQuestions(params);
      
      default:
        throw new Error(`Unknown exam mode: ${params.mode}`);
    }
  }

  /**
   * Calculate exam results from answers
   */
  calculateResults(
    sessionId: string,
    questions: Question[],
    answers: Record<string, string[]>,
    timeSpent: number
  ): ExamResult {
    let correctCount = 0;
    const topicStats: Record<string, { correct: number; total: number }> = {};

    questions.forEach(question => {
      const userAnswer = answers[question.id] || [];
      const isCorrect = this.isAnswerCorrect(question, userAnswer);
      
      if (isCorrect) {
        correctCount++;
      }

      // Track per-topic stats
      question.topicIds.forEach(topicId => {
        if (!topicStats[topicId]) {
          topicStats[topicId] = { correct: 0, total: 0 };
        }
        topicStats[topicId].total++;
        if (isCorrect) {
          topicStats[topicId].correct++;
        }
      });
    });

    const score = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;

    // Convert topic stats to include percentage (PerTopicStats format)
    const perTopicStats: PerTopicStats = {};
    Object.entries(topicStats).forEach(([topicId, stats]) => {
      perTopicStats[topicId] = {
        ...stats,
        percentage: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
      };
    });

    return {
      sessionId,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      score,
      timeSpent,
      perTopicStats,
    };
  }

  /**
   * Save exam attempt to database
   */
  async saveExamAttempt(
    sessionId: string,
    questions: Question[],
    answers: Record<string, string[]>,
    timeSpentPerQuestion: Record<string, number>,
    packId: string,
    templateId?: string
  ): Promise<void> {
    const attemptRepo = RepositoryFactory.getAttemptRepository();
    
    // Calculate results
    const totalTimeSpent = Object.values(timeSpentPerQuestion).reduce((sum, time) => sum + time, 0);
    const results = this.calculateResults(sessionId, questions, answers, totalTimeSpent);

    // Save attempt - convert undefined to null for proper typing
    const templateIdValue = templateId === undefined ? null : templateId;
    await attemptRepo.startAttempt(sessionId, templateIdValue, packId);
    
    // Save individual answers
    for (const question of questions) {
      const userAnswer = answers[question.id] || [];
      const timeSpent = timeSpentPerQuestion[question.id] || 0;
      const isCorrect = this.isAnswerCorrect(question, userAnswer);
      
      await attemptRepo.recordAnswer(
        sessionId,
        question.id,
        userAnswer,
        timeSpent,
        isCorrect
      );
    }

    // Finalize attempt with results
    await attemptRepo.finalizeAttempt(sessionId, results.score, results.perTopicStats);
  }

  private async getPracticeQuestions(params: StartExamParams): Promise<Question[]> {
    const questionRepo = RepositoryFactory.getQuestionRepository();
    
    return questionRepo.sampleQuestions({
      topicIds: params.topicIds || [],
      difficulty: params.difficulty,
      packId: params.packId,
      limit: params.questionCount || 10,
    });
  }

  private async getFullExamQuestions(params: StartExamParams): Promise<Question[]> {
    // For CBAP-style exam: 150 questions, mixed difficulty
    const questionRepo = RepositoryFactory.getQuestionRepository();
    
    const allTopics = params.topicIds || [
      'planning',
      'elicitation',
      'requirements-analysis',
      'strategy-analysis',
      'stakeholder-engagement',
      'solution-evaluation'
    ];

    return questionRepo.sampleQuestions({
      topicIds: allTopics,
      packId: params.packId,
      limit: 150,
    });
  }

  private async getCustomQuestions(params: StartExamParams): Promise<Question[]> {
    const questionRepo = RepositoryFactory.getQuestionRepository();
    
    return questionRepo.sampleQuestions({
      topicIds: params.topicIds || [],
      difficulty: params.difficulty,
      packId: params.packId,
      limit: params.questionCount || 20,
    });
  }

  private async getWeakAreaQuestions(params: StartExamParams): Promise<Question[]> {
    // TODO: Implement actual weak area detection based on past performance
    // For now, just return random questions
    return this.getPracticeQuestions({
      ...params,
      questionCount: params.questionCount || 15,
    });
  }

  private isAnswerCorrect(question: Question, userAnswer: string[]): boolean {
    if (!question.correct || question.correct.length === 0) {
      return false;
    }

    // Sort both arrays for comparison
    const correctSorted = [...question.correct].sort();
    const userSorted = [...userAnswer].sort();

    // Check if arrays have same length and same elements
    return correctSorted.length === userSorted.length &&
           correctSorted.every((correct, index) => correct === userSorted[index]);
  }
}

export default ExamController;