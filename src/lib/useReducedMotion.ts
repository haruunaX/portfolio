import { useSyncExternalStore } from 'react'

/** The OS reduced-motion preference. Read `.matches` outside React (for example in initial state). */
export const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

function subscribe(onChange: () => void) {
  reducedMotionQuery.addEventListener('change', onChange)
  return () => reducedMotionQuery.removeEventListener('change', onChange)
}

function getSnapshot() {
  return reducedMotionQuery.matches
}

/**
 * Live reduced-motion preference: components re-render when it changes on an open page.
 * (Motion's own useReducedMotion only snapshots the value once, so it is not used.)
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot)
}
