import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { motion } from 'motion/react'
import formalPortrait from '../assets/images/hannah-formal.jpg'
import { FADE, MORPH } from '../lib/motion'
import BadgeFace from './BadgeFace'
import './HeroBadge.css'

const Lanyard = lazy(() => import('./Lanyard'))

/** Keeps a failed 3D badge (chunk, model, texture, or WebGL error) from taking the page down. */
class CanvasBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

interface HeroBadgeProps {
  /** The loader has started leaving: the poster may mount. */
  introDone: boolean
  /** Live reduced-motion preference. The canvas never mounts while it is on. */
  reduceMotion: boolean
  /** The poster flies in from the loader card (layoutId) instead of fading in. */
  handoff: boolean
}

const STAGE_LABEL =
  "Hannah Sheen's ID badge: IT Executive Assistant and full-stack developer, Cum Laude graduate of Cebu Technological University"

/** Fallback if the card's own animation callbacks never fire (instant under reduced motion). */
const STRAP_FALLBACK_MS = 900
/** Without a handoff the card only fades in; the strap follows once that is done. */
const FADE_MS = 320

let webglSupport: boolean | undefined

function detectWebGL(): boolean {
  if (webglSupport !== undefined) return webglSupport
  if (typeof document === 'undefined') return false
  try {
    const scratch = document.createElement('canvas')
    const gl = scratch.getContext('webgl2') || scratch.getContext('webgl')
    webglSupport = Boolean(gl)
    // Hand the scratch context back so it never counts against the browser's context limit.
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webglSupport = false
  }
  return webglSupport
}

/** Tracks whether the element is intersecting the viewport, grown by rootMargin. */
function useIntersecting(ref: RefObject<HTMLElement | null>, rootMargin: string): boolean {
  const [intersecting, setIntersecting] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      // Without the observer, treat the stage as visible and let the other gates decide.
      const id = window.setTimeout(() => setIntersecting(true), 0)
      return () => window.clearTimeout(id)
    }
    const observer = new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting), { rootMargin })
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref, rootMargin])
  return intersecting
}

export default function HeroBadge({ introDone, reduceMotion, handoff }: HeroBadgeProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const nearViewport = useIntersecting(stageRef, '200px 0px')
  const inView = useIntersecting(stageRef, '0px')
  const [webgl] = useState(detectWebGL)
  const [landed, setLanded] = useState(false)
  const [ready, setReady] = useState(false)
  // A failed or lost 3D badge (chunk or model load error, GPU reset, React StrictMode in dev)
  // keeps the poster for the rest of the visit.
  const [canvasFailed, setCanvasFailed] = useState(false)

  const showCanvas = introDone && !reduceMotion && webgl && nearViewport && !canvasFailed
  // The canvas is gone (reduced motion, left the area, failed): the poster must come back.
  if (!showCanvas && ready) setReady(false)
  const live = showCanvas && ready

  const handleReady = useCallback(() => setReady(true), [])
  const handleLanded = useCallback(() => setLanded(true), [])
  const handleCanvasFailure = useCallback(() => setCanvasFailed(true), [])

  // The strap fades in after the card lands; the timer covers instant (reduced motion) paths.
  useEffect(() => {
    if (!introDone) return
    const id = window.setTimeout(() => setLanded(true), handoff ? STRAP_FALLBACK_MS : FADE_MS)
    return () => window.clearTimeout(id)
  }, [introDone, handoff])

  const posterMotion = handoff
    ? {
        layoutId: 'hero-badge',
        // Must differ from the loader card's value, or Motion skips the shared morph.
        layoutDependency: 'hero-poster',
        transition: MORPH,
        onLayoutAnimationComplete: handleLanded,
      }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: FADE,
        onAnimationComplete: handleLanded,
      }

  return (
    <div
      ref={stageRef}
      className="hero-badge"
      data-live={live}
      data-landed={landed}
      role="img"
      aria-label={STAGE_LABEL}
    >
      <span className="hero-badge__sun" aria-hidden="true" />

      <div className="hero-badge__hardware" aria-hidden="true">
        <span className="hero-badge__rail" />
        <span className="hero-badge__strap" />
      </div>

      <div className="hero-badge__poster" aria-hidden="true">
        {introDone && (
          <motion.div className="hero-badge__card" {...posterMotion}>
            <BadgeFace />
          </motion.div>
        )}
      </div>

      {showCanvas && (
        <div className="hero-badge__canvas" aria-hidden="true">
          <CanvasBoundary onError={handleCanvasFailure}>
            <Suspense fallback={null}>
              <Lanyard portrait={formalPortrait} active={inView} onReady={handleReady} onContextLost={handleCanvasFailure} />
            </Suspense>
          </CanvasBoundary>
        </div>
      )}
    </div>
  )
}
