import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useIsPresent } from 'motion/react'
import './SceneStage.css'

type SceneStageProps = {
  scene: string
  reduceMotion: boolean
  ready: boolean
  children: ReactNode
}

function ScenePanel({ scene, reduceMotion, ready, children }: SceneStageProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const isPresent = useIsPresent()

  useEffect(() => {
    const panel = panelRef.current
    if (!panel || !ready) return
    const items = panel.querySelectorAll<HTMLElement>('[data-reveal]')
    if (reduceMotion) {
      items.forEach((item) => item.classList.add('is-visible'))
      return
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      }
    }, { root: panel.parentElement, threshold: 0.06, rootMargin: '0px 0px -16px 0px' })
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [ready, reduceMotion])

  return (
    <motion.div
      ref={panelRef}
      className="scene-page"
      data-active-scene={scene}
      inert={!isPresent || !ready}
      initial="hidden"
      animate={ready ? 'visible' : 'hidden'}
      exit="exit"
      variants={{
        hidden: { opacity: 0, y: reduceMotion ? 0 : 45, rotateX: reduceMotion ? 0 : 7, scale: reduceMotion ? 1 : 0.96 },
        visible: { opacity: 1, y: 0, rotateX: 0, scale: 1 },
        exit: { opacity: 0, y: reduceMotion ? 0 : -25, rotateX: reduceMotion ? 0 : -5, scale: reduceMotion ? 1 : 0.96 },
      }}
      transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={(definition) => {
        if (definition !== 'visible' || !isPresent || !ready) return
        const heading = panelRef.current?.querySelector<HTMLElement>('h1, h2')
        if (heading) {
          heading.tabIndex = -1
          heading.focus({ preventScroll: true })
        }
      }}
    >
      {children}
    </motion.div>
  )
}

export default function SceneStage(props: SceneStageProps) {
  const viewportRef = useRef<HTMLElement>(null)

  return (
    <main
      ref={viewportRef}
      id="portfolio-content"
      className="scene-viewport"
      aria-label="Portfolio scene"
      onScroll={(event) => {
        const viewport = event.currentTarget
        const range = viewport.scrollHeight - viewport.clientHeight
        const progress = range > 0 ? viewport.scrollTop / range : 0
        document.documentElement.style.setProperty('--scroll-progress', String(progress))
        document.documentElement.style.setProperty(
          '--parallax-offset',
          props.reduceMotion ? '0px' : `${viewport.scrollTop * -0.014}px`,
        )
      }}
    >
      <AnimatePresence
        mode="wait"
        onExitComplete={() => {
          viewportRef.current?.scrollTo({ top: 0, behavior: 'instant' })
          document.documentElement.style.setProperty('--scroll-progress', '0')
        }}
      >
        <ScenePanel key={props.scene} {...props} />
      </AnimatePresence>
    </main>
  )
}
