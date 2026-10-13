import type { Variants } from "framer-motion";
import { TRANSITION_EASING, ANIMATION_DURATION } from "../constants";

/**
 * Directional sliding variants for Auth forms (Login <-> Register)
 * Strictly utilizes `transform: translateX` (GPU Compositor) and `opacity`
 */
export const authCardVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 55 : -55,
    opacity: 0,
    scale: 0.985,
    willChange: "transform, opacity",
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: "spring", stiffness: 320, damping: 30, mass: 0.9 },
      opacity: { duration: ANIMATION_DURATION.normal, ease: TRANSITION_EASING.smoothOut },
      scale: { duration: ANIMATION_DURATION.normal, ease: TRANSITION_EASING.smoothOut },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -55 : 55,
    opacity: 0,
    scale: 0.985,
    transition: {
      x: { duration: 0.24, ease: [0.4, 0, 1, 1] },
      opacity: { duration: 0.2 },
      scale: { duration: 0.2 },
    },
  }),
};

/**
 * Cross-fade + vertical slide for the left hero typography (Headline + Subtitle)
 */
export const authHeroVariants: Variants = {
  enter: {
    y: 18,
    opacity: 0,
    willChange: "transform, opacity",
  },
  center: {
    y: 0,
    opacity: 1,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: TRANSITION_EASING.smoothOut,
    },
  },
  exit: {
    y: -14,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
};

/**
 * Accessible fallback variants when user has prefers-reduced-motion active
 */
export const accessibleAuthCardVariants: Variants = {
  enter: {
    opacity: 0,
    x: 0,
    scale: 1,
  },
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.15 },
  },
  exit: {
    opacity: 0,
    x: 0,
    scale: 1,
    transition: { duration: 0.12 },
  },
};

export const accessibleHeroVariants: Variants = {
  enter: {
    opacity: 0,
    y: 0,
  },
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15 },
  },
  exit: {
    opacity: 0,
    y: 0,
    transition: { duration: 0.12 },
  },
};
