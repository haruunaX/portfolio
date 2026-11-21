import { useEffect, useState, type ReactNode, type RefObject } from 'react'
import { finePointer } from '../lib/pointer'
import Sticker from './Sticker'
import './StickerField.css'

type StickerFieldProps = {
  /** Positioned container the stickers may be dragged around inside (the hero section). */
  dragArea: RefObject<HTMLElement | null>
  /** Slaps the stickers on once the intro is over. */
  show: boolean
}

/** Closed scalloped seal outline: `points` bumps on a circle that wobbles between two radii. */
function scallop(points: number, outer: number, inner: number): string {
  const steps = points * 2
  let d = ''
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? outer : inner
    d += `${i === 0 ? 'M' : 'L'}${(50 + Math.cos(a) * r).toFixed(1)} ${(50 + Math.sin(a) * r).toFixed(1)}`
  }
  return `${d}Z`
}

const SEAL_PATH = scallop(14, 47, 41)

function Star() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path
        className="sf__ink"
        fill="var(--lime)"
        d="M50 6l12.4 27.2 29.6 3.3-22 20 6.2 29.2L50 71.3 23.8 85.7 30 56.5l-22-20 29.6-3.3z"
      />
      <path className="sf__shine" d="M36 30l8-13" />
    </svg>
  )
}

function Bubble() {
  return (
    <svg viewBox="0 0 120 92" aria-hidden="true">
      <path
        className="sf__ink"
        fill="var(--sky)"
        d="M22 6h76a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H62L38 88V70H22A16 16 0 0 1 6 54V22A16 16 0 0 1 22 6z"
      />
      <text className="sf__text" x="60" y="52" textAnchor="middle" fontSize="38" fill="var(--ink)">
        hi!
      </text>
    </svg>
  )
}

function Tag() {
  return (
    <svg viewBox="0 0 110 70" aria-hidden="true">
      <rect className="sf__ink" x="6" y="6" width="98" height="58" rx="16" fill="var(--grape)" />
      <text className="sf__text" x="55" y="46" textAnchor="middle" fontSize="30" fill="var(--cream)">
        {'</>'}
      </text>
    </svg>
  )
}

function Sparkle() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path
        className="sf__ink"
        fill="var(--paper)"
        d="M50 5C54 33 67 46 95 50 67 54 54 67 50 95 46 67 33 54 5 50 33 46 46 33 50 5z"
      />
    </svg>
  )
}

function Cap() {
  return (
    <svg viewBox="0 0 110 90" aria-hidden="true">
      <path className="sf__ink" fill="var(--ink)" d="M28 42v22c0 8 12 15 27 15s27-7 27-15V42L55 54z" />
      <path className="sf__ink" fill="var(--ink)" d="M55 10l49 21-49 21L6 31z" />
      <path className="sf__lime" d="M28 63c18 8 36 8 54 0" />
      <circle className="sf__ink" cx="55" cy="31" r="6" fill="var(--lime)" />
      <path className="sf__lime" d="M55 31l36 14v22" />
      <circle className="sf__ink" cx="91" cy="70" r="6" fill="var(--lime)" />
    </svg>
  )
}

function Seal() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path className="sf__ink" fill="var(--paper)" d={SEAL_PATH} />
      <circle className="sf__thin" cx="50" cy="50" r="33" fill="none" />
      <text className="sf__text" x="50" y="62" textAnchor="middle" fontSize="34" fill="var(--ink)">
        HS
      </text>
    </svg>
  )
}

function Heart() {
  return (
    <svg viewBox="0 0 100 90" aria-hidden="true">
      <path
        className="sf__ink"
        fill="var(--grape)"
        d="M50 84C20 62 6 46 6 28 6 15 16 6 29 6c9 0 17 5 21 13 4-8 12-13 21-13 13 0 23 9 23 22 0 18-14 34-44 56z"
      />
      <path className="sf__shine" d="M24 26c1-6 5-10 11-11" />
    </svg>
  )
}

type Item = {
  id: string
  rotate: number
  float?: boolean
  /** Only shown from the desktop breakpoint up; phones keep the first four. */
  extra?: boolean
  node: ReactNode
}

/** Fixed rotations and order: positions live in StickerField.css, one `sf--<id>` class each. */
const ITEMS: readonly Item[] = [
  { id: 'star', rotate: -12, float: true, node: <Star /> },
  { id: 'bubble', rotate: 7, float: true, node: <Bubble /> },
  { id: 'tag', rotate: -5, node: <Tag /> },
  { id: 'seal', rotate: 9, node: <Seal /> },
  { id: 'cap', rotate: -8, float: true, extra: true, node: <Cap /> },
  { id: 'sparkle', rotate: 14, extra: true, node: <Sparkle /> },
  { id: 'heart', rotate: 11, float: true, extra: true, node: <Heart /> },
]

/** Decorative die-cut stickers scattered over the hero margins. Draggable on fine pointers. */
export default function StickerField({ dragArea, show }: StickerFieldProps) {
  // On a window resize Motion keeps each sticker at the same relative spot in the re-measured hero,
  // which can land a resting sticker on the copy. Remounting after the resize sends every sticker
  // home. Touch screens skip this: they cannot drag, and their URL bar resizes the window on scroll.
  const [layout, setLayout] = useState(0)
  useEffect(() => {
    if (!finePointer) return
    let timer = 0
    const onResize = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setLayout((n) => n + 1), 250)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <div className="stickerfield" aria-hidden="true" key={layout}>
      {ITEMS.map((s, i) => (
        <Sticker
          key={s.id}
          className={`sf sf--${s.id}${s.extra ? ' sf--extra' : ''}`}
          rotate={s.rotate}
          dragArea={dragArea}
          float={s.float}
          show={show}
          appear={layout === 0}
          delay={0.2 + i * 0.11}
        >
          {s.node}
        </Sticker>
      ))}
    </div>
  )
}
