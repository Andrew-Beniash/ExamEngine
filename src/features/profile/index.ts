// Main screen
export { default as ProfileScreen } from './ProfileScreen';

// Components
export { default as ProfileDashboard } from './components/ProfileDashboard';
export { default as SettingsScreen } from './components/SettingsScreen';
export { default as ContentPackManagement } from './components/ContentPackManagement';

// Hooks
export {
  useProfile,
  usePreferences,
  useProfileStats,
  useTopicProficiencies,
  useAppSettings,
} from './hooks/useProfile';

// Types
export type {
  UseProfileState,
  UseProfileActions,
} from './hooks/useProfile';

export type {
  UserPreferences,
  ProfileStats,
  TopicProficiency,
} from '../../data/repositories/UserPreferencesRepository';