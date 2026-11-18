import { useEffect, useRef } from 'react'
import { badgePosition } from '../lib/badgePosition'
import {
  AVOID_PAD,
  BADGE_MARGIN,
  createSwarm,
  drawSwarm,
  resizeSwarm,
  setAvoidRects,
  settleSwarm,
  stepSwarm,
} from '../lib/swarm'
import './Swarm.css'

const SMALL_QUERY = '(max-width: 760px)'
const MAX_DPR = 1.5

interface Controller {
  /** Apply a change of the reduced-motion preference. */
  setReduced: (reduced: boolean) => void
}

/**
 * A school of sardines on a 2D canvas that fills the closest positioned ancestor. It scatters
 * from the pointer, circles the hero badge and keeps off any `[data-swarm-avoid]` element inside
 * the closest `section`. One rAF loop runs only while the canvas is on screen and the tab is
 * visible; under reduced motion it draws a single static frame instead.
 */
export default function Swarm({ reduceMotion }: { reduceMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedRef = useRef(reduceMotion)
  const controller = useRef<Controller | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const host: Element = canvas.closest('section') ?? canvas.parentElement ?? canvas

    const small = window.matchMedia(SMALL_QUERY)
    const pickCount = () => (small.matches || navigator.hardwareConcurrency <= 4 ? 70 : 140)

    let swarm = createSwarm(pickCount())
    let width = 0
    let height = 0
    let onScreen = false
    let raf = 0
    let last = 0
    let avoidDirty = true
    let staticTimer = 0
    let destroyed = false
    // pointer in viewport px
    let pointerX = 0
    let pointerY = 0
    let pointerActive = false
    // scratch for avoid rect measuring (grows on resize/scroll only, never per frame)
    const quads: number[] = []

    const measureAvoid = (rect: DOMRect) => {
      const els = host.querySelectorAll('[data-swarm-avoid]')
      let count = 0
      for (let i = 0; i < els.length; i++) {
        const r = els[i].getBoundingClientRect()
        if (r.width < 2 || r.height < 2) continue
        const o = count * 4
        quads[o] = r.left - rect.left - AVOID_PAD
        quads[o + 1] = r.top - rect.top - AVOID_PAD
        quads[o + 2] = r.right - rect.left + AVOID_PAD
        quads[o + 3] = r.bottom - rect.top + AVOID_PAD
        count++
      }
      setAvoidRects(swarm, quads, count)
      avoidDirty = false
    }

    const syncInputs = (rect: DOMRect) => {
      swarm.pointerActive = pointerActive && !reducedRef.current
      swarm.pointerX = pointerX - rect.left
      swarm.pointerY = pointerY - rect.top
      const radius = badgePosition.radius
      swarm.badgeActive = badgePosition.visible && radius > 0
      swarm.badgeX = badgePosition.x - rect.left
      swarm.badgeY = badgePosition.y - rect.top
      swarm.badgeRx = radius + BADGE_MARGIN
      swarm.badgeRy = radius + BADGE_MARGIN
    }

    const stopLoop = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }

    const renderStatic = (badgeRetries = 8) => {
      if (width <= 0 || height <= 0) return
      const rect = canvas.getBoundingClientRect()
      measureAvoid(rect)
      syncInputs(rect)
      settleSwarm(swarm, ctx)
      // On a cold load the intro can hold the badge back for up to 4.4s: keep re-settling until it
      // is measured (8 tries x 700ms covers that), so the still school does not sit behind it.
      window.clearTimeout(staticTimer)
      if (!badgePosition.visible && badgeRetries > 0) {
        staticTimer = window.setTimeout(() => {
          if (!destroyed && reducedRef.current) renderStatic(badgeRetries - 1)
        }, 700)
      }
    }

    const tick = (now: number) => {
      raf = 0
      if (!onScreen || document.hidden || reducedRef.current) return
      const f = Math.min(3, (now - last) / 16.667)
      last = now
      const rect = canvas.getBoundingClientRect()
      if (avoidDirty) measureAvoid(rect)
      syncInputs(rect)
      stepSwarm(swarm, f, now)
      drawSwarm(swarm, ctx, now)
      raf = requestAnimationFrame(tick)
    }

    /** Start or stop the loop from the on-screen and tab-visible state. */
    const update = () => {
      if (reducedRef.current) return
      if (onScreen && !document.hidden) {
        if (!raf) {
          last = performance.now()
          avoidDirty = true
          raf = requestAnimationFrame(tick)
        }
      } else {
        stopLoop()
      }
    }

    const resize = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w <= 0 || h <= 0) return
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const want = pickCount()
      if (want !== swarm.n) {
        swarm = createSwarm(want)
        width = 0
        height = 0
      }
      width = w
      height = h
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      measureAvoid(canvas.getBoundingClientRect())
      resizeSwarm(swarm, w, h, dpr)
      // resizing clears the backing store: repaint right away
      if (reducedRef.current) renderStatic()
      else drawSwarm(swarm, ctx, performance.now())
    }

    const onPointer = (e: PointerEvent) => {
      pointerX = e.clientX
      pointerY = e.clientY
      pointerActive = true
    }
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      pointerX = t.clientX
      pointerY = t.clientY
      pointerActive = true
    }
    const onLeave = () => {
      pointerActive = false
    }
    const onScroll = () => {
      avoidDirty = true
    }

    const passive = { passive: true } as const
    host.addEventListener('pointermove', onPointer as EventListener, passive)
    host.addEventListener('touchstart', onTouch as EventListener, passive)
    host.addEventListener('touchmove', onTouch as EventListener, passive)
    host.addEventListener('pointerleave', onLeave)
    host.addEventListener('pointercancel', onLeave)
    host.addEventListener('touchend', onLeave, passive)
    host.addEventListener('touchcancel', onLeave, passive)
    window.addEventListener('scroll', onScroll, passive)
    document.addEventListener('visibilitychange', update)
    small.addEventListener('change', resize)

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    const intersection = new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1].isIntersecting
      update()
    })
    intersection.observe(canvas)

    controller.current = {
      setReduced: (reduced) => {
        stopLoop()
        window.clearTimeout(staticTimer)
        if (reduced) renderStatic()
        else update()
      },
    }

    return () => {
      destroyed = true
      controller.current = null
      stopLoop()
      window.clearTimeout(staticTimer)
      resizeObserver.disconnect()
      intersection.disconnect()
      host.removeEventListener('pointermove', onPointer as EventListener)
      host.removeEventListener('touchstart', onTouch as EventListener)
      host.removeEventListener('touchmove', onTouch as EventListener)
      host.removeEventListener('pointerleave', onLeave)
      host.removeEventListener('pointercancel', onLeave)
      host.removeEventListener('touchend', onLeave)
      host.removeEventListener('touchcancel', onLeave)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', update)
      small.removeEventListener('change', resize)
    }
  }, [])

  useEffect(() => {
    reducedRef.current = reduceMotion
    controller.current?.setReduced(reduceMotion)
  }, [reduceMotion])

  return <canvas ref={canvasRef} className="swarm" aria-hidden="true" />
}
