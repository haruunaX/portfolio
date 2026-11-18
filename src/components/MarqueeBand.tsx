import { useReducedMotion } from '../lib/useReducedMotion'
import './MarqueeBand.css'

const WORDS = [
  'Cum Laude',
  'BS IT',
  'CTU 2026',
  'Full-stack dev',
  'IT Executive Assistant',
  'Cebu, Philippines',
  'Professional tab hoarder',
]

/** Four copies; the track shifts by half its width, so the loop has no seam. */
const COPIES = [0, 1, 2, 3]

export default function MarqueeBand() {
  const reduceMotion = useReducedMotion()

  return (
    <div className={`marquee${reduceMotion ? ' marquee--still' : ''}`} aria-hidden="true">
      <div className="marquee__ribbon">
        <div className="marquee__track">
          {COPIES.map((copy) =>
            WORDS.map((word) => (
              <span className="marquee__word" key={`${copy}-${word}`}>
                {word}
              </span>
            )),
          )}
        </div>
      </div>
    </div>
  )
}
