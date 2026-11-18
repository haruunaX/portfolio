import { useEffect, useState } from 'react'
import type { MouseEvent, PointerEvent } from 'react'
import { flushSync } from 'react-dom'
import { motion } from 'motion/react'
import { projects } from '../data/portfolio'
import type { Project } from '../data/portfolio'
import { FADE, MORPH, STAGGER } from '../lib/motion'
import { useReducedMotion } from '../lib/useReducedMotion'
import './WorkSection.css'

type WorkSectionProps = {
  openNumber: string | null
  onOpen: (project: Project) => void
}

/** Tile look per grid slot, following the approved bento: ink, orange, sun, cobalt, ink. */
const TILES = [
  { tone: 'ink', layout: 'bleed', desc: true },
  { tone: 'orange', layout: 'side', desc: false },
  { tone: 'sun', layout: 'bleed', desc: false },
  { tone: 'cobalt', layout: 'bleed', desc: true },
  { tone: 'ink', layout: 'side', desc: true },
] as const

/** How long a flattened tile stays flat after the case file closes, so the return morph lands cleanly. */
const FLAT_HOLD_MS = 800

/** Lights up the tile under a mouse cursor. Touch and pen input leave it off. */
function trackSpotlight(event: PointerEvent<HTMLDivElement>) {
  if (event.pointerType !== 'mouse') return
  const tile = event.currentTarget
  const rect = tile.getBoundingClientRect()
  tile.style.setProperty('--mx', `${event.clientX - rect.left}px`)
  tile.style.setProperty('--my', `${event.clientY - rect.top}px`)
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

  return (
    <section
      id="work"
      className="section surface-cobalt work"
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
          <div>
            <p className="kicker">02 · Projects</p>
            <h2 id="work-title" className="section-title">
              Things I made instead of <em>sleeping</em>
            </h2>
          </div>
          <p className="section-lede">
            {projects.length} projects. Hover for the stack, click any tile to open its case file.
          </p>
        </motion.header>

        <ul className="work__grid">
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
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...FADE, delay: Math.min(index, 3) * STAGGER }}
              >
                <div className={tileClass} onPointerMove={trackSpotlight}>
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
                    style={{ borderRadius: 20 }}
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
                      <li key={item} className="work-tile__chip">
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
                        strokeWidth="2.4"
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
        </ul>
      </div>
    </section>
  )
}
