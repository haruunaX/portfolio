import { useCallback, useEffect, useRef } from 'react'
import type { KeyboardEvent, MouseEvent, ReactNode, RefObject } from 'react'
import { AnimatePresence, motion, useIsPresent } from 'motion/react'
import type { Experience } from '../data/portfolio'
import { FADE, MORPH, STAGGER } from '../lib/motion'
import ExperienceMedia from './ExperienceMedia'
import './ExperienceSheet.css'

type ExperienceSheetProps = {
  experience: Experience | null
  onClose: () => void
}

/** Matches --r-lg. Motion needs a number to correct radius distortion during the morph. */
const SURFACE_RADIUS = 26

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Moves focus to the close button on mount and hands it back to the opener when the sheet leaves. */
function useDialogFocus(closeRef: RefObject<HTMLButtonElement | null>) {
  const isPresent = useIsPresent()
  const opener = useRef<HTMLElement | null>(null)
  const restored = useRef(false)

  const restore = useCallback(() => {
    if (restored.current) return
    restored.current = true
    const element = opener.current
    if (element?.isConnected) element.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    restored.current = false
    if (!opener.current && document.activeElement instanceof HTMLElement) {
      opener.current = document.activeElement
    }
    closeRef.current?.focus({ preventScroll: true })
    return restore
  }, [closeRef, restore])

  useEffect(() => {
    if (!isPresent) restore()
  }, [isPresent, restore])
}

/** Keeps Tab and Shift+Tab inside the dialog. Escape is handled by App. */
function trapTab(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'Tab') return
  const nodes = event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)
  if (nodes.length === 0) {
    event.preventDefault()
    return
  }
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  const active = document.activeElement
  if (event.shiftKey && (active === first || active === event.currentTarget)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

function Reveal({
  order,
  offset = 10,
  className,
  children,
}: {
  order: number
  offset?: number
  className?: string
  children: ReactNode
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: offset }}
      animate={{ opacity: 1, y: 0, transition: { ...FADE, delay: 0.16 + order * STAGGER } }}
      exit={{ opacity: 0, transition: FADE }}
    >
      {children}
    </motion.div>
  )
}

function SheetDialog({ experience, onClose }: { experience: Experience; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useDialogFocus(closeRef)

  const { id, period, role, company, description, tags, current, article } = experience
  const titleId = `experience-sheet-title-${id}`

  // The scroller sits above the backdrop, so a click on its empty area is a backdrop click.
  // Clicks on its scrollbar also target it and must not close the sheet.
  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (event.clientX - rect.left >= event.currentTarget.clientWidth) return
    onClose()
  }

  return (
    <div className="experience-sheet">
      <motion.div
        className="experience-sheet__backdrop"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={FADE}
      />
      <motion.div className="experience-sheet__scroller" layoutScroll onClick={handleBackdropClick}>
        <motion.article
          className="experience-sheet__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onKeyDown={trapTab}
        >
          <motion.div
            className="experience-sheet__surface"
            aria-hidden="true"
            layoutId={`experience-card-${id}`}
            layoutDependency="dialog"
            transition={MORPH}
            style={{ borderRadius: SURFACE_RADIUS }}
          />
          <div className="experience-sheet__content">
            <Reveal order={0} offset={0} className="experience-sheet__bar">
              <button
                ref={closeRef}
                type="button"
                className="experience-sheet__close"
                aria-label="Close"
                onClick={onClose}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </button>
            </Reveal>

            <Reveal order={1} className="experience-sheet__head">
              <p className="experience-sheet__period">
                <span>{period}</span>
                {current && <span className="chip chip-lime experience-sheet__now">Now</span>}
              </p>
              <h2 id={titleId} className="experience-sheet__role">
                {role}
              </h2>
              <p className="experience-sheet__company">{company}</p>
            </Reveal>

            <div className="experience-sheet__body">
              <Reveal order={2} className="experience-sheet__media">
                <ExperienceMedia experience={experience} />
              </Reveal>

              <div className="experience-sheet__text">
                <Reveal order={3}>
                  <p className="experience-sheet__description">{description}</p>
                </Reveal>
                <Reveal order={4}>
                  <ul className="experience-sheet__tags" aria-label="Focus areas">
                    {tags.map((tag) => (
                      <li key={tag} className="chip">
                        {tag}
                      </li>
                    ))}
                  </ul>
                </Reveal>
                {article && (
                  <Reveal order={5}>
                    <a className="btn btn-lime experience-sheet__link" href={article} target="_blank" rel="noreferrer">
                      Read the CTU press article
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                        <path
                          d="M7 17L17 7M9 7h8v8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </Reveal>
                )}
              </div>
            </div>
          </div>
        </motion.article>
      </motion.div>
    </div>
  )
}

export default function ExperienceSheet({ experience, onClose }: ExperienceSheetProps) {
  return (
    <AnimatePresence>
      {experience ? <SheetDialog key={experience.id} experience={experience} onClose={onClose} /> : null}
    </AnimatePresence>
  )
}
