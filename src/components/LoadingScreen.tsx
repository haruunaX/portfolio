import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import catLaptop from '../assets/cats/cat-laptop.jpg'
import catSleepy from '../assets/cats/cat-sleepy.jpg'
import './LoadingScreen.css'

interface LoadingScreenProps {
  /** Fired exactly once, when the intro has finished leaving (ready, timed out, or skipped). */
  onComplete: () => void
  /** Image URLs to load and decode before the intro releases. */
  assets?: readonly string[]
  /** Static, instant intro with zero motion. */
  reduceMotion?: boolean
}

type ExitReason = 'ready' | 'timeout' | 'skip'

/** Upper bound before the UI is released even if assets stall (plus EXIT_MS, stays under 5s). */
const MAX_WAIT_MS = 4400
/** Brief floor so a fully cached start does not flash the loader for a single frame. */
const MIN_VISIBLE_MS = 350
const EXIT_MS = 360

const FONTS_KEY = '__document-fonts__'
const FONT_FACES = ['700 1em "DM Sans"', '1em "Bowlby One SC"', '600 1em "Caveat"']
const FONT_SAMPLE = 'Hannah Sheen HS 0123456789'

/** Loads and decodes one image. Always settles (load, decode, or error). Returns cleanup. */
function loadImage(src: string, onSettle: (ok: boolean) => void): () => void {
  const img = new Image()
  let done = false
  let started = false

  const detach = () => {
    img.removeEventListener('load', handleLoad)
    img.removeEventListener('error', handleError)
  }
  const settle = (ok: boolean) => {
    if (done) return
    done = true
    detach()
    onSettle(ok)
  }
  function handleLoad() {
    if (started) return
    started = true
    if (typeof img.decode === 'function') {
      // A decode rejection after a successful load still leaves a usable image.
      img.decode().then(
        () => settle(true),
        () => settle(true),
      )
    } else {
      settle(true)
    }
  }
  function handleError() {
    settle(false)
  }

  img.addEventListener('load', handleLoad)
  img.addEventListener('error', handleError)
  img.decoding = 'async'
  img.src = src
  // Cached images may already be complete; the listeners above still cover the async event.
  if (img.complete && img.naturalWidth > 0) handleLoad()

  return () => {
    done = true
    detach()
  }
}

/** Resolves once the fonts this intro and the hero use have loaded or failed. Returns cleanup. */
function loadFonts(onSettle: () => void): () => void {
  let done = false
  const settle = () => {
    if (done) return
    done = true
    onSettle()
  }
  const fonts: FontFaceSet | undefined = document.fonts
  if (!fonts) {
    settle()
    return () => {
      done = true
    }
  }
  Promise.allSettled(FONT_FACES.map((face) => fonts.load(face, FONT_SAMPLE)))
    .then(() => fonts.ready)
    .then(settle, settle)
  return () => {
    done = true
  }
}

const STAGE_LABEL: Record<ExitReason | 'loading', string> = {
  loading: 'Loading fonts and photos',
  ready: 'Ready',
  timeout: 'Taking a while, opening anyway',
  skip: 'Skipping intro',
}

export default function LoadingScreen({
  onComplete,
  assets = [],
  reduceMotion = false,
}: LoadingScreenProps) {
  const titleId = useId()
  const skipRef = useRef<HTMLButtonElement>(null)
  const startRef = useRef<number | null>(null)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  const [settled, setSettled] = useState<Readonly<Record<string, boolean>>>({})
  const [forced, setForced] = useState<'timeout' | 'skip' | null>(null)
  const [leaving, setLeaving] = useState(false)

  // Callers often pass an inline callback; always call the latest one, never restart timers for it.
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Join by newline so a fresh-but-equal `assets` array never restarts loading.
  const urlKey = [catLaptop, catSleepy, ...assets].join('\n')
  const urls = useMemo(() => Array.from(new Set(urlKey.split('\n'))).filter(Boolean), [urlKey])

  const total = urls.length + 1
  const done = urls.reduce((count, url) => count + (url in settled ? 1 : 0), FONTS_KEY in settled ? 1 : 0)
  const failed = urls.reduce((count, url) => count + (settled[url] === false ? 1 : 0), 0)
  const allSettled = done >= total

  const exit: ExitReason | null = forced ?? (allSettled ? 'ready' : null)
  const stage = exit ?? 'loading'
  const percent = Math.min(100, Math.round((done / total) * 100))

  useEffect(() => {
    startRef.current ??= performance.now()
  }, [])

  // Real readiness: every image loaded/decoded (or errored) plus fonts.
  useEffect(() => {
    const record = (key: string, ok: boolean) =>
      setSettled((prev) => (key in prev ? prev : { ...prev, [key]: ok }))
    const cleanups = urls.map((url) => loadImage(url, (ok) => record(url, ok)))
    cleanups.push(loadFonts(() => record(FONTS_KEY, true)))
    return () => cleanups.forEach((cleanup) => cleanup())
  }, [urls])

  // Hard cap so stalled assets can never trap the user.
  useEffect(() => {
    if (allSettled || forced) return
    const elapsed = performance.now() - (startRef.current ?? performance.now())
    const timer = window.setTimeout(
      () => setForced((prev) => prev ?? 'timeout'),
      Math.max(0, MAX_WAIT_MS - elapsed),
    )
    return () => window.clearTimeout(timer)
  }, [allSettled, forced])

  // Exit sequence: optional anti-flash floor, short leave transition, then a single onComplete.
  useEffect(() => {
    if (!exit) return
    const elapsed = performance.now() - (startRef.current ?? performance.now())
    const wait = exit === 'ready' && !reduceMotion ? Math.max(0, MIN_VISIBLE_MS - elapsed) : 0
    let leaveTimer: number | undefined
    const waitTimer = window.setTimeout(() => {
      setLeaving(true)
      leaveTimer = window.setTimeout(() => {
        if (completedRef.current) return
        completedRef.current = true
        onCompleteRef.current()
      }, reduceMotion ? 0 : EXIT_MS)
    }, wait)
    return () => {
      window.clearTimeout(waitTimer)
      window.clearTimeout(leaveTimer)
    }
  }, [exit, reduceMotion])

  const skip = useCallback(() => {
    if (!leaving) setForced('skip')
  }, [leaving])

  // Keyboard: the Skip button takes focus immediately; Escape also skips.
  useEffect(() => {
    skipRef.current?.focus({ preventScroll: true })
  }, [])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') skip()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [skip])

  const statusText =
    stage === 'ready' && failed > 0 ? 'Ready, some images were skipped' : STAGE_LABEL[stage]
  const className = [
    'intro-loader',
    reduceMotion ? 'intro-loader--still' : '',
    leaving ? 'is-leaving' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={className}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-busy={exit === null}
      style={{ '--intro-loader-progress': percent / 100 } as CSSProperties}
    >
      <button ref={skipRef} type="button" className="intro-loader__skip" onClick={skip}>
        Skip intro<span aria-hidden="true"> →</span>
      </button>

      <div className="intro-loader__inner">
        <div className="intro-loader__scene" aria-hidden="true">
          <div className="intro-loader__camera">
            <div className="intro-loader__stack">
              <div className="intro-loader__card intro-loader__card--back">
                <span className="intro-loader__tape" />
              </div>
              <figure className="intro-loader__card intro-loader__card--mid">
                <img src={catSleepy} alt="" decoding="async" />
                <figcaption>nap first</figcaption>
              </figure>
              <figure className="intro-loader__card intro-loader__card--front">
                <img src={catLaptop} alt="" decoding="async" />
                <figcaption>ship it</figcaption>
              </figure>
              <span className="intro-loader__stamp">HS</span>
            </div>
          </div>
        </div>

        <div className="intro-loader__copy">
          <p className="intro-loader__kicker" aria-hidden="true">
            Hannah Sheen · portfolio
          </p>
          <p id={titleId} className="intro-loader__title">
            Assembling the good stuff
          </p>

          <div
            className="intro-loader__bar"
            role="progressbar"
            aria-label="Loading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <span className="intro-loader__fill" />
          </div>

          <div className="intro-loader__meta">
            <p className="intro-loader__status" role="status">
              {statusText}
            </p>
            <span className="intro-loader__percent" aria-hidden="true">
              {percent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
