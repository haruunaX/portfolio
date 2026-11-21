import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, ReactElement } from 'react'
import { AnimatePresence, motion, useIsPresent } from 'motion/react'
import { contact } from '../data/contact'
import { FADE, MORPH, POP } from '../lib/motion'
import { SECTIONS } from '../lib/sections'
import type { SectionId } from '../lib/sections'
import { showToast } from '../lib/toast'
import { useReducedMotion } from '../lib/useReducedMotion'
import './CommandPalette.css'

const phoneQuery = window.matchMedia('(max-width: 760px)')
function subscribePhone(onChange: () => void) {
  phoneQuery.addEventListener('change', onChange)
  return () => phoneQuery.removeEventListener('change', onChange)
}
function getPhone() {
  return phoneQuery.matches
}

const SECTION_ICONS: Record<SectionId, ReactElement> = {
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

const ICON_COPY = (
  <>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h8" />
  </>
)
const ICON_RESUME = (
  <>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </>
)
const ICON_GITHUB = (
  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
)

const SECTION_KEYWORDS: Record<SectionId, string> = {
  home: 'top start hero landing badge',
  about: 'bio story cum laude education skills',
  work: 'projects ciudad archivist quiz odyssey lifewood pfc',
  experience: 'jobs internship lifewood camtastic career',
  certificates: 'learning trail google cisco nasa github',
  contact: 'email hire reach collaborate',
}

type Group = 'Sections' | 'Actions'
const GROUPS: readonly Group[] = ['Sections', 'Actions']

/** Sticker colour of an option's icon square. Fixed per entry, so filtering never recolours rows. */
type Tone = 'sky' | 'pink' | 'lime'
const TONES: readonly Tone[] = ['sky', 'pink', 'lime']

interface Entry {
  id: string
  group: Group
  /** Short name used for ranking, for example "Work". */
  name: string
  label: string
  hint: string
  keywords: string
  tone: Tone
  icon: ReactElement
  /** Section entries scroll after the palette has closed; actions run inside the click. */
  section?: SectionId
  run?: () => void
}

function copyEmail() {
  const fallback = () => {
    window.location.href = `mailto:${contact.email}`
  }
  if (!navigator.clipboard) {
    fallback()
    return
  }
  navigator.clipboard.writeText(contact.email).then(() => showToast('Email copied'), fallback)
}

const ENTRIES: readonly Entry[] = [
  ...SECTIONS.map(
    (s, i): Entry => ({
      id: s.id,
      group: 'Sections',
      name: s.label,
      label: `Go to ${s.label}`,
      hint: `#${s.id}`,
      keywords: SECTION_KEYWORDS[s.id],
      tone: TONES[i % TONES.length],
      icon: SECTION_ICONS[s.id],
      section: s.id,
    }),
  ),
  {
    id: 'copy-email',
    group: 'Actions',
    name: 'Copy email',
    label: 'Copy email',
    hint: contact.email,
    keywords: 'mail address contact',
    tone: 'sky',
    icon: ICON_COPY,
    run: copyEmail,
  },
  {
    id: 'open-resume',
    group: 'Actions',
    name: 'Open resume',
    label: 'Open resume',
    hint: 'PDF, new tab',
    keywords: 'cv pdf download',
    tone: 'pink',
    icon: ICON_RESUME,
    run: () => window.open(contact.resumeUrl, '_blank', 'noopener'),
  },
  {
    id: 'view-github',
    group: 'Actions',
    name: 'View GitHub',
    label: 'View GitHub',
    hint: contact.github.replace(/^https?:\/\//, ''),
    keywords: 'code repos git haruunax',
    tone: 'lime',
    icon: ICON_GITHUB,
    run: () => window.open(contact.github, '_blank', 'noopener'),
  },
]

/** Same behavior as the dock: set the hash, then scroll smoothly unless motion is reduced. */
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

function Highlight({ text, query }: { text: string; query: string }) {
  const at = query ? text.toLowerCase().indexOf(query) : -1
  if (at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  )
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const uid = useId()
  const reduced = useReducedMotion()
  const phone = useSyncExternalStore(subscribePhone, getPhone)
  const isPresent = useIsPresent()
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const q = query.trim().toLowerCase()
  const results = useMemo(() => {
    const score = (e: Entry) => (!q || e.name.toLowerCase().startsWith(q) ? 0 : e.label.toLowerCase().includes(q) ? 1 : 2)
    return ENTRIES.filter((e) => !q || `${e.label} ${e.keywords}`.toLowerCase().includes(q)).sort(
      (a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || score(a) - score(b),
    )
  }, [q])
  const activeIndex = Math.min(active, results.length - 1)
  const optionId = (i: number) => `${uid}-opt-${i}`

  // Focus lands in the input on open. The wrapper has already captured the opener.
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  // Escape closes; Tab is trapped between the close button and the input.
  useEffect(() => {
    if (!isPresent) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const stops = panel.querySelectorAll<HTMLElement>('button, input')
      if (!stops.length) return
      const first = stops[0]
      const last = stops[stops.length - 1]
      const here = document.activeElement
      if (!(here instanceof Node) || !panel.contains(here)) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
      } else if (e.shiftKey && here === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && here === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isPresent, onClose])

  // Keep the highlighted option visible inside the scrolling list.
  useEffect(() => {
    const list = listRef.current
    const el = document.getElementById(optionId(activeIndex))
    if (!list || !el) return
    if (activeIndex === 0) list.scrollTop = 0
    else if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight
    }
    // optionId only depends on uid, which is stable for this dialog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, results])

  const choose = (i: number) => {
    const entry = results[i]
    if (!entry) return
    onClose()
    if (entry.section) {
      const id = entry.section
      window.setTimeout(() => goToSection(id, reduced), 140)
    } else {
      entry.run?.()
    }
  }

  const onInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!results.length) return
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((activeIndex + step + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(activeIndex)
    }
  }

  // Reduced motion: plain fades only. Otherwise the panel slaps on (desktop) or slides up (phone).
  const offstage = reduced ? { opacity: 0 } : phone ? { y: '100%' } : { y: 18, scale: 0.94, rotate: -2 }
  const onstage = reduced ? { opacity: 1 } : phone ? { y: 0 } : { y: 0, scale: 1, rotate: 0 }

  return (
    <motion.div
      className="cmdk"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: FADE }}
      transition={FADE}
    >
      <div className="cmdk-back" onClick={onClose} aria-hidden="true" />
      <motion.div
        ref={panelRef}
        className="cmdk-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        inert={!isPresent}
        initial={offstage}
        animate={onstage}
        exit={{ ...offstage, transition: FADE }}
        transition={reduced ? FADE : phone ? MORPH : POP}
      >
        <span className="cmdk-grab" aria-hidden="true" />
        <div className="cmdk-head">
          <h2 className="cmdk-title" id={`${uid}-title`}>
            Hey Hannah, <em>where to?</em>
          </h2>
          <button type="button" className="cmdk-close" onClick={onClose} aria-label="Close command palette">
            <span className="cmdk-close-text">Close</span>
            <kbd aria-hidden="true">esc</kbd>
          </button>
        </div>

        <div className="cmdk-input">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Search sections and actions"
            aria-label="Search sections and actions"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls={`${uid}-list`}
            aria-activedescendant={results.length ? optionId(activeIndex) : undefined}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onInputKeyDown}
          />
        </div>

        <ul ref={listRef} className="cmdk-list" id={`${uid}-list`} role="listbox" aria-labelledby={`${uid}-title`}>
          {results.map((entry, i) => {
            const header = results[i - 1]?.group !== entry.group ? entry.group : null
            return (
              <li key={entry.id} role="presentation" className="cmdk-row">
                {header && <div className="cmdk-group">{header}</div>}
                <div
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === activeIndex}
                  className="cmdk-opt"
                  onMouseMove={() => i !== activeIndex && setActive(i)}
                  onClick={() => choose(i)}
                >
                  <span className="cmdk-ic" data-tone={entry.tone}>
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      {entry.icon}
                    </svg>
                  </span>
                  <span className="cmdk-label">
                    <Highlight text={entry.label} query={q} />
                  </span>
                  <span className="cmdk-hint">{entry.hint}</span>
                </div>
              </li>
            )
          })}
          {!results.length && (
            <li role="presentation" className="cmdk-empty">
              Nothing matches that. Try "work" or "email".
            </li>
          )}
        </ul>
        <div className="sr-only" role="status">
          {results.length ? `${results.length} results` : 'No results'}
        </div>

        <div className="cmdk-foot" aria-hidden="true">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> move
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  // Layout effects run before the dialog's own effect moves focus into the input,
  // so this still sees the opener as the active element.
  useLayoutEffect(() => {
    if (!open) return
    const opener = document.activeElement
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true })
    }
  }, [open])

  // Scroll lock while open. The stable scrollbar gutter in index.css keeps the page from shifting.
  useEffect(() => {
    if (!open) return
    const html = document.documentElement
    const body = document.body
    const prev = { html: html.style.overflow, body: body.style.overflow }
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prev.html
      body.style.overflow = prev.body
    }
  }, [open])

  return <AnimatePresence>{open && <PaletteDialog key="palette" onClose={onClose} />}</AnimatePresence>
}
