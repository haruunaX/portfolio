import { Fragment, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { FormEvent, PointerEvent } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import type { Transition } from 'motion/react'
import LoadingScreen from './components/LoadingScreen'
import HeroBadge from './components/HeroBadge'
import ExperienceMedia from './components/ExperienceMedia'
import ProjectCaseFile from './components/ProjectCaseFile'
import CertificateLightbox from './components/CertificateLightbox'
import graduationPortrait from './assets/images/hannah-graduation.jpg'
import resume from './assets/resume/Hannah-Sheen-Resume.pdf'
import { certificates, education, experiences, projects, skillGroups, skillKeywords } from './data/portfolio'
import type { Certificate, Project } from './data/portfolio'
import { FADE, MORPH } from './lib/motion'

const SECTIONS = [
  { id: 'home', label: 'home' },
  { id: 'about', label: 'about' },
  { id: 'experience', label: 'experience' },
  { id: 'projects', label: 'projects' },
  { id: 'skills', label: 'skills' },
  { id: 'certificates', label: 'certificates' },
  { id: 'contact', label: 'contact' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

type CertificateSelection = { index: number; certificate: Certificate }

/**
 * One timeline for the experience accordion. The active marker's shared-layout move uses the
 * same tween as the panel heights, so a panel collapsing above the target cancels out into a
 * single smooth glide instead of a jump.
 */
const ACCORDION_TRANSITION: Transition = { duration: 0.45, ease: [0.22, 1, 0.36, 1] }

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')

function subscribeToMotionPreference(onChange: () => void) {
  motionPreference.addEventListener('change', onChange)
  return () => motionPreference.removeEventListener('change', onChange)
}

function getMotionPreference() {
  return motionPreference.matches
}

function readIntroSeen() {
  try {
    return sessionStorage.getItem('hs-intro-seen') === '1'
  } catch {
    return false
  }
}

function resetDepth(target: HTMLElement) {
  target.style.setProperty('--pointer-x', '50%')
  target.style.setProperty('--pointer-y', '50%')
  target.style.setProperty('--tilt-x', '0deg')
  target.style.setProperty('--tilt-y', '0deg')
}

function StarMark() {
  return (
    <span className="star-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6-4.9-4.5 6.6-.8z" />
      </svg>
    </span>
  )
}

function CertificateCard({
  certificate,
  index,
  isOpen,
  reduceMotion,
  onOpen,
}: {
  certificate: Certificate
  index: number
  isOpen: boolean
  reduceMotion: boolean
  onOpen: () => void
}) {
  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (reduceMotion || event.pointerType !== 'mouse') return
    const card = event.currentTarget
    const bounds = card.getBoundingClientRect()
    const horizontal = (event.clientX - bounds.left) / bounds.width
    const vertical = (event.clientY - bounds.top) / bounds.height

    card.style.setProperty('--rotate-x', `${(vertical - 0.5) * -10}deg`)
    card.style.setProperty('--rotate-y', `${(horizontal - 0.5) * 12}deg`)
    card.style.setProperty('--sheen-x', `${horizontal * 100}%`)
    card.style.setProperty('--sheen-y', `${vertical * 100}%`)
  }

  const resetTilt = (card: HTMLElement) => {
    card.style.setProperty('--rotate-x', '0deg')
    card.style.setProperty('--rotate-y', '0deg')
  }

  return (
    <button
      className="certificate-card"
      type="button"
      onClick={(event) => {
        // Settle the tilt first so the shared image starts from its flat position.
        resetTilt(event.currentTarget)
        onOpen()
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={(event) => resetTilt(event.currentTarget)}
    >
      <span className="certificate-frame">
        <motion.img
          layoutId={`certificate-media-${index}`}
          layoutDependency={isOpen}
          transition={MORPH}
          src={certificate.image}
          alt={`${certificate.title} certificate`}
          loading="lazy"
        />
      </span>
      <span className="certificate-meta">
        <span className="certificate-number">proof #{String(index + 1).padStart(2, '0')}</span>
        <motion.strong layoutId={`certificate-title-${index}`} layoutDependency={isOpen} transition={MORPH}>
          {certificate.title}
        </motion.strong>
        <small>{certificate.issuer}</small>
        <span className="certificate-open">Open certificate</span>
      </span>
    </button>
  )
}

function App() {
  const reduceMotion = useSyncExternalStore(subscribeToMotionPreference, getMotionPreference)
  const [introDone, setIntroDone] = useState(readIntroSeen)
  // The intro hands its badge card to the hero only when this visit starts on the hero, with
  // motion allowed, and the hero badge is on screen (on phones it sits below the fold).
  const [handoff, setHandoff] = useState(
    () => !introDone && !motionPreference.matches && (!window.location.hash || window.location.hash === '#home'),
  )
  const [activeSection, setActiveSection] = useState<SectionId>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [activeCertificate, setActiveCertificate] = useState<CertificateSelection | null>(null)
  const [featuredExperienceIndex, setFeaturedExperienceIndex] = useState<number | null>(0)
  const [featuredProjectIndex, setFeaturedProjectIndex] = useState(0)
  const [formStatus, setFormStatus] = useState('')
  const showcaseRef = useRef<HTMLDivElement>(null)

  const featuredProject = projects[featuredProjectIndex]
  // Motion only morphs between shared elements whose layoutDependency values differ, so the
  // card side never uses the dialog's value (the project number).
  const caseFileDependency = activeProject ? 'case-open' : 'case-closed'

  useEffect(() => {
    if (!handoff) return
    // One frame after mount, so the hero is laid out under the loader. That is long before the
    // loader can leave (it stays up at least 350ms with motion on), which matters: the exiting
    // loader keeps the props it last rendered with, so both sides must agree before then.
    const frame = window.requestAnimationFrame(() => {
      const stage = document.querySelector('.hero-stage')?.getBoundingClientRect()
      // The poster card spans roughly 32% to 98% of the stage height (HeroBadge.css).
      if (stage && stage.top + stage.height * 0.65 > window.innerHeight) setHandoff(false)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [handoff])

  const handleIntroComplete = useCallback(() => {
    setIntroDone(true)
    try {
      sessionStorage.setItem('hs-intro-seen', '1')
    } catch {
      /* private browsing or storage disabled: intro just replays next load */
    }
  }, [])

  useEffect(() => {
    if (!introDone) return
    const target = SECTIONS.find(({ id }) => window.location.hash === `#${id}`)
    const element = target && document.getElementById(target.id)
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

  useEffect(() => {
    if (!introDone) return
    const items = document.querySelectorAll<HTMLElement>('[data-reveal]')
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' })
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [introDone])

  useEffect(() => {
    if (!introDone) return
    const sections = SECTIONS.map(({ id }) => document.getElementById(id)!)
    const projectsIndex = SECTIONS.findIndex(({ id }) => id === 'projects')
    let frame = 0
    const update = () => {
      frame = 0
      const range = document.documentElement.scrollHeight - window.innerHeight
      const progress = range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0
      document.documentElement.style.setProperty('--scroll-progress', String(progress))
      let current: SectionId = 'home'
      for (let index = 0; index < sections.length; index++) {
        if (sections[index].getBoundingClientRect().top <= window.innerHeight * 0.3) {
          current = SECTIONS[index].id
        }
      }
      setActiveSection(progress >= 0.999 ? 'contact' : current)

      if (reduceMotion) {
        document.documentElement.style.setProperty('--project-parallax', '0px')
      } else {
        const rect = sections[projectsIndex].getBoundingClientRect()
        const span = window.innerHeight / 2 + rect.height / 2
        const centered = rect.top + rect.height / 2 - window.innerHeight / 2
        const offset = span > 0 ? Math.max(-1, Math.min(1, centered / span)) : 0
        document.documentElement.style.setProperty('--project-parallax', `${(offset * -34).toFixed(2)}px`)
      }
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
  }, [introDone, reduceMotion])

  const scrollLocked = !introDone || activeProject !== null || activeCertificate !== null
  useEffect(() => {
    if (!scrollLocked) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [scrollLocked])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveProject(null)
        setActiveCertificate(null)
        setMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handlePointerDepth = (event: PointerEvent<HTMLElement>) => {
    if (reduceMotion || event.pointerType !== 'mouse') return
    const target = event.currentTarget
    const bounds = target.getBoundingClientRect()
    const horizontal = (event.clientX - bounds.left) / bounds.width
    const vertical = (event.clientY - bounds.top) / bounds.height

    target.style.setProperty('--pointer-x', `${horizontal * 100}%`)
    target.style.setProperty('--pointer-y', `${vertical * 100}%`)
    target.style.setProperty('--tilt-x', `${(0.5 - vertical) * 5}deg`)
    target.style.setProperty('--tilt-y', `${(horizontal - 0.5) * 7}deg`)
  }

  const openProject = (project: Project) => {
    // Flatten the card first so the shared screenshot starts from its resting box.
    if (showcaseRef.current) resetDepth(showcaseRef.current)
    setActiveProject(project)
  }

  const cycleProject = (direction: number) => {
    setFeaturedProjectIndex((current) => (current + direction + projects.length) % projects.length)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormStatus('Sending...')
    const form = event.currentTarget
    const payload = Object.fromEntries(new FormData(form))

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Unable to send')
      form.reset()
      setFormStatus('Message sent. Thank you!')
    } catch {
      setFormStatus('Email me directly at hannahsheen12@gmail.com')
    }
  }

  const renderSection = (section: SectionId) => {
    switch (section) {
      case 'home':
        return (
          <section id="home" className="hero section-pad" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="eyebrow">Developer. Organizer. Professional tab hoarder.</p>
              <h1 id="hero-title">
                <span className="hero-name">Hannah</span>
                <span className="hero-name hero-name-accent">Sheen</span>
              </h1>
              <p className="hero-role">IT Executive Assistant + full-stack developer</p>
              <p className="hero-credential">
                <StarMark />
                <span className="credential-text">
                  <span>
                    <strong>{education.honors}</strong> <span aria-hidden="true">·</span> BS Information Technology
                  </span>
                  <span>{education.school}, {education.year}</span>
                </span>
              </p>
              <p className="hero-intro">
                I turn busy ideas into useful digital experiences and tidy systems.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#projects">
                  See my work <span className="button-arrow" aria-hidden="true">↗</span>
                </a>
                <a className="button button-secondary" href={resume} target="_blank" rel="noreferrer">
                  Open resume <span className="button-arrow" aria-hidden="true">↗</span>
                </a>
              </div>
            </div>

            <div className="hero-stage">
              <HeroBadge introDone={introDone} reduceMotion={reduceMotion} handoff={handoff} />
            </div>

            <div className="hero-footer">
              <p>Based in Cebu, Philippines</p>
              <a href="#about">
                A little more about me <span aria-hidden="true">↓</span>
              </a>
            </div>
          </section>
        )

      case 'about':
        return (
          <section id="about" className="about section-pad" aria-labelledby="about-title">
            <p className="section-kicker" data-reveal>01 / about me</p>
            <div className="about-grid">
              <article className="surface about-bio" data-reveal>
                <h2 id="about-title">I like making complicated things feel simple.</h2>
                <p>
                  I am a Cebu-based developer who enjoys building useful systems, learning fast,
                  and helping teams keep technical work human. My sweet spot sits between code,
                  coordination, and thoughtful user experience.
                </p>
                <p className="about-signoff">The goal: useful, clear, and never boring.</p>
              </article>
              <article className="surface about-now" data-reveal>
                <p className="card-kicker">currently doing</p>
                <h3>IT Executive Assistant</h3>
                <p className="company-name">Lifewood Data Technology</p>
                <p>
                  Keeping operations organized, assisting technical priorities, and helping work
                  move from "we should" to "done."
                </p>
              </article>
              <article className="surface about-honors" data-reveal aria-labelledby="honors-title">
                <figure className="honors-photo">
                  <img src={graduationPortrait} alt="Hannah Sheen in her graduation toga" loading="lazy" />
                </figure>
                <div className="honors-copy">
                  <p className="card-kicker">education</p>
                  <h3 id="honors-title">
                    {education.honors} <StarMark />
                  </h3>
                  <p className="honors-degree">{education.degree}</p>
                  <p className="honors-school">{education.school} · Class of {education.year}</p>
                </div>
              </article>
            </div>
          </section>
        )

      case 'experience':
        return (
          <section id="experience" className="experience section-pad" aria-labelledby="experience-title">
            <div className="section-heading" data-reveal>
              <div>
                <p className="section-kicker">02 / work log</p>
                <h2 id="experience-title">Places I have been useful</h2>
              </div>
              <p className="margin-note">Pick a career file. Hover, tap, inspect, repeat.</p>
            </div>
            <div className="experience-accordion" data-reveal>
              {experiences.map((item, index) => {
                const isOpen = featuredExperienceIndex === index
                const panelId = `experience-panel-${item.id}`

                return (
                  <article className={isOpen ? 'experience-file is-open' : 'experience-file'} key={item.id}>
                    <button
                      className="experience-trigger"
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setFeaturedExperienceIndex((current) => (current === index ? null : index))}
                    >
                      {isOpen && (
                        <motion.span
                          className="experience-marker"
                          layoutId="experience-active"
                          layoutDependency={featuredExperienceIndex}
                          transition={ACCORDION_TRANSITION}
                          style={{ borderRadius: 22 }}
                          aria-hidden="true"
                        />
                      )}
                      <span className="experience-number">{String(index + 1).padStart(2, '0')}</span>
                      <span className="experience-heading">
                        <small>{item.period}</small>
                        <strong>{item.role}</strong>
                        <span>{item.company}</span>
                      </span>
                      {item.current && <span className="now-chip">now</span>}
                      <span className="experience-action">{isOpen ? 'close file' : 'open file'}</span>
                    </button>

                    <motion.div
                      className="experience-panel-clip"
                      id={panelId}
                      inert={!isOpen}
                      aria-hidden={!isOpen}
                      initial={false}
                      animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                      transition={reduceMotion ? { duration: 0 } : ACCORDION_TRANSITION}
                    >
                      <div className="experience-panel">
                        <ExperienceMedia experience={item} />
                        <div className="experience-notes">
                          <p>{item.description}</p>
                          <ul className="tag-list">
                            {item.tags.map((tag) => <li key={tag}>{tag}</li>)}
                          </ul>
                          {item.article && (
                            <a className="press-link" href={item.article} target="_blank" rel="noreferrer">
                              Read the CTU school press <span aria-hidden="true">↗</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </article>
                )
              })}
            </div>
          </section>
        )

      case 'projects':
        return (
          <section id="projects" className="projects section-pad" aria-labelledby="projects-title">
            <div className="motion-ticker" aria-hidden="true">
              <div className="motion-ticker-track">
                <span>build it clean</span><span>ship it kindly</span><span>keep it human</span>
                <span>build it clean</span><span>ship it kindly</span><span>keep it human</span>
              </div>
            </div>

            <div className="section-heading" data-reveal>
              <div>
                <p className="section-kicker">03 / selected work</p>
                <h2 id="projects-title">Things I made instead of sleeping</h2>
              </div>
              <p className="margin-note">Pick a file, move your cursor, then open the full case notes.</p>
            </div>
            <div
              className="project-showcase"
              ref={showcaseRef}
              data-reveal
              onPointerMove={handlePointerDepth}
              onPointerLeave={(event) => resetDepth(event.currentTarget)}
            >
              <div className="project-visual-stage">
                <div className="project-ambient-card project-ambient-one" aria-hidden="true">
                  <img src={projects[(featuredProjectIndex + 1) % projects.length].image} alt="" />
                </div>
                <div className="project-ambient-card project-ambient-two" aria-hidden="true">
                  <img src={projects[(featuredProjectIndex + 2) % projects.length].image} alt="" />
                </div>
                <button
                  className="project-hero-card"
                  type="button"
                  onClick={() => openProject(featuredProject)}
                  aria-label={`Open case notes for ${featuredProject.title}`}
                >
                  <motion.span
                    key={`number-${featuredProject.number}`}
                    className="project-number"
                    layoutId={`project-number-${featuredProject.number}`}
                    layoutDependency={caseFileDependency}
                    transition={MORPH}
                    style={{ borderRadius: 999 }}
                    aria-hidden="true"
                  >
                    {featuredProject.number}
                  </motion.span>
                  <span className="project-preview-slot" aria-hidden="true">
                    <AnimatePresence initial={false} mode="popLayout">
                      <motion.span
                        key={featuredProject.number}
                        className="project-preview"
                        layoutId={`project-media-${featuredProject.number}`}
                        layoutDependency={caseFileDependency}
                        style={{ borderRadius: 14 }}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ ...FADE, layout: MORPH }}
                      >
                        <img src={featuredProject.image} alt="" />
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span className="project-image-caption">click image to open case notes</span>
                </button>
              </div>

              <article className="project-inspector">
                <motion.div
                  className="project-details"
                  key={featuredProject.number}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={FADE}
                >
                  <p className="project-client">{featuredProject.client}</p>
                  <motion.h3
                    layoutId={`project-title-${featuredProject.number}`}
                    layoutDependency={caseFileDependency}
                    transition={MORPH}
                  >
                    {featuredProject.title}
                  </motion.h3>
                  <p>{featuredProject.description}</p>
                  <ul className="tag-list">
                    {featuredProject.stack.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </motion.div>
                <div className="project-actions">
                  <button className="button button-primary" type="button" onClick={() => openProject(featuredProject)}>
                    Open case notes
                  </button>
                  <a className="button button-secondary" href={featuredProject.link} target="_blank" rel="noreferrer">
                    GitHub source
                  </a>
                </div>
                <div className="showcase-controls" aria-label="Project navigation">
                  <button type="button" onClick={() => cycleProject(-1)}>Previous project</button>
                  <span aria-live="polite" aria-atomic="true">{featuredProjectIndex + 1} / {projects.length}</span>
                  <button type="button" onClick={() => cycleProject(1)}>Next project</button>
                </div>
              </article>
            </div>

            <div className="project-selector" aria-label="Choose a project" data-reveal>
              {projects.map((project, index) => (
                <button
                  className={index === featuredProjectIndex ? 'project-selector-item is-active' : 'project-selector-item'}
                  type="button"
                  key={project.number}
                  aria-pressed={index === featuredProjectIndex}
                  onClick={() => setFeaturedProjectIndex(index)}
                  onFocus={() => setFeaturedProjectIndex(index)}
                  onMouseEnter={() => setFeaturedProjectIndex(index)}
                >
                  <img src={project.image} alt="" />
                  <span>{project.number}</span>
                  <strong>{project.title}</strong>
                </button>
              ))}
            </div>
          </section>
        )

      case 'skills':
        return (
          <section id="skills" className="skills section-pad" aria-labelledby="skills-title">
            <p className="section-kicker" data-reveal>04 / toolkit</p>
            <h2 id="skills-title" className="section-title" data-reveal>Things currently living in my brain</h2>
            <div className="skill-ticker" aria-hidden="true">
              <div className="skill-ticker-track">
                {skillKeywords.map((item) => <span key={item}>{item}</span>)}
                {skillKeywords.map((item) => <span key={`dup-${item}`}>{item}</span>)}
              </div>
            </div>
            <div className="skill-grid">
              {skillGroups.map((group) => (
                <article className="skill-card" key={group.title} data-reveal>
                  <h3>{group.title}</h3>
                  <ul>
                    {group.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )

      case 'certificates':
        return (
          <section id="certificates" className="certificates section-pad" aria-labelledby="certificates-title">
            <div className="section-heading" data-reveal>
              <div>
                <p className="section-kicker">05 / proof I did the homework</p>
                <h2 id="certificates-title">My learning trail</h2>
              </div>
              <p className="margin-note">A little timeline of things I learned. Click to inspect.</p>
            </div>
            <div className="certificate-trail">
              <div className="certificate-stage">
                {certificates.map((certificate, index) => (
                  <div className="certificate-plot" data-reveal key={certificate.title}>
                    <span className="certificate-node" aria-hidden="true" />
                    <CertificateCard
                      certificate={certificate}
                      index={index}
                      isOpen={activeCertificate?.index === index}
                      reduceMotion={reduceMotion}
                      onOpen={() => setActiveCertificate({ index, certificate })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )

      case 'contact':
        return (
          <section id="contact" className="contact section-pad" aria-labelledby="contact-title">
            <div className="contact-intro" data-reveal>
              <p className="section-kicker">06 / say hello</p>
              <h2 id="contact-title">Have a good idea? Send it my way.</h2>
              <p>I am open to thoughtful collaborations and tech conversations.</p>
              <div className="contact-links">
                <a href="mailto:hannahsheen12@gmail.com">Email</a>
                <a href="https://github.com/haruunaX" target="_blank" rel="noreferrer">GitHub</a>
                <a href="https://www.linkedin.com/in/hannah-sheen-obejero-8a44b63a4" target="_blank" rel="noreferrer">LinkedIn</a>
              </div>
            </div>
            <form className="contact-form" onSubmit={handleSubmit} data-reveal>
              <label>
                Your name
                <input name="name" type="text" autoComplete="name" required />
              </label>
              <label>
                Your email
                <input name="email" type="email" autoComplete="email" required />
              </label>
              <label>
                What is up?
                <textarea name="message" rows={5} required />
              </label>
              <button className="button button-primary" type="submit">Send message</button>
              <p className="form-status" aria-live="polite">{formStatus}</p>
            </form>

            <footer className="site-footer">
              <p>Built by Hannah in Cebu.</p>
              <a href="#home">Back to top</a>
            </footer>
          </section>
        )

      default:
        return null
    }
  }

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'never'}>
      <div className="site-shell" data-ready={introDone}>
        <AnimatePresence>
          {!introDone && (
            <LoadingScreen key="intro" onComplete={handleIntroComplete} reduceMotion={reduceMotion} handoff={handoff} />
          )}
        </AnimatePresence>

        <div className="scroll-progress" aria-hidden="true"><span /></div>

        <header className="site-header" inert={!introDone}>
          <a className="brand" href="#home" onClick={() => setMenuOpen(false)} aria-label="Hannah Sheen home">
            HS<span>.</span>
          </a>
          <button
            className="menu-button"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? 'close' : 'menu'}
          </button>
          <nav id="main-navigation" className={menuOpen ? 'site-nav is-open' : 'site-nav'} aria-label="Main navigation">
            {SECTIONS.map((section) => {
              const isActive = section.id === activeSection
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={isActive ? 'is-active' : undefined}
                  aria-current={isActive ? 'location' : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {isActive && (
                    <motion.span
                      className="nav-pill"
                      layoutId="nav-pill"
                      layoutDependency={activeSection}
                      transition={MORPH}
                      style={{ borderRadius: 999 }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="nav-label">{section.label}</span>
                </a>
              )
            })}
          </nav>
        </header>

        <main id="portfolio-content" inert={!introDone}>
          {SECTIONS.map(({ id }) => <Fragment key={id}>{renderSection(id)}</Fragment>)}
        </main>

        <ProjectCaseFile project={activeProject} onClose={() => setActiveProject(null)} />
        <CertificateLightbox selection={activeCertificate} onClose={() => setActiveCertificate(null)} />
      </div>
    </MotionConfig>
  )
}

export default App
