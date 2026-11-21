import { useRef } from 'react'
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'
import { useReducedMotion } from '../lib/useReducedMotion'
import './MarqueeBand.css'

const WORDS = [
  'Cum Laude',
  'BS IT',
  'CTU 2026',
  'Full-stack dev',
  'IT Executive Assistant',
  'Professional tab hoarder',
]

/** Four copies; the track shifts by half its width, so the loop has no seam. */
const COPIES = [0, 1, 2, 3]

/** Resting speed: half the track every 40 seconds, in percent of the track width per second. */
const BASE_SPEED = 50 / 40

/** Scroll speed (px/s) that doubles the marquee speed. */
const BOOST_PER_PX = 1 / 450
const MAX_BOOST = 6
const MAX_SKEW = 9

function wrapPercent(value: number): number {
  // Keep the offset inside (-50, 0]; the two halves of the track are identical.
  const wrapped = value % 50
  return wrapped > 0 ? wrapped - 50 : wrapped
}

function Star() {
  return (
    <svg className="marquee__star" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 2.2l2.9 6.5 7.1.7-5.3 4.7 1.6 7-6.3-3.7-6.3 3.7 1.6-7L2 9.4l7.1-.7z"
        fill="var(--pink)"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function MarqueeBand() {
  const reduceMotion = useReducedMotion()
  const bandRef = useRef<HTMLDivElement>(null)
  const inView = useInView(bandRef)

  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(velocity, { damping: 40, stiffness: 300 })

  const offset = useMotionValue(0)
  const x = useTransform(offset, (value) => `${wrapPercent(value)}%`)
  const skewX = useTransform(smoothVelocity, (value) => {
    const skew = -value / 160
    return Math.max(-MAX_SKEW, Math.min(MAX_SKEW, skew))
  })

  useAnimationFrame((_time, delta) => {
    if (reduceMotion || !inView) return
    const boost = Math.min(MAX_BOOST, Math.abs(smoothVelocity.get()) * BOOST_PER_PX)
    offset.set(offset.get() - BASE_SPEED * (1 + boost) * (delta / 1000))
  })

  return (
    <div
      ref={bandRef}
      className={`marquee${reduceMotion ? ' marquee--still' : ''}`}
      aria-hidden="true"
    >
      <div className="marquee__ribbon">
        <motion.div className="marquee__track" style={reduceMotion ? undefined : { x, skewX }}>
          {COPIES.map((copy) =>
            WORDS.map((word) => (
              <span className="marquee__word" key={`${copy}-${word}`}>
                {word}
                <Star />
              </span>
            )),
          )}
        </motion.div>
      </div>
    </div>
  )
}
