import type { Transition } from 'motion/react'

/** Shared-element morph: critically damped, about half a second, no overshoot. */
export const MORPH: Transition = { type: 'spring', visualDuration: 0.5, bounce: 0 }

/** Fade (with optional small offset) for content that supports a morph. */
export const FADE: Transition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] }

/** Delay step between staggered children, in seconds. */
export const STAGGER = 0.05
