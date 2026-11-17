import { useCallback, useEffect, useRef } from 'react'
import type { KeyboardEvent, MouseEvent, ReactNode, RefObject } from 'react'
import { AnimatePresence, motion, useIsPresent } from 'motion/react'
import type { Certificate } from '../data/portfolio'
import { FADE, MORPH, STAGGER } from '../lib/motion'
import './CertificateLightbox.css'

type CertificateSelection = { index: number; certificate: Certificate }

type CertificateLightboxProps = {
  selection: CertificateSelection | null
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

function LightboxDialog({ selection, onClose }: { selection: CertificateSelection; onClose: () => void }) {
  const { index, certificate } = selection
  const closeRef = useRef<HTMLButtonElement>(null)
  useDialogFocus(closeRef)

  const titleId = `certificate-lightbox-title-${index}`

  // The scroller sits above the backdrop, so a click on its empty area is a backdrop click.
  // Clicks on its scrollbar also target it and must not close the dialog.
  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (event.clientX - rect.left >= event.currentTarget.clientWidth) return
    onClose()
  }

  return (
    <div className="cert-lightbox">
      <motion.div
        className="cert-lightbox__backdrop"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={FADE}
      />
      <motion.div className="cert-lightbox__scroller" layoutScroll onClick={handleBackdropClick}>
        <motion.article
          className="cert-lightbox__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onKeyDown={trapTab}
        >
          <motion.div
            className="cert-lightbox__paper"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={MORPH}
          />
          <div className="cert-lightbox__content">
            <Reveal order={0} offset={0} className="cert-lightbox__bar">
              <button
                ref={closeRef}
                type="button"
                className="cert-lightbox__close"
                aria-label="Close"
                onClick={onClose}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </Reveal>

            <motion.img
              className="cert-lightbox__image"
              layoutId={`certificate-media-${index}`}
              layoutDependency={index}
              transition={MORPH}
              style={{ borderRadius: 12 }}
              src={certificate.image}
              alt={`${certificate.title} certificate from ${certificate.issuer}`}
            />

            <div className="cert-lightbox__caption">
              <Reveal order={1}>
                <p className="cert-lightbox__kicker">verified learning</p>
              </Reveal>
              <motion.h2
                id={titleId}
                className="cert-lightbox__title"
                layoutId={`certificate-title-${index}`}
                layoutDependency={index}
                transition={MORPH}
              >
                {certificate.title}
              </motion.h2>
              <Reveal order={2}>
                <p className="cert-lightbox__issuer">{certificate.issuer}</p>
              </Reveal>
            </div>
          </div>
        </motion.article>
      </motion.div>
    </div>
  )
}

export default function CertificateLightbox({ selection, onClose }: CertificateLightboxProps) {
  return (
    <AnimatePresence>
      {selection ? <LightboxDialog key={selection.index} selection={selection} onClose={onClose} /> : null}
    </AnimatePresence>
  )
}
