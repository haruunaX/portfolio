import { useRef } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { motion } from 'motion/react'
import type { Variants } from 'motion/react'
import graduationPhoto from '../assets/images/hannah-graduation.jpg'
import { education, skillGroups } from '../data/portfolio'
import { FADE, STAGGER } from '../lib/motion'
import { useReducedMotion } from '../lib/useReducedMotion'
import './AboutSection.css'

const KEY_STEP: Record<string, readonly [number, number]> = {
  ArrowLeft: [-0.2, 0],
  ArrowRight: [0.2, 0],
  ArrowUp: [0, -0.2],
  ArrowDown: [0, 0.2],
}

const TONES = ['sun', 'orange', 'light', 'cobalt'] as const

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const clusterVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER, delayChildren: 0.05 } },
}

const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0.6, y: 10 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', visualDuration: 0.35, bounce: 0.35 },
  },
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

  return (
    <section id="about" className="section surface-ink about" aria-labelledby="about-title">
      <div className="wrap about-grid">
        <div className="about-cred">
          <div className="about-stage" onPointerMove={onPointerMove} onPointerLeave={resetTilt}>
            <div
              ref={cardRef}
              className="about-card"
              data-still={reduced ? '' : undefined}
              tabIndex={0}
              role="img"
              aria-label="Holographic Cum Laude ID card for Hannah Sheen. Move the pointer over it or use the arrow keys to tilt."
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
                <div className="about-holo" />
                <div className="about-holo2" />
              </div>
              <div className="about-sticker">
                <div>
                  <b>{education.year}</b>Honors
                </div>
              </div>
            </div>
          </div>

          <div
            className="about-glow"
            data-still={reduced ? '' : undefined}
            role="note"
            aria-label="Cum Laude, BS IT, CTU 2026"
          >
            <span className="about-glow-in" aria-hidden="true" />
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
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={FADE}
          >
            <p className="kicker">01 · About</p>
            <h2 id="about-title" className="section-title about-title">
              I like making complicated things feel <em>simple</em>.
            </h2>
            <p className="section-lede about-bio">
              I am a Cebu-based developer who enjoys building useful systems, learning fast, and helping teams keep
              technical work human. My sweet spot sits between code, coordination, and thoughtful user experience.
            </p>
          </motion.div>

          <motion.div
            className="about-now"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={FADE}
          >
            <p className="about-now-label">Currently doing</p>
            <p className="about-now-role">IT Executive Assistant</p>
            <p className="about-now-company">Lifewood Data Technology</p>
            <p className="about-now-text">
              Keeping operations organized, assisting technical priorities, and helping work move from "we should" to
              "done."
            </p>
          </motion.div>

          <div className="about-skills">
            {skillGroups.map((group, groupIndex) => (
              <motion.section
                key={group.title}
                className="about-group"
                aria-label={group.title}
                variants={clusterVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
              >
                <h3 className="about-group-title">{group.title}</h3>
                <ul className="about-chips">
                  {group.items.map((item) => (
                    <motion.li
                      key={item}
                      className={`chip about-chip about-chip-${TONES[groupIndex % TONES.length]}`}
                      variants={popVariants}
                    >
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </motion.section>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
