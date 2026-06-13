// App-wide theme constants
export const Colors = {
  bg: '#0D0F14',
  card: '#1A1D27',
  cardAlt: '#20243A',
  border: '#2A2D3E',
  accent: '#F5A623',
  accentDark: '#C47D0A',
  accentLight: '#FFD080',
  success: '#4CAF82',
  danger: '#E05C5C',
  warning: '#F5A623',
  textPrimary: '#F0F0F0',
  textSecondary: '#8A8FA0',
  textMuted: '#555970',
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 42,
} as const;
