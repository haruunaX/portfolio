import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent, PointerEvent } from 'react'
import { motion } from 'motion/react'
import { certificates } from '../data/portfolio'
import type { Certificate } from '../data/portfolio'
import { FADE, MORPH, STAGGER, riseIn } from '../lib/motion'
import { useReducedMotion } from '../lib/useReducedMotion'
import './CertificatesSection.css'

type CertificateSelection = { index: number; certificate: Certificate }

type CertificatesSectionProps = {
  openIndex: number | null
  onOpen: (selection: CertificateSelection) => void
}

/** Pointer travel (px) before a press on the rail counts as a drag instead of a click. */
const DRAG_THRESHOLD = 6
const MAX_TILT = 7

type Edges = { start: boolean; end: boolean }

/** Alternating resting tilt (degrees) for the wrapper; fixed per index, never random. */
const REST_TILTS = [-2, 1.6, -1.2, 2.2] as const

function CertificateCard({
  certificate,
  index,
  isOpen,
  tilt,
  onOpen,
}: {
  certificate: Certificate
  index: number
  isOpen: boolean
  tilt: boolean
  onOpen: (selection: CertificateSelection) => void
}) {
  const cardRef = useRef<HTMLButtonElement>(null)
  const restRef = useRef<HTMLDivElement>(null)
  const rest = REST_TILTS[index % REST_TILTS.length]
  const stickerTilt = index % 2 === 0 ? 9 : -9

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const card = cardRef.current
    if (!tilt || !card || event.pointerType !== 'mouse' || event.buttons !== 0) return
    const rect = card.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    card.classList.remove('certificates__card--flat')
    card.style.setProperty('--tilt-x', `${((0.5 - y) * 2 * MAX_TILT).toFixed(2)}deg`)
    card.style.setProperty('--tilt-y', `${((x - 0.5) * 2 * MAX_TILT).toFixed(2)}deg`)
    card.style.setProperty('--sheen-x', `${(x * 100).toFixed(1)}%`)
    card.style.setProperty('--sheen-y', `${(y * 100).toFixed(1)}%`)
    card.style.setProperty('--sheen-o', '1')
  }

  /** Removes the tilt immediately (no transition) so a shared element morph measures a flat card. */
  const flatten = useCallback(() => {
    const card = cardRef.current
    if (!card) return
    card.classList.add('certificates__card--flat')
    card.style.setProperty('--tilt-x', '0deg')
    card.style.setProperty('--tilt-y', '0deg')
    card.style.setProperty('--sheen-o', '0')
    // The resting tilt lives on the wrapper; drop it too so the image morph measures a level box.
    restRef.current?.classList.add('certificates__tilt--flat')
  }, [])

  function handlePointerLeave() {
    const card = cardRef.current
    if (!card) return
    card.classList.remove('certificates__card--flat')
    card.style.setProperty('--tilt-x', '0deg')
    card.style.setProperty('--tilt-y', '0deg')
    card.style.setProperty('--sheen-o', '0')
    // Opening moves focus into the lightbox and blurs this card. Keep the wrapper level while its
    // certificate is open, so the closing morph lands on a flat card; it tilts back on the next leave.
    if (!isOpen) restRef.current?.classList.remove('certificates__tilt--flat')
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    // Safari and Firefox on macOS do not focus buttons on click; the lightbox returns focus to this.
    event.currentTarget.focus({ preventScroll: true })
    flatten()
    onOpen({ index, certificate })
  }

  return (
    <div
      ref={restRef}
      className="certificates__tilt"
      style={{ '--rest': `${rest}deg`, '--sticker-tilt': `${stickerTilt}deg` } as CSSProperties}
    >
      <button
        ref={cardRef}
        type="button"
        className="certificates__card"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onBlur={handlePointerLeave}
        onClick={handleClick}
        aria-label={`Open certificate: ${certificate.title}, ${certificate.issuer}`}
      >
        <span className="certificates__sheen" aria-hidden="true" />
        <span className="certificates__proof">
          <span>proof</span>
          <span>#{String(index + 1).padStart(2, '0')}</span>
        </span>
        <motion.img
          className="certificates__image"
          layoutId={`certificate-media-${index}`}
          layoutDependency={isOpen ? 'cert-open' : 'cert-closed'}
          transition={MORPH}
          style={{ borderRadius: 12 }}
          src={certificate.image}
          alt=""
          draggable={false}
          loading="lazy"
        />
        <span className="certificates__meta">
          <motion.strong
            className="certificates__title"
            layoutId={`certificate-title-${index}`}
            layoutDependency={isOpen ? 'cert-open' : 'cert-closed'}
            transition={MORPH}
          >
            {certificate.title}
          </motion.strong>
          <span className="certificates__issuer">{certificate.issuer}</span>
          <span className="certificates__open" aria-hidden="true">
            Open certificate <span className="certificates__arrow">→</span>
          </span>
        </span>
      </button>
    </div>
  )
}

export default function CertificatesSection({ openIndex, onOpen }: CertificatesSectionProps) {
  const reduced = useReducedMotion()
  const railRef = useRef<HTMLUListElement>(null)
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0, pointerId: -1 })
  const suppressClick = useRef(false)
  const [dragging, setDragging] = useState(false)
  const [edges, setEdges] = useState<Edges>({ start: true, end: false })

  const updateEdges = useCallback(() => {
    const rail = railRef.current
    if (!rail) return
    const start = rail.scrollLeft <= 2
    const end = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
  }, [])

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    // The observer reports once on observe, which seeds the edge state without a synchronous setState here.
    const observer = new ResizeObserver(updateEdges)
    observer.observe(rail)
    return () => observer.disconnect()
  }, [updateEdges])

  function scrollByCard(direction: 1 | -1) {
    const rail = railRef.current
    if (!rail) return
    const card = rail.querySelector<HTMLElement>('li')
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 0
    const step = (card?.offsetWidth ?? rail.clientWidth * 0.8) + gap
    rail.scrollBy({ left: direction * step, behavior: reduced ? 'auto' : 'smooth' })
  }

  function handlePointerDown(event: PointerEvent<HTMLUListElement>) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    const rail = railRef.current
    if (!rail) return
    drag.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startScroll: rail.scrollLeft,
      pointerId: event.pointerId,
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLUListElement>) {
    const state = drag.current
    const rail = railRef.current
    if (!state.active || !rail || event.pointerId !== state.pointerId) return
    const delta = event.clientX - state.startX
    if (!state.moved) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return
      state.moved = true
      rail.setPointerCapture(event.pointerId)
      setDragging(true)
    }
    rail.scrollLeft = state.startScroll - delta
  }

  function endDrag(event: PointerEvent<HTMLUListElement>) {
    const state = drag.current
    if (!state.active || event.pointerId !== state.pointerId) return
    state.active = false
    if (!state.moved) return
    const rail = railRef.current
    if (rail?.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId)
    // A drag ends in a click event; swallow it, and clear the flag if the browser sends none.
    suppressClick.current = true
    window.setTimeout(() => {
      suppressClick.current = false
    }, 60)
    setDragging(false)
  }

  return (
    <section id="certificates" className="section surface-sky certificates" aria-labelledby="certificates-title">
      <div className="wrap">
        <motion.div
          className="certificates__head"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={FADE}
        >
          <div>
            <p className="kicker">04 · Proof I did the homework</p>
            <h2 id="certificates-title" className="section-title">
              My learning <em>trail</em>
            </h2>
            <p className="section-lede">
              Seven certificates, newest first. Drag the rail or use the arrows, click to inspect.
            </p>
          </div>
          <div className="certificates__arrows">
            <button
              type="button"
              className="certificates__arrow-btn"
              aria-label="Previous certificates"
              disabled={edges.start}
              onClick={() => scrollByCard(-1)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              className="certificates__arrow-btn"
              aria-label="Next certificates"
              disabled={edges.end}
              onClick={() => scrollByCard(1)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </motion.div>

        <div
          className="certificates__viewport"
          data-start={edges.start}
          data-end={edges.end}
        >
          <motion.ul
            ref={railRef}
            role="list"
            variants={{ hidden: {}, show: { transition: { staggerChildren: STAGGER } } }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className={dragging ? 'certificates__rail certificates__rail--dragging' : 'certificates__rail'}
            aria-label="Certificates, newest first"
            onScroll={updateEdges}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClickCapture={(event) => {
              if (!suppressClick.current) return
              suppressClick.current = false
              event.preventDefault()
              event.stopPropagation()
            }}
          >
            {certificates.map((certificate, index) => (
              <motion.li key={certificate.title} className="certificates__item" variants={riseIn(reduced)}>
                <CertificateCard
                  certificate={certificate}
                  index={index}
                  isOpen={openIndex === index}
                  tilt={!reduced}
                  onOpen={onOpen}
                />
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  )
}
