import type { Transition, Variants } from 'motion/react'

/** Shared-element morph: critically damped, about half a second, no overshoot. */
export const MORPH: Transition = { type: 'spring', visualDuration: 0.5, bounce: 0 }

/** Fade (with optional small offset) for content that supports a morph. */
export const FADE: Transition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] }

/** Delay step between staggered children, in seconds. */
export const STAGGER = 0.05

/** Sticker pop: fast spring with a small overshoot, for things that slap onto the page. */
export const POP: Transition = { type: 'spring', stiffness: 520, damping: 22, mass: 0.8 }

/** Softer spring for cards and blocks settling into place. */
export const SETTLE: Transition = { type: 'spring', stiffness: 260, damping: 24 }

/**
 * Slap-in for a sticker that rests at `rotate` degrees: it lands from slightly bigger and more
 * tilted, then settles, `delay` seconds after it is triggered. Use with `initial="hidden"` and
 * `whileInView="show"` (or `animate`). Under reduced motion pass `reduced` to get a plain fade.
 */
export function slapIn(rotate = 0, reduced = false, delay = 0): Variants {
  if (reduced) {
    return { hidden: { opacity: 0, rotate }, show: { opacity: 1, rotate, transition: { ...FADE, delay } } }
  }
  return {
    hidden: { opacity: 0, scale: 1.35, rotate: rotate + 9 },
    show: { opacity: 1, scale: 1, rotate, transition: { ...POP, delay } },
  }
}

/** Rise-in for cards: up from below with a soft spring. Reduced motion gets a plain fade. */
export function riseIn(reduced = false): Variants {
  if (reduced) return { hidden: { opacity: 0 }, show: { opacity: 1, transition: FADE } }
  return { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: SETTLE } }
}
