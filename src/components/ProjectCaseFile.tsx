import { useCallback, useEffect, useRef } from 'react'
import type { KeyboardEvent, MouseEvent, ReactNode, RefObject } from 'react'
import { AnimatePresence, motion, useIsPresent } from 'motion/react'
import type { Project } from '../data/portfolio'
import { projectGalleries } from '../data/projectGalleries'
import { FADE, MORPH, STAGGER } from '../lib/motion'
import './ProjectCaseFile.css'

type ProjectCaseFileProps = {
  project: Project | null
  onClose: () => void
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Moves focus to the close button on mount and hands it back to the opener when the dialog leaves. */
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

function CaseFileDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useDialogFocus(closeRef)

  const gallery = projectGalleries[project.number] ?? []
  const titleId = `case-file-title-${project.number}`

  // The scroller sits above the backdrop, so a click on its empty area is a backdrop click.
  // Clicks on its scrollbar also target it and must not close the dialog.
  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (event.clientX - rect.left >= event.currentTarget.clientWidth) return
    onClose()
  }

  return (
    <div className="case-file">
      <motion.div
        className="case-file__backdrop"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={FADE}
      />
      <motion.div className="case-file__scroller" layoutScroll onClick={handleBackdropClick}>
        <motion.article
          className="case-file__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onKeyDown={trapTab}
        >
          <motion.div
            className="case-file__paper"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={MORPH}
          />
          <div className="case-file__content">
            <Reveal order={0} offset={0} className="case-file__bar">
              <button ref={closeRef} type="button" className="case-file__close" aria-label="Close" onClick={onClose}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </Reveal>

            <div className="case-file__top">
              <div className="case-file__media">
                <motion.div
                  className="case-file__frame"
                  layoutId={`project-media-${project.number}`}
                  layoutDependency={project.number}
                  transition={MORPH}
                  style={{ borderRadius: 20 }}
                >
                  <img
                    className="case-file__image"
                    src={project.image}
                    alt={`${project.title} main screen`}
                  />
                </motion.div>
                <motion.span
                  className="case-file__number"
                  layoutId={`project-number-${project.number}`}
                  layoutDependency={project.number}
                  transition={MORPH}
                  style={{ borderRadius: 999 }}
                >
                  {project.number}
                </motion.span>
              </div>

              <div className="case-file__summary">
                <Reveal order={1}>
                  <p className="case-file__client">{project.client}</p>
                </Reveal>
                <motion.h2
                  id={titleId}
                  className="case-file__title"
                  layoutId={`project-title-${project.number}`}
                  layoutDependency={project.number}
                  transition={MORPH}
                >
                  {project.title}
                </motion.h2>
                <Reveal order={2}>
                  <p className="case-file__description">{project.description}</p>
                </Reveal>
                <Reveal order={3}>
                  <ul className="case-file__stack" aria-label="Tech stack">
                    {project.stack.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </Reveal>
                <Reveal order={4}>
                  <a className="case-file__link" href={project.link} target="_blank" rel="noreferrer">
                    View on GitHub
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
                    <span className="case-file__sr">(opens in a new tab)</span>
                  </a>
                </Reveal>
              </div>
            </div>

            {gallery.length > 0 && (
              <Reveal order={5} className="case-file__gallery">
                <h3 className="case-file__label">More screens</h3>
                <div className="case-file__gallery-grid">
                  {gallery.map((src, index) => (
                    <figure key={src} className="case-file__shot">
                      <img
                        src={src}
                        alt={`${project.title} screenshot ${index + 2}`}
                        loading="lazy"
                        decoding="async"
                      />
                    </figure>
                  ))}
                </div>
              </Reveal>
            )}
          </div>
        </motion.article>
      </motion.div>
    </div>
  )
}

export default function ProjectCaseFile({ project, onClose }: ProjectCaseFileProps) {
  return (
    <AnimatePresence>
      {project ? <CaseFileDialog key={project.number} project={project} onClose={onClose} /> : null}
    </AnimatePresence>
  )
}
