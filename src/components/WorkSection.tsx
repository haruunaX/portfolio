import { useEffect, useState } from 'react'
import type { MouseEvent, PointerEvent } from 'react'
import { flushSync } from 'react-dom'
import { motion } from 'motion/react'
import type { Variants } from 'motion/react'
import { projects } from '../data/portfolio'
import type { Project } from '../data/portfolio'
import { FADE, MORPH, STAGGER, riseIn } from '../lib/motion'
import { useReducedMotion } from '../lib/useReducedMotion'
import Buddy from './Buddy'
import './WorkSection.css'

type WorkSectionProps = {
  openNumber: string | null
  onOpen: (project: Project) => void
}

/** Tile look per grid slot: paper, lime, sky, pink, cream. */
const TILES = [
  { tone: 'paper', layout: 'bleed', desc: true },
  { tone: 'lime', layout: 'side', desc: false },
  { tone: 'sky', layout: 'bleed', desc: false },
  { tone: 'pink', layout: 'bleed', desc: true },
  { tone: 'cream', layout: 'side', desc: true },
] as const

/** How long a flattened tile stays flat after the case file closes, so the return morph lands cleanly. */
const FLAT_HOLD_MS = 800

/** Widest tilt, in degrees, a tile leans toward the cursor. */
const MAX_TILT = 2.4

/** Parent variants: only the stagger, the tiles carry the rise themselves. */
const GRID_VARIANTS: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER } },
}

/** Leans the tile toward a mouse cursor. Touch and pen input leave it level. */
function trackTilt(event: PointerEvent<HTMLDivElement>) {
  if (event.pointerType !== 'mouse') return
  const tile = event.currentTarget
  const rect = tile.getBoundingClientRect()
  const side = (event.clientX - rect.left) / rect.width - 0.5
  tile.style.setProperty('--tilt', `${(side * 2 * MAX_TILT).toFixed(2)}deg`)
}

function releaseTilt(event: PointerEvent<HTMLDivElement>) {
  event.currentTarget.style.removeProperty('--tilt')
}

export default function WorkSection({ openNumber, onOpen }: WorkSectionProps) {
  const reduceMotion = useReducedMotion()
  // The project whose tile was clicked: its lift and tilt stay cleared while the case file is up.
  const [flatNumber, setFlatNumber] = useState<string | null>(null)

  useEffect(() => {
    if (openNumber !== null) return
    const timer = window.setTimeout(() => setFlatNumber(null), FLAT_HOLD_MS)
    return () => window.clearTimeout(timer)
  }, [openNumber])

  function open(event: MouseEvent<HTMLButtonElement>, project: Project) {
    // Some browsers do not focus a button on click; the dialog needs an opener to return focus to.
    event.currentTarget.focus({ preventScroll: true })
    // Clear the hover lift synchronously so Motion measures the tile at rest, not mid-transform.
    flushSync(() => setFlatNumber(project.number))
    onOpen(project)
  }

  const tileRise = riseIn(reduceMotion)

  return (
    <section
      id="work"
      className="section surface-grape work"
      aria-labelledby="work-title"
      data-reduced={reduceMotion ? '' : undefined}
    >
      <div className="wrap">
        <motion.header
          className="work__head"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={FADE}
        >
          <div className="work__headline">
            <p className="kicker">02 · Projects</p>
            <h2 id="work-title" className="section-title">
              Things I made instead of <em>sleeping</em>
            </h2>
          </div>
          <div className="work__aside">
            <p className="section-lede">
              {projects.length} projects. Hover for the stack, click any tile to open its case file.
            </p>
            <div className="work__buddy">
              <Buddy pose="point" size={100} />
            </div>
          </div>
        </motion.header>

        <motion.ul
          className="work__grid"
          variants={GRID_VARIANTS}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.08 }}
        >
          {projects.map((project, index) => {
            const look = TILES[index] ?? TILES[0]
            const isOpen = openNumber === project.number
            const isFlat = isOpen || flatNumber === project.number
            const tileClass = [
              'work-tile',
              `work-tile--${look.tone}`,
              `work-tile--${look.layout}`,
              `work-tile--${index + 1}`,
              look.desc ? 'work-tile--desc' : '',
              isFlat ? 'is-flat' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <motion.li
                key={project.number}
                className={`work__item work__item--${index + 1}`}
                variants={tileRise}
              >
                <div
                  className={tileClass}
                  onPointerMove={reduceMotion ? undefined : trackTilt}
                  onPointerLeave={releaseTilt}
                >
                  <div className="work-tile__meta">
                    <motion.span
                      className="work-tile__number"
                      layoutId={`project-number-${project.number}`}
                      layoutDependency={isOpen ? 'case-open' : 'case-closed'}
                      transition={MORPH}
                      style={{ borderRadius: 999 }}
                    >
                      {project.number}
                    </motion.span>
                    <motion.h3
                      className="work-tile__title"
                      layoutId={`project-title-${project.number}`}
                      layoutDependency={isOpen ? 'case-open' : 'case-closed'}
                      transition={MORPH}
                    >
                      {project.title}
                    </motion.h3>
                    <p className="work-tile__client">{project.client}</p>
                    {look.desc && <p className="work-tile__desc">{project.description}</p>}
                  </div>

                  <motion.div
                    className="work-tile__frame"
                    layoutId={`project-media-${project.number}`}
                    layoutDependency={isOpen ? 'case-open' : 'case-closed'}
                    transition={MORPH}
                    style={{ borderRadius: 18 }}
                  >
                    <img
                      className="work-tile__img"
                      src={project.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  </motion.div>

                  <ul className="work-tile__chips" aria-label={`${project.title} tech stack`}>
                    {project.stack.map((item) => (
                      <li key={item} className="chip">
                        {item}
                      </li>
                    ))}
                  </ul>

                  <span className="work-tile__go" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" focusable="false">
                      <path
                        d="M7 17L17 7M9 7h8v8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>

                  <button
                    type="button"
                    className="work-tile__open"
                    aria-haspopup="dialog"
                    aria-label={`Open case file: ${project.title}`}
                    onClick={(event) => open(event, project)}
                  />
                </div>
              </motion.li>
            )
          })}
        </motion.ul>
      </div>
    </section>
  )
}
