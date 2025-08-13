export { colors, type Colors } from './colors';
export { spacing, type Spacing } from './spacing';
export { typography, type Typography } from './typography';

export const theme = {
  colors,
  spacing,
  typography,
} as const;

export type Theme = typeof theme;
