import { useAnimate } from 'motion/react'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useReducedMotion } from '../lib/useReducedMotion'
import './Buddy.css'

export type BuddyPose = 'wave' | 'point' | 'sign' | 'cheer' | 'peek'

type BuddyProps = {
  pose?: BuddyPose
  /** Text on the little sign, for pose "sign". */
  sign?: string
  /** Rendered height in px. Width follows the artwork's aspect ratio. */
  size?: number
  /** Mirror the body so Buddy faces left. Text on Buddy (sign, monogram) is never mirrored. */
  flip?: boolean
  className?: string
  /** Accessible name. Without it Buddy is decorative and hidden from assistive tech. */
  label?: string
}

/* ── Artwork (viewBox units) ─────────────────────────────────────────────── */

const VB_W = 190
const VB_H = 190

const INK = '#1B1035'
const GRAPE = '#6A2BFF'
const CREAM = '#FFF6EC'
const PINK = '#FF4FA0'
const LIME = '#C6F432'
const SKY = '#36C5F0'
const WHITE = '#FFFFFF'

/** Outline, die-cut ring and arm thickness. At 120px tall one unit is about 0.63px, so OUTLINE is about 3px. */
const OUTLINE = 5
const RING = 5
const ARM = 14
const SHADOW = 'translate(6 7)'

const EYE_R = 15
const PUPIL_R = 7.5
/** How far a pupil can travel inside its eye. */
const PUPIL_TRAVEL = 5.5
const EYE_L = { x: 74, y: 72 }
const EYE_R_POS = { x: 116, y: 72 }

type Layer = 'shadow' | 'ring' | 'main'

type Limb = {
  d: string
  /** Shoulder, the pivot for arm animations. */
  origin: string
  animation?: string
}

type Pose = {
  left: Limb
  right: Limb
}

const POSES: Record<BuddyPose, Pose> = {
  wave: {
    left: { d: 'M52 100 L36 124', origin: '52px 100px' },
    right: { d: 'M138 96 L164 58', origin: '138px 96px', animation: 'buddy__arm--wave' },
  },
  point: {
    left: { d: 'M52 100 L36 124', origin: '52px 100px' },
    right: { d: 'M138 100 L170 96', origin: '138px 100px', animation: 'buddy__arm--point' },
  },
  sign: {
    left: { d: 'M54 98 L44 126', origin: '54px 98px' },
    right: { d: 'M136 98 L146 126', origin: '136px 98px' },
  },
  cheer: {
    left: { d: 'M52 96 L26 56', origin: '52px 96px', animation: 'buddy__arm--cheer-l' },
    right: { d: 'M138 96 L164 56', origin: '138px 96px', animation: 'buddy__arm--cheer-r' },
  },
  peek: {
    left: { d: 'M52 108 L30 98', origin: '52px 108px' },
    right: { d: 'M138 108 L160 98', origin: '138px 108px' },
  },
}

const SPARKS: ReadonlyArray<{ x: number; y: number; color: string; delay: number }> = [
  { x: 22, y: 24, color: LIME, delay: 0 },
  { x: 170, y: 22, color: SKY, delay: 0.25 },
  { x: 96, y: 12, color: PINK, delay: 0.5 },
  { x: 178, y: 94, color: LIME, delay: 0.75 },
]

const SPARK_PATH = 'M0 -10 Q1.6 -1.6 10 0 Q1.6 1.6 0 10 Q-1.6 1.6 -10 0 Q-1.6 -1.6 0 -10Z'

const SAYINGS = ['hi!', 'yay!', 'hehe'] as const

/** Paint for a filled silhouette part on each layer: hard shadow, white die-cut ring, grape body with ink outline. */
function fillPaint(layer: Layer, fill: string = GRAPE) {
  if (layer === 'shadow') return { fill: INK, stroke: INK, strokeWidth: OUTLINE, strokeLinejoin: 'round' as const }
  if (layer === 'ring') return { fill: WHITE, stroke: WHITE, strokeWidth: OUTLINE + RING * 2, strokeLinejoin: 'round' as const }
  return { fill, stroke: INK, strokeWidth: OUTLINE, strokeLinejoin: 'round' as const }
}

function limbPaint(layer: Layer, width: number) {
  return { fill: 'none', strokeWidth: width, strokeLinecap: 'round' as const, stroke: layer === 'ring' ? WHITE : INK }
}

function LimbShape({ layer, limb }: { layer: Layer; limb: Limb }) {
  const style: CSSProperties = { transformOrigin: limb.origin }
  return (
    <g className={limb.animation} style={style}>
      {layer === 'main' ? (
        <>
          <path d={limb.d} {...limbPaint('main', ARM + OUTLINE * 2)} />
          <path d={limb.d} fill="none" stroke={GRAPE} strokeWidth={ARM} strokeLinecap="round" />
        </>
      ) : (
        <path d={limb.d} {...limbPaint(layer, layer === 'ring' ? ARM + OUTLINE * 2 + RING * 2 : ARM + OUTLINE * 2)} />
      )}
    </g>
  )
}

/** The whole silhouette (feet, arms, body, sign). Drawn three times: shadow, die-cut ring, then the real thing. */
function Figure({ layer, pose, flip }: { layer: Layer; pose: BuddyPose; flip: boolean }) {
  const p = POSES[pose]
  const content: ReactNode = (
    <>
      <ellipse cx={72} cy={155} rx={15} ry={9} {...fillPaint(layer)} />
      <ellipse cx={118} cy={155} rx={15} ry={9} {...fillPaint(layer)} />
      <LimbShape layer={layer} limb={p.left} />
      <LimbShape layer={layer} limb={p.right} />
      <rect x={45} y={32} width={100} height={120} rx={40} {...fillPaint(layer)} />
      {pose === 'sign' && (
        <>
          <rect x={40} y={103} width={110} height={42} rx={8} transform="rotate(-2 95 124)" {...fillPaint(layer, WHITE)} />
          <circle cx={44} cy={126} r={9} {...fillPaint(layer)} />
          <circle cx={146} cy={126} r={9} {...fillPaint(layer)} />
        </>
      )}
    </>
  )
  const mirror = flip ? `translate(${VB_W} 0) scale(-1 1)` : undefined
  return (
    <g transform={layer === 'shadow' ? SHADOW : undefined}>
      <g transform={mirror}>{content}</g>
    </g>
  )
}

function signFontSize(text: string): number {
  return Math.max(12, Math.min(26, 92 / (0.42 * Math.max(1, text.length))))
}

/* ── One shared pointer tracker for every Buddy on the page ─────────────── */

type Tracker = { svg: SVGSVGElement; left: SVGGElement; right: SVGGElement }

const trackers = new Set<Tracker>()
const targets: number[] = []
let pointerX = 0
let pointerY = 0
let frame = 0

/** Unit direction scaled by how far away the pointer is, so pupils ease in as the pointer nears. */
function pupilOffset(rect: DOMRect, eye: { x: number; y: number }, out: number[]) {
  const scale = rect.width / VB_W
  const dx = pointerX - (rect.left + eye.x * scale)
  const dy = pointerY - (rect.top + eye.y * scale)
  const dist = Math.hypot(dx, dy)
  if (dist < 0.5) {
    out.push(0, 0)
    return
  }
  const reach = PUPIL_TRAVEL * Math.min(1, dist / 90)
  out.push((dx / dist) * reach, (dy / dist) * reach)
}

function writePupil(el: SVGGElement, x: number, y: number) {
  el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`
}

function flush() {
  frame = 0
  // Read every rect first, then write, so several Buddies never thrash layout.
  targets.length = 0
  for (const t of trackers) {
    const rect = t.svg.getBoundingClientRect()
    if (rect.width === 0) targets.push(0, 0, 0, 0)
    else {
      pupilOffset(rect, EYE_L, targets)
      pupilOffset(rect, EYE_R_POS, targets)
    }
  }
  let i = 0
  for (const t of trackers) {
    writePupil(t.left, targets[i], targets[i + 1])
    writePupil(t.right, targets[i + 2], targets[i + 3])
    i += 4
  }
}

function onPointerMove(event: PointerEvent) {
  pointerX = event.clientX
  pointerY = event.clientY
  if (!frame) frame = requestAnimationFrame(flush)
}

function track(tracker: Tracker): () => void {
  if (trackers.size === 0) window.addEventListener('pointermove', onPointerMove, { passive: true })
  trackers.add(tracker)
  return () => {
    trackers.delete(tracker)
    tracker.left.style.transform = ''
    tracker.right.style.transform = ''
    if (trackers.size === 0) {
      window.removeEventListener('pointermove', onPointerMove)
      if (frame) cancelAnimationFrame(frame)
      frame = 0
    }
  }
}

/* ── Component ───────────────────────────────────────────────────────────── */

/**
 * Buddy, the portfolio's mascot: a grape squircle with a die-cut sticker outline. The pupils follow
 * the pointer, it blinks and breathes, leans on hover and hops with a speech bubble when poked. Under
 * reduced motion it is a still picture. Position the container; never animate transforms on Buddy itself.
 */
export default function Buddy({ pose = 'wave', sign, size = 120, flip = false, className, label }: BuddyProps) {
  const reduced = useReducedMotion()
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const svgRef = useRef<SVGSVGElement>(null)
  const eyesRef = useRef<SVGGElement>(null)
  const leftPupil = useRef<SVGGElement>(null)
  const rightPupil = useRef<SVGGElement>(null)
  const bubbleTimer = useRef(0)
  const [said, setSaid] = useState<string | null>(null)

  useEffect(() => {
    const svg = svgRef.current
    const left = leftPupil.current
    const right = rightPupil.current
    if (reduced || !svg || !left || !right) return
    return track({ svg, left, right })
  }, [reduced])

  useEffect(() => {
    const eyes = eyesRef.current
    if (reduced || !eyes) return
    let timer = 0
    const schedule = () => {
      timer = window.setTimeout(() => {
        eyes.dataset.blink = 'true'
        timer = window.setTimeout(() => {
          delete eyes.dataset.blink
          schedule()
        }, 170)
      }, 2500 + Math.random() * 3500)
    }
    schedule()
    return () => {
      window.clearTimeout(timer)
      delete eyes.dataset.blink
    }
  }, [reduced])

  useEffect(() => () => window.clearTimeout(bubbleTimer.current), [])

  const poke = () => {
    setSaid(SAYINGS[Math.floor(Math.random() * SAYINGS.length)])
    window.clearTimeout(bubbleTimer.current)
    bubbleTimer.current = window.setTimeout(() => setSaid(null), 1200)
    if (reduced) return
    void animate(
      scope.current,
      {
        y: [0, 0, -30, 0, 0, 0],
        scaleX: [1, 1.14, 0.92, 1.1, 0.97, 1],
        scaleY: [1, 0.84, 1.12, 0.86, 1.04, 1],
      },
      { duration: 0.7, times: [0, 0.18, 0.5, 0.76, 0.88, 1], ease: 'easeOut' },
    )
  }

  const signText = sign ?? 'Hi!'
  const signSize = signFontSize(signText)
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const }
  const classes = ['buddy', `buddy--${pose}`, reduced ? '' : 'buddy--motion', flip ? 'buddy--flip' : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      style={{ height: size, width: (size * VB_W) / VB_H }}
      onClick={poke}
      {...a11y}
    >
      <div className="buddy__hop" ref={scope}>
        <div className="buddy__lean">
          <div className="buddy__breath">
            <svg
              ref={svgRef}
              className="buddy__svg"
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              width="100%"
              height="100%"
              focusable="false"
              aria-hidden="true"
            >
              <Figure layer="shadow" pose={pose} flip={flip} />
              <Figure layer="ring" pose={pose} flip={flip} />
              <Figure layer="main" pose={pose} flip={flip} />

              {/* Face and lettering: never mirrored, so text stays readable when Buddy faces left. */}
              <g className="buddy__eyes" ref={eyesRef}>
                {[EYE_L, EYE_R_POS].map((eye, i) => (
                  <g key={i}>
                    <circle cx={eye.x} cy={eye.y} r={EYE_R} fill={WHITE} stroke={INK} strokeWidth={4} />
                    <g className="buddy__glance">
                      <g className="buddy__pupil" ref={i === 0 ? leftPupil : rightPupil}>
                        <circle cx={eye.x} cy={eye.y} r={PUPIL_R} fill={INK} />
                        <circle cx={eye.x + 2.6} cy={eye.y - 2.8} r={2.4} fill={WHITE} />
                      </g>
                    </g>
                  </g>
                ))}
              </g>
              <circle cx={56} cy={91} r={6.5} fill={PINK} />
              <circle cx={134} cy={91} r={6.5} fill={PINK} />
              <path d="M86 88 Q95 98 104 88" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />

              {pose === 'sign' ? (
                <text
                  x={95}
                  y={124}
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform="rotate(-2 95 124)"
                  fill={INK}
                  fontSize={signSize}
                  style={{ fontFamily: 'var(--hand)', fontWeight: 700 }}
                >
                  {signText}
                </text>
              ) : (
                <text
                  x={95}
                  y={135}
                  textAnchor="middle"
                  fill={CREAM}
                  fontSize={34}
                  style={{ fontFamily: 'var(--display)', fontWeight: 800 }}
                >
                  HS
                </text>
              )}

              {pose === 'cheer' &&
                SPARKS.map((s) => (
                  <g key={`${s.x}-${s.y}`} transform={`translate(${s.x} ${s.y})`}>
                    <g className="buddy__spark" style={{ animationDelay: `${s.delay}s` }}>
                      <path d={SPARK_PATH} fill={s.color} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
                    </g>
                  </g>
                ))}
            </svg>
          </div>
        </div>
      </div>
      {said && (
        <span className="buddy__bubble" aria-hidden="true">
          {said}
        </span>
      )}
    </div>
  )
}
