import { Question } from '../../../shared/types/database';
import { RepositoryFactory } from '../../../data/repositories/RepositoryFactory';

export interface SamplingParams {
  topicIds?: string[];
  difficulty?: ('easy' | 'med' | 'hard')[];
  packId?: string;
  excludeIds?: string[];
  limit: number;
}

export interface ExamTemplate {
  id: string;
  name: string;
  durationMinutes: number;
  sections: {
    topicIds: string[];
    count: number;
    difficultyMix?: {
      easy: number;
      med: number;
      hard: number;
    };
  }[];
}

export class QuestionSampler {
  async sampleForPractice(params: SamplingParams): Promise<Question[]> {
    const questionRepo = RepositoryFactory.getQuestionRepository();
    
    return await questionRepo.sampleQuestions({
      topicIds: params.topicIds || [],
      difficulty: params.difficulty,
      packId: params.packId,
      excludeIds: params.excludeIds,
      limit: params.limit,
    });
  }

  async sampleForTemplate(template: ExamTemplate, packId: string): Promise<Question[]> {
    const questionRepo = RepositoryFactory.getQuestionRepository();
    const allQuestions: Question[] = [];

    for (const section of template.sections) {
      if (section.difficultyMix) {
        // Sample by difficulty mix
        for (const [difficulty, count] of Object.entries(section.difficultyMix)) {
          if (count > 0) {
            const questions = await questionRepo.sampleQuestions({
              topicIds: section.topicIds,
              difficulty: [difficulty as 'easy' | 'med' | 'hard'],
              packId,
              excludeIds: allQuestions.map(q => q.id),
              limit: count,
            });
            allQuestions.push(...questions);
          }
        }
      } else {
        // Sample without difficulty constraints
        const questions = await questionRepo.sampleQuestions({
          topicIds: section.topicIds,
          packId,
          excludeIds: allQuestions.map(q => q.id),
          limit: section.count,
        });
        allQuestions.push(...questions);
      }
    }

    // Shuffle final questions
    return this.shuffleArray(allQuestions);
  }

  async getWeakAreaQuestions(
    topicProficiency: Record<string, number>,
    limit: number,
    packId?: string
  ): Promise<Question[]> {
    // Find topics with proficiency < 0.7
    const weakTopics = Object.entries(topicProficiency)
      .filter(([_, proficiency]) => proficiency < 0.7)
      .map(([topicId]) => topicId);

    if (weakTopics.length === 0) {
      // If no weak areas, sample randomly
      return this.sampleForPractice({
        limit,
        packId,
      });
    }

    return this.sampleForPractice({
      topicIds: weakTopics,
      limit,
      packId,
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}