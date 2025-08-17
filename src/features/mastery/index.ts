// Core mastery engine
export { MasteryEngine } from './MasteryEngine';

// Hooks
export { useMastery } from './hooks/useMastery';

// Components
export { default as MasteryDashboard } from './components/MasteryDashboard';
export { default as PracticeRecommendations } from './components/PracticeRecommendations';

// Types (re-export from shared)
export type {
  TopicProficiency,
  WeakArea,
  PracticeRecommendation,
  LearningSession,
  MasteryGoal,
  MasteryConfig,
} from '../../shared/types/mastery';

// Constants
export { DEFAULT_MASTERY_CONFIG } from '../../shared/types/mastery';