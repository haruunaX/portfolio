import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import type { Variants } from 'motion/react'
import { contact } from '../data/contact'
import { education } from '../data/portfolio'
import { FADE } from '../lib/motion'
import HeroBadge from './HeroBadge'
import Swarm from './Swarm'
import './Hero.css'

type HeroProps = {
  introDone: boolean
  reduceMotion: boolean
  handoff: boolean
}

const WORDS = ['Hannah', 'Sheen'] as const

/** Weight range of the name letters and the pointer distance (px) that lifts a letter. */
const WEIGHT_MIN = 440
const WEIGHT_MAX = 800
const WEIGHT_RADIUS = 300

const degreeShort = education.degree.replace('Bachelor of Science in', 'BS')

const column: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: FADE },
}

export default function Hero({ introDone, reduceMotion, handoff }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const nameRef = useRef<HTMLHeadingElement>(null)
  const recacheRef = useRef<(() => void) | null>(null)

  // Letters gain weight as a mouse pointer nears. Pointer events only mark state; one rAF
  // loop writes font-variation-settings straight to the DOM (no React state per move).
  useEffect(() => {
    const section = sectionRef.current
    const name = nameRef.current
    if (!section || !name || reduceMotion) return

    const letters = Array.from(name.querySelectorAll<HTMLElement>('.hero__letter'))
    const count = letters.length
    const weight = new Float32Array(count).fill(WEIGHT_MIN)
    const cx = new Float32Array(count)
    const cy = new Float32Array(count)

    let visible = true
    let active = false
    let pointerX = 0
    let pointerY = 0
    let raf = 0
    let last = 0

    // Letter centers in page coordinates, so scrolling never invalidates them.
    const cache = () => {
      const sx = window.scrollX
      const sy = window.scrollY
      for (let i = 0; i < count; i++) {
        const r = letters[i].getBoundingClientRect()
        cx[i] = r.left + sx + r.width / 2
        cy[i] = r.top + sy + r.height / 2
      }
    }

    const frame = (now: number) => {
      raf = 0
      const f = last ? Math.min(3, (now - last) / 16.67) : 1
      last = now
      const px = pointerX + window.scrollX
      const py = pointerY + window.scrollY
      let busy = false
      for (let i = 0; i < count; i++) {
        let target = WEIGHT_MIN
        if (active) {
          const d = Math.hypot(px - cx[i], py - cy[i])
          target = WEIGHT_MIN + (WEIGHT_MAX - WEIGHT_MIN) * Math.max(0, 1 - d / WEIGHT_RADIUS) ** 1.5
        }
        const diff = target - weight[i]
        if (Math.abs(diff) > 0.4) {
          weight[i] += diff * Math.min(1, 0.16 * f)
          letters[i].style.fontVariationSettings = `"wght" ${weight[i].toFixed(0)}`
          busy = true
        }
      }
      if (busy && visible) raf = requestAnimationFrame(frame)
      else last = 0
    }

    const kick = () => {
      if (!raf && visible) raf = requestAnimationFrame(frame)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      pointerX = e.clientX
      pointerY = e.clientY
      active = true
      kick()
    }
    const onLeave = () => {
      active = false
      kick()
    }
    const onScroll = () => {
      if (active) kick()
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) kick()
    })
    observer.observe(section)

    const resize = new ResizeObserver(() => cache())
    resize.observe(section)
    let cancelled = false
    void document.fonts?.ready.then(() => {
      if (!cancelled) cache()
    })

    recacheRef.current = cache
    cache()
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('blur', onLeave)
    document.documentElement.addEventListener('mouseleave', onLeave)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      observer.disconnect()
      resize.disconnect()
      recacheRef.current = null
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('blur', onLeave)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      for (const letter of letters) letter.style.removeProperty('font-variation-settings')
    }
  }, [reduceMotion])

  return (
    <section
      ref={sectionRef}
      id="home"
      className="section surface-cobalt hero"
      aria-labelledby="hero-title"
      data-still={reduceMotion ? '' : undefined}
    >
      <div className="hero__rays" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>

      <div className="hero__swarm">
        <Swarm reduceMotion={reduceMotion} />
      </div>

      <div className="wrap hero__stage">
        <motion.div
          className="hero__copy"
          data-swarm-avoid
          variants={column}
          initial="hidden"
          animate={introDone ? 'show' : 'hidden'}
        >
          <motion.p className="hero__eyebrow" variants={item}>
            <span className="hero__dot" aria-hidden="true" />
            Developer. Organizer. Professional tab hoarder.
          </motion.p>

          <motion.h1
            id="hero-title"
            ref={nameRef}
            className="hero__name"
            aria-label="Hannah Sheen"
            variants={item}
            onAnimationComplete={() => recacheRef.current?.()}
          >
            {WORDS.map((word) => (
              <span className="hero__word" key={word} aria-hidden="true">
                {[...word].map((ch, i) => (
                  <span className="hero__letter" aria-hidden="true" key={i}>
                    {ch}
                  </span>
                ))}
              </span>
            ))}
          </motion.h1>

          <motion.p className="hero__role" variants={item}>
            IT Executive Assistant + full-stack <em className="serif">developer</em>
          </motion.p>

          <motion.div className="chip chip-sun hero__cred" variants={item}>
            <span className="hero__star" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" />
              </svg>
            </span>
            <span className="hero__cred-text">
              <b>{education.honors}</b> · {degreeShort} · {education.school}, {education.year}
            </span>
          </motion.div>

          <motion.p className="hero__intro" variants={item}>
            I turn busy ideas into useful digital experiences and tidy systems.
          </motion.p>

          <motion.div className="hero__buttons" variants={item}>
            <a className="btn btn-sun" href="#work">
              See my work
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a className="btn btn-ghost" href={contact.resumeUrl} target="_blank" rel="noopener noreferrer">
              Open resume
            </a>
          </motion.div>

          <motion.p className="hero__where" variants={item}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            Based in Cebu, Philippines
          </motion.p>
        </motion.div>

        <div className="hero__badge">
          <HeroBadge introDone={introDone} reduceMotion={reduceMotion} handoff={handoff} />
        </div>
      </div>

      <p className="hero__caption">Moalboal sardine run · move to scatter · drag the badge</p>
    </section>
  )
}
