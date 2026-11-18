import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, ReactElement } from 'react'
import { SECTIONS } from '../lib/sections'
import type { SectionId } from '../lib/sections'
import { useReducedMotion } from '../lib/useReducedMotion'
import './Navigation.css'

const loadPalette = () => import('./CommandPalette')
const CommandPalette = lazy(loadPalette)

const ICONS: Record<SectionId, ReactElement> = {
  home: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h5v-6h4v6h5V10" />
    </>
  ),
  about: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </>
  ),
  work: (
    <>
      <rect x="3" y="3" width="8" height="10" rx="2" />
      <rect x="13" y="3" width="8" height="6" rx="2" />
      <rect x="3" y="15" width="8" height="6" rx="2" />
      <rect x="13" y="11" width="8" height="10" rx="2" />
    </>
  ),
  experience: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </>
  ),
  certificates: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 14.5L7 22l5-3 5 3-1.5-7.5" />
    </>
  ),
  contact: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
}

/** Resting and magnified dock item sizes in px, and how far (px) the magnify bell reaches. */
const BASE = 46
const MAX = 78
const SPREAD = 52

const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)

/**
 * Sets the URL hash, then scrolls to the section. Assigning the hash makes the browser jump,
 * so the old scroll position is restored first and the smooth scroll starts from there.
 */
function goToSection(id: SectionId, reduced: boolean) {
  const behavior = reduced ? 'instant' : 'smooth'
  const top = window.scrollY
  if (window.location.hash !== `#${id}`) {
    window.location.hash = id
    window.scrollTo({ top, behavior: 'instant' })
  }
  const target = document.getElementById(id)
  if (id === 'home' || !target) window.scrollTo({ top: 0, behavior })
  else target.scrollIntoView({ behavior, block: 'start' })
}

interface NavigationProps {
  activeSection: SectionId
  /** True while a dialog is open: the whole nav layer fades out and becomes inert. */
  hidden: boolean
}

export default function Navigation({ activeSection, hidden }: NavigationProps) {
  const reduced = useReducedMotion()
  const dockRef = useRef<HTMLElement>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteLoaded, setPaletteLoaded] = useState(false)

  const closePalette = useCallback(() => setPaletteOpen(false), [])
  const openPalette = useCallback((e: ReactMouseEvent<HTMLButtonElement>) => {
    // Safari does not focus buttons on click; focus it so the palette can return focus here.
    e.currentTarget.focus({ preventScroll: true })
    setPaletteLoaded(true)
    setPaletteOpen(true)
  }, [])

  // While a visitor types into a field, the dock steps aside so it can never cover the form
  // (for example the contact form's Send button) or stack on top of a phone keyboard.
  const [typing, setTyping] = useState(false)
  useEffect(() => {
    const NON_TEXT_INPUTS = ['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image']
    let frame = 0
    // Read focus a frame later, so moving between two fields does not make the dock flicker.
    const sync = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = document.activeElement
        setTyping(
          el instanceof HTMLTextAreaElement ||
            el instanceof HTMLSelectElement ||
            (el instanceof HTMLInputElement && !NON_TEXT_INPUTS.includes(el.type)) ||
            (el instanceof HTMLElement && el.isContentEditable),
        )
      })
    }
    document.addEventListener('focusin', sync)
    document.addEventListener('focusout', sync)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('focusin', sync)
      document.removeEventListener('focusout', sync)
    }
  }, [])

  // Ctrl/Cmd+K toggles the palette, except while typing in a field outside the palette.
  useEffect(() => {
    if (hidden) return
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== 'k') return
      const t = e.target
      if (
        t instanceof Element &&
        t.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') &&
        !t.closest('.cmdk')
      ) {
        return
      }
      e.preventDefault()
      setPaletteLoaded(true)
      setPaletteOpen((open) => !open)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hidden])

  // Dock magnification: sizes are written as CSS vars from one rAF loop that idles once settled.
  useEffect(() => {
    const dock = dockRef.current
    if (!dock) return
    const items = Array.from(dock.querySelectorAll<HTMLElement>('.nav-item'))
    items.forEach((el) => el.style.removeProperty('--nav-size'))
    if (reduced) return

    const phone = window.matchMedia('(max-width: 760px)')
    const sizes = items.map(() => BASE)
    const centers = new Float32Array(items.length)
    let pointerX: number | null = null
    let focusIndex = -1
    let raf = 0
    let last = 0

    const step = (now: number) => {
      raf = 0
      const f = Math.min(3, (now - last) / 16.667 || 1)
      last = now
      if (phone.matches) {
        items.forEach((el) => el.style.removeProperty('--nav-size'))
        sizes.fill(BASE)
        return
      }
      for (let i = 0; i < items.length; i++) {
        const r = items[i].getBoundingClientRect()
        centers[i] = r.left + r.width / 2
      }
      let moving = false
      for (let i = 0; i < items.length; i++) {
        let target = BASE
        if (pointerX !== null) {
          const d = pointerX - centers[i]
          target = BASE + (MAX - BASE) * Math.exp(-(d * d) / (2 * SPREAD * SPREAD))
        } else if (focusIndex > -1) {
          const k = Math.abs(i - focusIndex)
          target = BASE + (MAX - BASE) * (k === 0 ? 1 : k === 1 ? 0.35 : 0)
        }
        const next = sizes[i] + (target - sizes[i]) * Math.min(1, 0.25 * f)
        if (Math.abs(target - next) > 0.25) {
          moving = true
          sizes[i] = next
        } else {
          sizes[i] = target
        }
        items[i].style.setProperty('--nav-size', `${sizes[i].toFixed(1)}px`)
      }
      if (moving || pointerX !== null) raf = requestAnimationFrame(step)
    }
    const kick = () => {
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(step)
      }
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || phone.matches) return
      pointerX = e.clientX
      kick()
    }
    const onLeave = () => {
      pointerX = null
      kick()
    }
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target
      if (!(el instanceof HTMLElement) || !el.matches(':focus-visible')) return
      focusIndex = items.indexOf(el)
      if (focusIndex > -1) kick()
    }
    const onFocusOut = () => {
      focusIndex = -1
      kick()
    }
    dock.addEventListener('pointermove', onMove)
    dock.addEventListener('pointerleave', onLeave)
    dock.addEventListener('focusin', onFocusIn)
    dock.addEventListener('focusout', onFocusOut)
    return () => {
      cancelAnimationFrame(raf)
      dock.removeEventListener('pointermove', onMove)
      dock.removeEventListener('pointerleave', onLeave)
      dock.removeEventListener('focusin', onFocusIn)
      dock.removeEventListener('focusout', onFocusOut)
      items.forEach((el) => el.style.removeProperty('--nav-size'))
    }
  }, [reduced])

  const onItemClick = (e: ReactMouseEvent<HTMLAnchorElement>, id: SectionId) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    goToSection(id, reduced)
  }

  const onDockKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('.nav-item'))
    const at = items.indexOf(document.activeElement as HTMLElement)
    if (at < 0) return
    e.preventDefault()
    const next = (at + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length
    items[next].focus()
  }

  const activeLabel = SECTIONS.find((s) => s.id === activeSection)?.label

  return (
    <>
      <div className="nav-layer" inert={hidden} data-hidden={hidden || undefined} data-typing={typing || undefined}>
        <div className="nav-dock-zone">
          <nav ref={dockRef} className="nav-dock" aria-label="Sections" onKeyDown={onDockKeyDown}>
            <span className="nav-now" key={activeSection} aria-hidden="true">
              {activeLabel}
            </span>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                className="nav-item"
                href={`#${s.id}`}
                aria-label={s.label}
                aria-current={s.id === activeSection ? 'location' : undefined}
                onClick={(e) => onItemClick(e, s.id)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  {ICONS[s.id]}
                </svg>
                <span className="nav-tip" aria-hidden="true">
                  {s.label}
                </span>
              </a>
            ))}
          </nav>
        </div>

        <button
          type="button"
          className="nav-chip"
          aria-label={`Open command palette, ${isApple ? 'Command' : 'Control'} K`}
          aria-haspopup="dialog"
          aria-expanded={paletteOpen}
          onClick={openPalette}
          onPointerEnter={loadPalette}
          onFocus={loadPalette}
        >
          <svg className="nav-chip-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <span className="nav-chip-text" aria-hidden="true">
            Jump to
          </span>
          <span className="nav-chip-keys" aria-hidden="true">
            <kbd>{isApple ? '⌘' : 'Ctrl'}</kbd>
            <kbd>K</kbd>
          </span>
        </button>
      </div>

      {paletteLoaded && (
        <Suspense fallback={null}>
          <CommandPalette open={paletteOpen} onClose={closePalette} />
        </Suspense>
      )}
    </>
  )
}
