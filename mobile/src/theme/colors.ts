export const colors = {
  primary: {
    navy: '#1B3A5C',
    blue: '#2E75B6',
    accent: '#1F6099',
    light: '#D6E4F0',
    mid: '#BDD7EE',
    fixed: '#005C9B',
    fixedDim: '#2E75B6',
    container: '#2E75B6',
    onPrimaryFixed: '#001D36',
  },

  surface: {
    base: '#F8F9FF',
    low: '#F2F3F9',
    card: '#FFFFFF',
    high: '#E6E8EE',
  },

  text: {
    heading: '#101828',
    body: '#344054',
    muted: '#667085',
    onPrimary: '#FFFFFF',
    onSurface: '#191C20',
  },

  semantic: {
    success: '#12B76A',
    successLight: '#ECFDF3',
    warning: '#F79009',
    warningLight: '#FFFAEB',
    error: '#F04438',
    errorLight: '#FEF3F2',
    errorContainer: '#FEF3F2',
  },

  outline: {
    default: 'rgba(189, 215, 238, 0.15)',
    variant: 'rgba(189, 215, 238, 0.15)',
  },

  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#191C20',

  gradient: {
    primary: ['#005C9B', '#2E75B6'] as const,
    primaryAngle: 135,
  },

  shadow: {
    color: 'rgba(25, 28, 32, 0.06)',
  },
} as const;

export type Colors = typeof colors;
