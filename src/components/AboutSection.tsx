import { useRef } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { motion } from 'motion/react'
import graduationPhoto from '../assets/images/hannah-graduation.jpg'
import { education, skillGroups } from '../data/portfolio'
import { riseIn, slapIn, STAGGER } from '../lib/motion'
import { useReducedMotion } from '../lib/useReducedMotion'
import Buddy from './Buddy'
import Sticker from './Sticker'
import './AboutSection.css'

const KEY_STEP: Record<string, readonly [number, number]> = {
  ArrowLeft: [-0.2, 0],
  ArrowRight: [0.2, 0],
  ArrowUp: [0, -0.2],
  ArrowDown: [0, 0.2],
}

/** Chip colours cycle by skill group. */
const TONES = ['lime', 'sky', 'pink', 'paper'] as const

/** Fixed small resting tilts, picked by chip index so renders stay deterministic. */
const TILTS = [-3, 2, -1.5, 3, -2, 1.5, -2.5, 2.5] as const

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** Scallop bumps around the rosette disc. */
const SCALLOPS = Array.from({ length: 14 }, (_, index) => {
  const angle = (index / 14) * Math.PI * 2
  return { x: 60 + Math.cos(angle) * 43, y: 60 + Math.sin(angle) * 43 }
})

/** Cum Laude rosette: scalloped lime disc, star, two ribbon tails. */
function Rosette() {
  return (
    <svg className="about-rosette-svg" viewBox="0 0 120 138" width={124} height={142} aria-hidden="true" focusable="false">
      <path
        d="M40 78 L26 128 L45 119 L55 134 L66 82 Z"
        fill="var(--pink)"
        stroke="var(--ink)"
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path
        d="M80 78 L94 128 L75 119 L65 134 L54 82 Z"
        fill="var(--sky)"
        stroke="var(--ink)"
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <g fill="var(--ink)" stroke="var(--ink)" strokeWidth={7} strokeLinejoin="round">
        <circle cx={60} cy={60} r={43} />
        {SCALLOPS.map((bump) => (
          <circle key={`${bump.x}-${bump.y}`} cx={bump.x} cy={bump.y} r={12} />
        ))}
      </g>
      <g fill="var(--lime)">
        <circle cx={60} cy={60} r={43} />
        {SCALLOPS.map((bump) => (
          <circle key={`${bump.x}-${bump.y}`} cx={bump.x} cy={bump.y} r={12} />
        ))}
      </g>
      <circle cx={60} cy={60} r={36} fill="none" stroke="var(--ink)" strokeWidth={2.5} strokeDasharray="2 5" strokeLinecap="round" />
      <path
        d="M60 28 L66.5 43 L82 44.5 L70.5 55 L74 70.5 L60 62.5 L46 70.5 L49.5 55 L38 44.5 L53.5 43 Z"
        fill="var(--paper)"
        stroke="var(--ink)"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <text
        x={60}
        y={89}
        textAnchor="middle"
        fill="var(--ink)"
        style={{ font: '800 14px var(--display)', letterSpacing: '0.04em' }}
      >
        CUM LAUDE
      </text>
    </svg>
  )
}

export default function AboutSection() {
  const reduced = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)
  const keyPos = useRef({ x: 0.5, y: 0.5 })

  const setTilt = (px: number, py: number) => {
    const card = cardRef.current
    if (!card) return
    card.setAttribute('data-active', '')
    card.style.setProperty('--about-px', String(px))
    card.style.setProperty('--about-py', String(py))
    card.style.setProperty('--about-ry', `${(px - 0.5) * 30}deg`)
    card.style.setProperty('--about-rx', `${-(py - 0.5) * 24}deg`)
  }

  const resetTilt = () => {
    const card = cardRef.current
    keyPos.current = { x: 0.5, y: 0.5 }
    if (!card) return
    card.removeAttribute('data-active')
    for (const name of ['--about-px', '--about-py', '--about-rx', '--about-ry']) {
      card.style.removeProperty(name)
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card || reduced) return
    const rect = card.getBoundingClientRect()
    setTilt(
      clamp01((event.clientX - rect.left) / rect.width),
      clamp01((event.clientY - rect.top) / rect.height),
    )
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = KEY_STEP[event.key]
    if (!step || reduced) return
    event.preventDefault()
    const pos = keyPos.current
    pos.x = clamp01(pos.x + step[0])
    pos.y = clamp01(pos.y + step[1])
    setTilt(pos.x, pos.y)
  }

  const rise = riseIn(reduced)
  const slap = slapIn(0, reduced)

  return (
    <section id="about" className="section surface-cream about" aria-labelledby="about-title">
      <div className="wrap about-grid">
        <div className="about-cred">
          <motion.div
            className="about-rise"
            variants={rise}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="about-stage-row">
              <div className="about-stage" onPointerMove={onPointerMove} onPointerLeave={resetTilt}>
                <div
                  ref={cardRef}
                  className="about-card"
                  data-still={reduced ? '' : undefined}
                  tabIndex={0}
                  role="img"
                  aria-label="Cum Laude ID card for Hannah Sheen. Move the pointer over it or use the arrow keys to tilt."
                  onKeyDown={onKeyDown}
                  onBlur={resetTilt}
                >
                  <div className="about-face">
                    <div className="about-face-top">
                      <span>
                        Cebu Technological
                        <br />
                        University
                      </span>
                      <b>HS</b>
                    </div>
                    <div className="about-face-body">
                      <div className="about-face-photo">
                        <img
                          src={graduationPhoto}
                          alt="Hannah Sheen in graduation toga"
                          draggable={false}
                          width={1}
                          height={1}
                        />
                      </div>
                      <div className="about-face-honors">
                        Cum
                        <br />
                        Laude
                      </div>
                      <div className="about-face-name">Hannah Sheen Obejero</div>
                      <div className="about-face-sub">BS Information Technology · Class of {education.year}</div>
                      <div className="about-face-bar">
                        <div className="about-face-bars" />
                        <div className="about-face-year">CTU · {education.year}</div>
                      </div>
                    </div>
                    <div className="about-holo" />
                    <div className="about-holo2" />
                  </div>
                  <Sticker className="about-rosette" rotate={-10} label="Cum Laude">
                    <Rosette />
                  </Sticker>
                </div>
              </div>

              <div className="about-buddy">
                <Buddy pose="sign" sign="Cum Laude!" size={110} />
              </div>
            </div>
          </motion.div>

          <div className="about-tag" role="note" aria-label="Cum Laude, BS IT, CTU 2026">
            <i aria-hidden="true" />
            Cum Laude · BS IT · CTU {education.year}
          </div>

          <dl className="about-facts">
            <div>
              <dt>Degree</dt>
              <dd>{education.degree.replace('Bachelor of Science in', 'BS')}</dd>
            </div>
            <div>
              <dt>School</dt>
              <dd>{education.school}</dd>
            </div>
            <div>
              <dt>Class of</dt>
              <dd>{education.year}</dd>
            </div>
          </dl>
        </div>

        <div className="about-copy">
          <motion.div
            variants={rise}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            <p className="kicker about-kicker">01 · About</p>
            <h2 id="about-title" className="section-title about-title">
              I like making complicated things feel{' '}
              <motion.em variants={slap} initial="hidden" whileInView="show" viewport={{ once: true, amount: 1 }}>
                simple
              </motion.em>
              .
            </h2>
            <p className="section-lede about-bio">
              I am a developer who enjoys building useful systems, learning fast, and helping teams keep technical work
              human. My sweet spot sits between code, coordination, and thoughtful user experience.
            </p>
          </motion.div>

          <motion.div
            className="about-now"
            variants={rise}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            <span className="about-now-tape" aria-hidden="true" />
            <p className="hand about-now-label">currently:</p>
            <p className="about-now-role">IT Executive Assistant</p>
            <p className="about-now-company">Lifewood Data Technology</p>
            <p className="about-now-text">
              Keeping operations organized, assisting technical priorities, and helping work move from "we should" to
              "done."
            </p>
          </motion.div>

          <motion.div
            className="about-sheet"
            variants={rise}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            {skillGroups.map((group, groupIndex) => (
              <section key={group.title} className="about-group" aria-label={group.title}>
                <h3 className="hand about-group-title">{group.title}</h3>
                <ul className="about-chips">
                  {group.items.map((item, itemIndex) => (
                    <li key={item} className="about-chip-item">
                      <Sticker
                        snapBack
                        rotate={TILTS[(groupIndex * 3 + itemIndex) % TILTS.length]}
                        delay={itemIndex * STAGGER}
                        label={item}
                      >
                        <span className={`chip chip-${TONES[groupIndex % TONES.length]} about-chip`}>{item}</span>
                      </Sticker>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
