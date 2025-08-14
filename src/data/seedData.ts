import { Question } from '../shared/types/database';

export const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 'q1',
    type: 'single',
    stem: 'What is the primary purpose of business analysis?',
    topicIds: ['planning'],
    choices: [
      { id: 'a', text: 'To manage project schedules' },
      { id: 'b', text: 'To analyze business needs and find solutions' },
      { id: 'c', text: 'To write technical documentation' },
      { id: 'd', text: 'To conduct team meetings' }
    ],
    correct: ['b'],
    difficulty: 'easy',
    explanation: 'Business analysis is primarily about understanding business needs and identifying solutions to business problems.',
    packId: 'sample-pack'
  },
  {
    id: 'q2',
    type: 'single',
    stem: 'Which of the following is a key stakeholder in most business analysis activities?',
    topicIds: ['stakeholder-engagement'],
    choices: [
      { id: 'a', text: 'Project manager only' },
      { id: 'b', text: 'Business sponsor' },
      { id: 'c', text: 'Technical lead only' },
      { id: 'd', text: 'Database administrator' }
    ],
    correct: ['b'],
    difficulty: 'easy',
    explanation: 'The business sponsor is typically a key stakeholder as they provide funding and strategic direction for the initiative.',
    packId: 'sample-pack'
  },
  {
    id: 'q3',
    type: 'multi',
    stem: 'Which of the following are valid elicitation techniques? (Select 2)',
    topicIds: ['elicitation'],
    choices: [
      { id: 'a', text: 'Interviews' },
      { id: 'b', text: 'Workshops' },
      { id: 'c', text: 'Code compilation' },
      { id: 'd', text: 'Network configuration' }
    ],
    correct: ['a', 'b'],
    difficulty: 'med',
    explanation: 'Interviews and workshops are both common and effective elicitation techniques used by business analysts.',
    packId: 'sample-pack'
  },
  {
    id: 'q4',
    type: 'single',
    stem: 'What does BABOK stand for?',
    topicIds: ['planning'],
    choices: [
      { id: 'a', text: 'Business Analysis Body of Knowledge' },
      { id: 'b', text: 'Business Application Book of Knowledge' },
      { id: 'c', text: 'Business Architecture Body of Knowledge' },
      { id: 'd', text: 'Business Analysis Book of Concepts' }
    ],
    correct: ['a'],
    difficulty: 'easy',
    explanation: 'BABOK stands for Business Analysis Body of Knowledge, which is the guide that defines the profession of business analysis.',
    packId: 'sample-pack'
  },
  {
    id: 'q5',
    type: 'single',
    stem: 'Requirements that describe what a solution must do are called:',
    topicIds: ['requirements-analysis'],
    choices: [
      { id: 'a', text: 'Non-functional requirements' },
      { id: 'b', text: 'Functional requirements' },
      { id: 'c', text: 'Business requirements' },
      { id: 'd', text: 'Transition requirements' }
    ],
    correct: ['b'],
    difficulty: 'med',
    explanation: 'Functional requirements describe the specific behavior or functions that a solution must perform.',
    packId: 'sample-pack'
  },
  {
    id: 'q6',
    type: 'multi',
    stem: 'Which of the following are types of requirements? (Select 3)',
    topicIds: ['requirements-analysis'],
    choices: [
      { id: 'a', text: 'Business requirements' },
      { id: 'b', text: 'Functional requirements' },
      { id: 'c', text: 'Marketing requirements' },
      { id: 'd', text: 'Non-functional requirements' },
      { id: 'e', text: 'Database requirements' }
    ],
    correct: ['a', 'b', 'd'],
    difficulty: 'med',
    explanation: 'Business, functional, and non-functional requirements are the three main categories of requirements in business analysis.',
    packId: 'sample-pack'
  },
  {
    id: 'q7',
    type: 'single',
    stem: 'The process of formally accepting completed requirements deliverables is called:',
    topicIds: ['requirements-analysis'],
    choices: [
      { id: 'a', text: 'Requirements validation' },
      { id: 'b', text: 'Requirements verification' },
      { id: 'c', text: 'Requirements approval' },
      { id: 'd', text: 'Requirements sign-off' }
    ],
    correct: ['c'],
    difficulty: 'hard',
    explanation: 'Requirements approval is the formal process of accepting completed requirements deliverables.',
    packId: 'sample-pack'
  },
  {
    id: 'q8',
    type: 'single',
    stem: 'Which knowledge area focuses on understanding the business need and defining the solution scope?',
    topicIds: ['planning'],
    choices: [
      { id: 'a', text: 'Business Analysis Planning and Monitoring' },
      { id: 'b', text: 'Requirements Analysis and Design Definition' },
      { id: 'c', text: 'Strategy Analysis' },
      { id: 'd', text: 'Solution Evaluation' }
    ],
    correct: ['c'],
    difficulty: 'hard',
    explanation: 'Strategy Analysis focuses on understanding business needs, defining solution scope, and identifying the best approach.',
    packId: 'sample-pack'
  },
  {
    id: 'q9',
    type: 'single',
    stem: 'A technique used to identify the root cause of a problem is:',
    topicIds: ['strategy-analysis'],
    choices: [
      { id: 'a', text: 'SWOT Analysis' },
      { id: 'b', text: 'Root Cause Analysis' },
      { id: 'c', text: 'Gap Analysis' },
      { id: 'd', text: 'Process Modeling' }
    ],
    correct: ['b'],
    difficulty: 'easy',
    explanation: 'Root Cause Analysis is specifically designed to identify the underlying causes of problems.',
    packId: 'sample-pack'
  },
  {
    id: 'q10',
    type: 'single',
    stem: 'The technique of observing business processes as they are currently performed is called:',
    topicIds: ['elicitation'],
    choices: [
      { id: 'a', text: 'Job shadowing' },
      { id: 'b', text: 'Process observation' },
      { id: 'c', text: 'Workflow analysis' },
      { id: 'd', text: 'All of the above' }
    ],
    correct: ['d'],
    difficulty: 'med',
    explanation: 'Job shadowing, process observation, and workflow analysis all involve observing current business processes.',
    packId: 'sample-pack'
  }
];

export class SeedDataManager {
  static async seedSampleQuestions(): Promise<void> {
    try {
      const { RepositoryFactory } = await import('./repositories/RepositoryFactory');
      const questionRepo = RepositoryFactory.getQuestionRepository();
      
      // Check if questions already exist
      const existingQuestions = await questionRepo.getByIds(['q1']);
      if (existingQuestions.length > 0) {
        console.log('Sample questions already exist, skipping seed');
        return;
      }
      
      // Insert all sample questions
      await questionRepo.createMany(SAMPLE_QUESTIONS);
      console.log(`Seeded ${SAMPLE_QUESTIONS.length} sample questions`);
    } catch (error) {
      console.error('Failed to seed sample questions:', error);
    }
  }
}