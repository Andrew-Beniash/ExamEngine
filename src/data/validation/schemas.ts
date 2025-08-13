export const MANIFEST_SCHEMA = {
  type: 'object',
  required: ['id', 'version', 'name', 'description', 'author', 'minAppVersion', 'checksum', 'signature', 'createdAt', 'files'],
  properties: {
    id: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$' },
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    name: { type: 'string', minLength: 1, maxLength: 100 },
    description: { type: 'string', minLength: 1, maxLength: 500 },
    author: { type: 'string', minLength: 1, maxLength: 100 },
    minAppVersion: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    maxAppVersion: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    checksum: { type: 'string', pattern: '^[a-fA-F0-9]{64}$' },
    signature: { type: 'string' },
    createdAt: { type: 'number', minimum: 0 },
    files: {
      type: 'object',
      required: ['questions', 'examTemplates', 'tips'],
      properties: {
        questions: { type: 'string' },
        examTemplates: { type: 'string' },
        tips: { type: 'string' },
        media: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    },
    metadata: {
      type: 'object',
      properties: {
        totalQuestions: { type: 'number', minimum: 0 },
        totalTips: { type: 'number', minimum: 0 },
        totalTemplates: { type: 'number', minimum: 0 },
        topics: {
          type: 'array',
          items: { type: 'string' }
        },
        supportedLanguages: {
          type: 'array',
          items: { type: 'string', pattern: '^[a-z]{2}(-[A-Z]{2})?$' }
        }
      }
    }
  }
};

export const QUESTION_SCHEMA = {
  type: 'object',
  required: ['id', 'type', 'stem', 'topicIds', 'difficulty'],
  properties: {
    id: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$' },
    type: { 
      type: 'string', 
      enum: ['single', 'multi', 'scenario', 'order'] 
    },
    stem: { type: 'string', minLength: 10 },
    topicIds: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1
    },
    choices: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'text'],
        properties: {
          id: { type: 'string' },
          text: { type: 'string', minLength: 1 }
        }
      }
    },
    correct: {
      type: 'array',
      items: { type: 'string' }
    },
    correctOrder: {
      type: 'array',
      items: { type: 'string' }
    },
    exhibits: {
      type: 'array',
      items: { type: 'string' }
    },
    difficulty: {
      type: 'string',
      enum: ['easy', 'med', 'hard']
    },
    explanation: { type: 'string' }
  }
};

export const EXAM_TEMPLATE_SCHEMA = {
  type: 'object',
  required: ['id', 'name', 'durationMinutes', 'sections'],
  properties: {
    id: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$' },
    name: { type: 'string', minLength: 1, maxLength: 100 },
    durationMinutes: { type: 'number', minimum: 1, maximum: 600 },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        required: ['topicIds', 'count'],
        properties: {
          topicIds: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1
          },
          count: { type: 'number', minimum: 1 },
          difficultyMix: {
            type: 'object',
            properties: {
              easy: { type: 'number', minimum: 0, maximum: 1 },
              med: { type: 'number', minimum: 0, maximum: 1 },
              hard: { type: 'number', minimum: 0, maximum: 1 }
            }
          }
        }
      },
      minItems: 1
    },
    calculatorRules: { type: 'object' }
  }
};

export const TIP_SCHEMA = {
  type: 'object',
  required: ['id', 'topicIds', 'title', 'body'],
  properties: {
    id: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$' },
    topicIds: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1
    },
    title: { type: 'string', minLength: 1, maxLength: 200 },
    body: { type: 'string', minLength: 10 },
    tags: {
      type: 'array',
      items: { type: 'string' }
    },
    relatedQuestionIds: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};