import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig } from 'motion/react'
import LoadingScreen from './components/LoadingScreen'
import Toaster from './components/Toast'
import Navigation from './components/Navigation'
import Hero from './components/Hero'
import AboutSection from './components/AboutSection'
import WorkSection from './components/WorkSection'
import MarqueeBand from './components/MarqueeBand'
import ExperienceSection from './components/ExperienceSection'
import CertificatesSection from './components/CertificatesSection'
import ContactSection from './components/ContactSection'
import ProjectCaseFile from './components/ProjectCaseFile'
import CertificateLightbox from './components/CertificateLightbox'
import ExperienceSheet from './components/ExperienceSheet'
import { LEGACY_HASHES, SECTIONS } from './lib/sections'
import type { SectionId } from './lib/sections'
import { reducedMotionQuery, useReducedMotion } from './lib/useReducedMotion'
import type { Certificate, Experience, Project } from './data/portfolio'

type CertificateSelection = { index: number; certificate: Certificate }

function readIntroSeen() {
  try {
    return sessionStorage.getItem('hs-intro-seen') === '1'
  } catch {
    return false
  }
}

/** The section a URL hash points at, including anchors from older versions of the site. */
function sectionFromHash(hash: string): SectionId | null {
  const key = hash.replace(/^#/, '')
  if (!key) return null
  const current = SECTIONS.find(({ id }) => id === key)
  return current ? current.id : LEGACY_HASHES[key] ?? null
}

function App() {
  const reduceMotion = useReducedMotion()
  const [introDone, setIntroDone] = useState(readIntroSeen)
  // The intro hands its badge card to the hero only when this visit starts on the hero, with
  // motion allowed, and the hero badge is on screen (on phones it can sit below the fold).
  const [handoff, setHandoff] = useState(() => {
    const target = sectionFromHash(window.location.hash)
    return !introDone && !reducedMotionQuery.matches && (target === null || target === 'home')
  })
  const [activeSection, setActiveSection] = useState<SectionId>('home')
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [activeCertificate, setActiveCertificate] = useState<CertificateSelection | null>(null)
  const [activeExperience, setActiveExperience] = useState<Experience | null>(null)

  const dialogOpen = activeProject !== null || activeCertificate !== null || activeExperience !== null

  const handleIntroComplete = useCallback(() => {
    setIntroDone(true)
    try {
      sessionStorage.setItem('hs-intro-seen', '1')
    } catch {
      /* private browsing or storage disabled: the intro just replays next visit */
    }
  }, [])

  // Decide the handoff one frame after mount, once the hero is laid out under the loader. That
  // is long before the loader can leave (it stays up at least 350ms with motion on), which
  // matters because the exiting loader keeps the props it last rendered with.
  useEffect(() => {
    if (!handoff) return
    const frame = window.requestAnimationFrame(() => {
      const stage = document.querySelector('.hero-badge')?.getBoundingClientRect()
      // The poster card spans roughly 32% to 98% of the stage height.
      if (stage && stage.top + stage.height * 0.65 > window.innerHeight) setHandoff(false)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [handoff])

  // Deep links: once the intro is gone, land on the target section and keep correcting while
  // late images and fonts change the page height. Old anchors (#projects, #skills) are mapped.
  useEffect(() => {
    if (!introDone) return
    const target = sectionFromHash(window.location.hash)
    if (!target) return
    if (window.location.hash !== `#${target}`) window.history.replaceState(null, '', `#${target}`)
    const element = document.getElementById(target)
    if (!element) return

    let settleTimer = 0
    let maxTimer = 0
    const correct = () => {
      element.scrollIntoView({ behavior: 'instant' })
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(stop, 400)
    }
    const stop = () => {
      window.clearTimeout(settleTimer)
      window.clearTimeout(maxTimer)
      observer.disconnect()
    }
    const observer = new ResizeObserver(correct)
    observer.observe(document.documentElement)
    correct()
    maxTimer = window.setTimeout(stop, 3000)
    return stop
  }, [introDone])

  // Scroll-spy for the dock: the current section is the last one whose top has passed 40% of
  // the viewport; the very bottom of the page always counts as Contact.
  useEffect(() => {
    if (!introDone) return
    let frame = 0
    const update = () => {
      frame = 0
      const marker = window.innerHeight * 0.4
      let current: SectionId = 'home'
      for (const { id } of SECTIONS) {
        const element = document.getElementById(id)
        if (element && element.getBoundingClientRect().top <= marker) current = id
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      setActiveSection(atBottom ? 'contact' : current)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    const resizeObserver = new ResizeObserver(schedule)
    resizeObserver.observe(document.getElementById('portfolio-content')!)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()
    return () => {
      window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [introDone])

  const scrollLocked = !introDone || dialogOpen
  useEffect(() => {
    if (!scrollLocked) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [scrollLocked])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setActiveProject(null)
      setActiveCertificate(null)
      setActiveExperience(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'never'}>
      <div className="site" data-ready={introDone}>
        <AnimatePresence>
          {!introDone && (
            <LoadingScreen key="intro" onComplete={handleIntroComplete} reduceMotion={reduceMotion} handoff={handoff} />
          )}
        </AnimatePresence>

        <Navigation activeSection={activeSection} hidden={!introDone || dialogOpen} />

        <main id="portfolio-content" inert={!introDone}>
          <Hero introDone={introDone} reduceMotion={reduceMotion} handoff={handoff} />
          <AboutSection />
          <WorkSection openNumber={activeProject?.number ?? null} onOpen={setActiveProject} />
          <MarqueeBand />
          <ExperienceSection openId={activeExperience?.id ?? null} onOpen={setActiveExperience} />
          <CertificatesSection openIndex={activeCertificate?.index ?? null} onOpen={setActiveCertificate} />
          <ContactSection />
        </main>

        <ProjectCaseFile project={activeProject} onClose={() => setActiveProject(null)} onNavigate={setActiveProject} />
        <CertificateLightbox selection={activeCertificate} onClose={() => setActiveCertificate(null)} />
        <ExperienceSheet experience={activeExperience} onClose={() => setActiveExperience(null)} />
        <Toaster />
      </div>
    </MotionConfig>
  )
}

export default App
