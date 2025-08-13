export const colors = {
  primary: '#2B5CE6',
  secondary: '#6B7280',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#E5E7EB',
} as const;

export type Colors = typeof colors;
