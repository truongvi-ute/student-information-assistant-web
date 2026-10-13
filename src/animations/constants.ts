/**
 * Animation constants and easing presets
 * Strictly adhering to GPU Compositor-only animation principles
 */

export const TRANSITION_EASING = {
  // Cubic bezier for swift enter with smooth deceleration (Expo Out)
  smoothOut: [0.16, 1, 0.3, 1] as const,
  // Standard easeInOut
  easeInOut: [0.4, 0, 0.2, 1] as const,
  // Spring configurations
  springTight: {
    type: "spring",
    stiffness: 320,
    damping: 32,
    mass: 0.8,
  } as const,
  springGentle: {
    type: "spring",
    stiffness: 240,
    damping: 28,
  } as const,
};

export const ANIMATION_DURATION = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.38,
  slow: 0.55,
};
