import { Easing } from 'react-native-reanimated';

export const springConfig = {
  default: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  gentle: {
    damping: 20,
    stiffness: 120,
    mass: 1,
  },
  bouncy: {
    damping: 10,
    stiffness: 180,
    mass: 0.8,
  },
  stiff: {
    damping: 25,
    stiffness: 300,
    mass: 1,
  },
} as const;

export const timingConfig = {
  fast: {
    duration: 200,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
  normal: {
    duration: 300,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
  slow: {
    duration: 500,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
} as const;

export const motiPresets = {
  fadeInUp: {
    from: { opacity: 0, translateY: 20 },
    animate: { opacity: 1, translateY: 0 },
    transition: { type: 'timing' as const, duration: 400 },
  },
  fadeIn: {
    from: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { type: 'timing' as const, duration: 300 },
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: 'spring' as const, ...springConfig.default },
  },
  slideInRight: {
    from: { opacity: 0, translateX: 30 },
    animate: { opacity: 1, translateX: 0 },
    transition: { type: 'timing' as const, duration: 350 },
  },
  staggerItem: (index: number) => ({
    from: { opacity: 0, translateY: 15 },
    animate: { opacity: 1, translateY: 0 },
    transition: {
      type: 'timing' as const,
      duration: 350,
      delay: index * 80,
    },
  }),
} as const;

export const buttonPressScale = 0.97;
export const cardPressScale = 0.98;
export const hoverScale = 1.02;
