import { Easing } from 'react-native-reanimated';

export const ANIMATION_DURATIONS = {
  modalEnter: 220,
  modalBackdropExit: 200,
  modalSlideExit: 260,
  pageSlide: 300,
  pageFade: 250,
  pressIn: 80,
  pressOut: 200,
  chatPreviewEnter: 200,
  chatPreviewExit: 160,
  chatAttachMenuEnter: 180,
  chatAttachMenuExit: 150,
} as const;

export const SPRING_CONFIGS = {
  expand: {
    damping: 26,
    stiffness: 230,
    mass: 0.85,
  },
} as const;

export const EASING = {
  outCubic: Easing.out(Easing.cubic),
  inCubic: Easing.in(Easing.cubic),
} as const;
