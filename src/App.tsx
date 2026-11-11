import { Fragment, useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import type { FormEvent, PointerEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import LoadingScreen from './components/LoadingScreen'
import MemeArcade from './components/MemeArcade'
import portrait from './assets/images/for_lanyard.jpg'
import resume from './assets/resume/Hannah-Sheen-Resume.pdf'
import catLaptop from './assets/cats/cat-laptop.jpg'
import catCouch from './assets/cats/cat-couch-laptop.jpg'
import catSleepy from './assets/cats/cat-sleepy.jpg'
import catLaptopSticker from './assets/cats/cat-laptop-sticker.gif'
import catTypingMeme from './assets/cats/cat-typing-tenor.gif'
import agingBlueCat from './assets/cats/aging-blue-cat.gif'
import judgementalCat from './assets/cats/judgemental-cat-tenor.gif'
import oiiaCat from './assets/cats/oiia-cat.gif'
import bananaCryCat from './assets/cats/banana-cry-cat.gif'
import huhCat from './assets/cats/huh-cat.gif'
import ciudad from './assets/projects/ciudad.png'
import archivist from './assets/projects/tas.jpeg'
import quizOdyssey from './assets/projects/quiz_odessey.png'
import lifewoodWebsite from './assets/projects/lifewood-website.png'
import pfcSystem from './assets/projects/PFCSystem.png'
import aseanAi from './assets/certifications/ASEAN AI MAPUA Workshop.png'
import pythonCourse from './assets/certifications/Crash Course on Python.jpeg'
import uxDesign from './assets/certifications/Foundations of UX Design.jpeg'
import githubVersionControl from './assets/certifications/Github_Version_Control.png'
import nasaCertificate from './assets/certifications/NASA Certificate.jpg'
import networkingBasics from './assets/certifications/Networking_Basics.png'

type Project = {
  number: string
  title: string
  client: string
  description: string
  image: string
  stack: string[]
  link: string
}

type Certificate = {
  title: string
  issuer: string
  image: string
}

type Experience = {
  period: string
  role: string
  company: string
  description: string
  tags: string[]
  current?: boolean
  image?: string
  imageAlt?: string
  imageCaption?: string
  article?: string
}

const SECTIONS = [
  { id: 'home', label: 'home' },
  { id: 'about', label: 'about' },
  { id: 'experience', label: 'experience' },
  { id: 'projects', label: 'projects' },
  { id: 'playground', label: 'cat lab' },
  { id: 'skills', label: 'skills' },
  { id: 'certificates', label: 'certificates' },
  { id: 'contact', label: 'contact' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')

function subscribeToMotionPreference(onChange: () => void) {
  motionPreference.addEventListener('change', onChange)
  return () => motionPreference.removeEventListener('change', onChange)
}

function getMotionPreference() {
  return motionPreference.matches
}

const schoolPressImage = 'https://www.ctu.edu.ph/wp-content/uploads/2026/01/1-2-1024x768.jpg'

const experiences: Experience[] = [
  {
    period: '2026 - Present',
    role: 'IT Executive Assistant',
    company: 'Lifewood Data Technology',
    description:
      'Supporting day-to-day IT operations while keeping people, priorities, and technical work organized and moving forward.',
    tags: ['IT Operations', 'Executive Support', 'Coordination'],
    current: true,
  },
  {
    period: 'Mar 2026 - Jun 2026',
    role: 'Full Stack Developer Intern',
    company: 'Lifewood Data Technology PH',
    description:
      'Worked across enterprise workflows, prompt engineering, efficient coding, and modern AI-assisted tools.',
    tags: ['Full Stack', 'AI Tools', 'Prompt Engineering'],
    image: lifewoodWebsite,
    imageAlt: 'Lifewood website project interface',
    imageCaption: 'Lifewood digital project archive',
  },
  {
    period: 'Jan 2026 - Mar 2026',
    role: 'Back End Developer Intern',
    company: 'Camtastic Philippines Corp.',
    description: 'Worked on backend logic using Pascal and SQL-based systems.',
    tags: ['Pascal', 'SQL', 'Backend Logic'],
  },
  {
    period: 'Aug 2025 - Oct 2025',
    role: 'Technical Training Instructor',
    company: 'Barangay San Roque (Ciudad)',
    description:
      'Delivered hands-on digital literacy and system training with the CTU Main CCICT extension team.',
    tags: ['Technical Instruction', 'Digital Skills', 'Community'],
    image: schoolPressImage,
    imageAlt: 'CTU Main CCICT digital skills training at Barangay San Roque',
    imageCaption: 'Featured by the official CTU school press',
    article:
      'https://www.ctu.edu.ph/ctu-main-ccict-equips-barangay-san-roque-personnel-with-essential-digital-skills/',
  },
  {
    period: 'Feb 2025 - Oct 2025',
    role: 'Project Management Lead',
    company: 'Cebu Technological University',
    description:
      'Led the development of BARIOS, an administrative platform designed to reduce manual barangay workflows.',
    tags: ['Project Management', 'BARIOS', 'Systems Delivery'],
    image: ciudad,
    imageAlt: 'BARIOS administrative system interface',
    imageCaption: 'BARIOS system field file',
  },
  {
    period: 'Oct 2024 - Jan 2025',
    role: 'Logistics Officer',
    company: 'Google Developer Groups on Campus - CTUMC',
    description:
      'Coordinated equipment, venue preparation, and event logistics for developer bootcamps and student tech workshops.',
    tags: ['Event Logistics', 'Inventory', 'Teamwork'],
  },
]

const projects: Project[] = [
  {
    number: '01',
    title: 'CIUDAD (BARIOS)',
    client: 'Brgy. San Roque',
    description:
      'A full-stack administrative platform for records, requests, and automated document workflows.',
    image: ciudad,
    stack: ['React Native', 'TypeScript', 'Django', 'PostgreSQL'],
    link: 'https://github.com/hannah-sheen/CIUDAD-APP-BARIOS',
  },
  {
    number: '02',
    title: "The Archivist's Silence",
    client: 'Lifewood Data Technology PH',
    description:
      'A 2D isometric tactical puzzle game set inside quiet, abandoned structural ruins.',
    image: archivist,
    stack: ['Godot', 'GDScript', 'Gemini AI'],
    link: 'https://github.com/hannah-sheen/tas',
  },
  {
    number: '03',
    title: 'Quiz Odyssey',
    client: 'Cebu Technological University',
    description:
      'A generative learning tool that turns source material into structured practice quizzes.',
    image: quizOdyssey,
    stack: ['JavaScript', 'Gemini AI', 'HTML', 'CSS'],
    link: 'https://github.com/hannah-sheen/PROJECT_QUIZODYSSEY',
  },
  {
    number: '04',
    title: 'Lifewood Website',
    client: 'Lifewood Data Technology PH',
    description:
      'A polished, responsive company website designed for clarity, speed, and localization.',
    image: lifewoodWebsite,
    stack: ['React', 'Tailwind CSS', 'Supabase'],
    link: 'https://github.com/hannah-sheen/lifewood-Website',
  },
  {
    number: '05',
    title: 'PFC System',
    client: 'People Fitness Center',
    description:
      'A fitness management system for memberships, attendance, performance, and schedules.',
    image: pfcSystem,
    stack: ['Python', 'SQL', 'Desktop UI'],
    link: 'https://github.com/hannah-sheen/PFCSystem',
  },
]

const skillGroups = [
  {
    title: 'I speak these',
    items: ['Python', 'Java', 'JavaScript', 'TypeScript', 'SQL', 'HTML', 'CSS'],
  },
  {
    title: 'I build with these',
    items: ['React', 'React Native', 'Django', 'Node.js', 'Flask', 'Tailwind CSS'],
  },
  {
    title: 'I store things here',
    items: ['PostgreSQL', 'MySQL', 'Supabase', 'MongoDB', 'SSMS'],
  },
  {
    title: 'Daily toolbox',
    items: ['Git', 'GitHub', 'VS Code', 'Figma', 'AI-assisted workflows'],
  },
]

const certificates: Certificate[] = [
  {
    title: 'ASEAN AI Workshop',
    issuer: 'MAPÚA University',
    image: aseanAi,
  },
  {
    title: 'Foundations of UX Design',
    issuer: 'Google',
    image: uxDesign,
  },
  {
    title: 'GitHub Version Control',
    issuer: 'GitHub',
    image: githubVersionControl,
  },
  {
    title: 'NASA Space Apps Challenge',
    issuer: 'NASA Space Apps',
    image: nasaCertificate,
  },
  {
    title: 'Crash Course on Python',
    issuer: 'Google',
    image: pythonCourse,
  },
  {
    title: 'Networking Basics',
    issuer: 'Cisco Networking Academy',
    image: networkingBasics,
  },
]

const catNotes = [
  'Debugging posture: suspiciously hunched.',
  'Current status: one tab away from greatness.',
  'The code works. Nobody touch anything.',
]

const brainrotCats = [
  {
    image: oiiaCat,
    alt: 'A cat spinning rapidly against a bright green background',
    title: 'OIIA mode',
    note: 'when the deploy actually works',
  },
  {
    image: bananaCryCat,
    alt: 'A tiny cat in a banana costume crying dramatically',
    title: 'banana incident',
    note: 'one harmless console error',
  },
  {
    image: huhCat,
    alt: 'A wide-eyed cat looking into the camera with the words you ok my g',
    title: 'code review',
    note: 'the function has 14 parameters',
  },
]

const introAssets = [portrait, catLaptop, catSleepy]

function CertificateCard({
  certificate,
  index,
  onOpen,
  reduceMotion,
}: {
  certificate: Certificate
  index: number
  onOpen: () => void
  reduceMotion: boolean
}) {
  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (reduceMotion || event.pointerType !== 'mouse') return
    const card = event.currentTarget
    const bounds = card.getBoundingClientRect()
    const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5
    const vertical = (event.clientY - bounds.top) / bounds.height - 0.5

    card.style.setProperty('--rotate-x', `${vertical * -13}deg`)
    card.style.setProperty('--rotate-y', `${horizontal * 15}deg`)
  }

  const resetTilt = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.setProperty('--rotate-x', '0deg')
    event.currentTarget.style.setProperty('--rotate-y', '0deg')
  }

  return (
    <button
      className="certificate-card"
      type="button"
      onClick={onOpen}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      <span className="certificate-number">proof #{String(index + 1).padStart(2, '0')}</span>
      <span className="certificate-frame">
        <img src={certificate.image} alt={`${certificate.title} certificate`} loading="lazy" />
      </span>
      <span className="certificate-meta">
        <strong>{certificate.title}</strong>
        <small>{certificate.issuer}</small>
        <span>Open certificate</span>
      </span>
    </button>
  )
}

function App() {
  const reduceMotion = useSyncExternalStore(subscribeToMotionPreference, getMotionPreference)
  const [introDone, setIntroDone] = useState(() => {
    try {
      return sessionStorage.getItem('hs-intro-seen') === '1'
    } catch {
      return false
    }
  })
  const [activeSection, setActiveSection] = useState<SectionId>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [activeCertificate, setActiveCertificate] = useState<Certificate | null>(null)
  const [featuredExperienceIndex, setFeaturedExperienceIndex] = useState<number | null>(0)
  const [featuredProjectIndex, setFeaturedProjectIndex] = useState(0)
  const [catNote, setCatNote] = useState(0)
  const [formStatus, setFormStatus] = useState('')

  const featuredProject = projects[featuredProjectIndex]

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

  const resetPointerDepth = (event: PointerEvent<HTMLElement>) => {
    const target = event.currentTarget
    target.style.setProperty('--pointer-x', '50%')
    target.style.setProperty('--pointer-y', '50%')
    target.style.setProperty('--tilt-x', '0deg')
    target.style.setProperty('--tilt-y', '0deg')
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
              <p className="hero-intro">
                I turn busy ideas into useful digital experiences, tidy systems, and occasionally
                very specific cat memes.
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

            <div className="hero-collage" aria-label="Portrait and cat photo collage">
              <span className="collage-note" aria-hidden="true">the human behind the tabs ↴</span>
              <figure className="photo-card portrait-card">
                <img src={portrait} alt="Hannah Sheen" />
                <figcaption>me, probably planning something</figcaption>
              </figure>
              <button
                className="photo-card cat-card cat-card-one"
                type="button"
                onClick={() => setCatNote((note) => (note + 1) % catNotes.length)}
              >
                <img src={catLaptop} alt="A cat reacting dramatically near a laptop" />
                <span>{catNotes[catNote]}</span>
              </button>
              <figure className="photo-card cat-card cat-card-two">
                <img src={catCouch} alt="A cat sitting beside a laptop" />
                <figcaption>my senior code reviewer</figcaption>
              </figure>
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
            <div className="section-kicker" data-reveal>01 / about me</div>
            <div className="about-grid" data-reveal>
              <article className="paper paper-lavender">
                <h2 id="about-title">I like making complicated things feel simple.</h2>
                <p>
                  I am a Cebu-based developer who enjoys building useful systems, learning fast,
                  and helping teams keep technical work human. My sweet spot sits between code,
                  coordination, and thoughtful user experience.
                </p>
                <p className="scribble">The goal: useful, clear, and never boring.</p>
              </article>
              <article className="paper paper-yellow current-note">
                <p className="tape-label">currently doing</p>
                <h3>IT Executive Assistant</h3>
                <p className="company-name">Lifewood Data Technology</p>
                <p>
                  Keeping operations organized, assisting technical priorities, and helping work
                  move from "we should" to "done."
                </p>
              </article>
              <figure className="photo-card sleepy-card">
                <img src={catSleepy} alt="A fluffy cat sleeping on a blanket" />
                <figcaption>after resolving one merge conflict</figcaption>
              </figure>
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
                const panelId = `experience-panel-${index}`

                return (
                  <article
                    className={`experience-folder${isOpen ? ' is-open' : ''}${item.current ? ' is-current' : ''}`}
                    key={`${item.role}-${item.company}`}
                  >
                    <button
                      className="experience-folder-trigger"
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setFeaturedExperienceIndex((current) => (current === index ? null : index))}
                    >
                      <span className="experience-folder-number">{String(index + 1).padStart(2, '0')}</span>
                      <span className="experience-folder-heading">
                        <small>{item.period}</small>
                        <strong>{item.role}</strong>
                        <span>{item.company}</span>
                      </span>
                      <span className="experience-folder-action">{isOpen ? 'close file' : 'open file'}</span>
                      {item.current && <span className="current-stamp">now</span>}
                    </button>

                    <motion.div
                      className="experience-panel-clip"
                      id={panelId}
                      inert={!isOpen}
                      aria-hidden={!isOpen}
                      initial={false}
                      animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="experience-folder-panel">
                        <figure className={item.image ? 'experience-folder-photo' : 'experience-folder-photo is-placeholder'}>
                          {item.image ? (
                            <img src={item.image} alt={item.imageAlt ?? ''} loading="lazy" />
                          ) : (
                            <div className="experience-folder-placeholder">
                              <img src={reduceMotion ? catLaptop : catLaptopSticker} alt={reduceMotion ? 'A cat beside a laptop' : 'Animated cat typing on a laptop'} loading="lazy" />
                              <span>archive photo missing / cat reenactment deployed</span>
                            </div>
                          )}
                          <figcaption>{item.imageCaption ?? 'classified work archive'}</figcaption>
                        </figure>

                        <div className="experience-folder-notes">
                          <p>{item.description}</p>
                          <ul className="experience-tags">
                            {item.tags.map((tag) => <li key={tag}>{tag}</li>)}
                          </ul>
                          {item.article && (
                            <a className="press-pass" href={item.article} target="_blank" rel="noreferrer">
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

            <aside className="meme-break meme-break-laptop" data-reveal aria-label="Cat coding intermission">
              <img src={reduceMotion ? catLaptop : catLaptopSticker} alt={reduceMotion ? 'A cat beside a laptop' : 'Animated cat typing on a laptop'} loading="lazy" />
              <div>
                <p className="section-kicker">intermission / live debugging footage</p>
                <h2>Open tab. Fix bug. Create three new bugs.</h2>
              </div>
            </aside>
          </section>
        )

      case 'projects':
        return (
          <section id="projects" className="projects section-pad" aria-labelledby="projects-title">
            <div className="motion-ticker" aria-hidden="true">
              <div className="motion-ticker-track">
                <span>build it clean</span><span>ship it kindly</span><span>ask the cat reviewer</span>
                <span>build it clean</span><span>ship it kindly</span><span>ask the cat reviewer</span>
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
              data-reveal
              onPointerMove={handlePointerDepth}
              onPointerLeave={resetPointerDepth}
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
                  onClick={() => setActiveProject(featuredProject)}
                  aria-label={`Open notes for ${featuredProject.title}`}
                >
                  <span className="project-number">{featuredProject.number}</span>
                  <span className="project-preview" aria-hidden="true">
                    <AnimatePresence initial={false} mode="wait">
                      <motion.img
                        key={featuredProject.title}
                        src={featuredProject.image}
                        alt=""
                        initial={{ opacity: 0, x: reduceMotion ? 0 : 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: reduceMotion ? 0 : -24 }}
                        transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </AnimatePresence>
                  </span>
                  <span className="project-image-caption">click image to open case notes</span>
                </button>
              </div>

              <article className="project-inspector">
                <motion.div
                  className="project-details"
                  key={featuredProject.title}
                  initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="project-client">{featuredProject.client}</p>
                  <h3>{featuredProject.title}</h3>
                  <p>{featuredProject.description}</p>
                  <ul className="tag-list">
                    {featuredProject.stack.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </motion.div>
                <div className="project-actions">
                  <button className="button button-primary" type="button" onClick={() => setActiveProject(featuredProject)}>
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
                  key={project.title}
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

            <aside className="brainrot-strip" aria-labelledby="brainrot-title" data-reveal>
              <div className="brainrot-heading">
                <div>
                  <p className="section-kicker">live reaction feed</p>
                  <h2 id="brainrot-title">Current brain activity</h2>
                </div>
                <p>Three cats. Zero useful thoughts. Want more? <a className="brainrot-link" href="#playground">Visit the cat lab ↗</a></p>
              </div>
              <div className="brainrot-grid">
                {brainrotCats.map((cat) => (
                  <figure className="brainrot-card" key={cat.title}>
                    <img src={reduceMotion ? catSleepy : cat.image} alt={reduceMotion ? 'A fluffy cat resting on a blanket' : cat.alt} loading="lazy" />
                    <figcaption>
                      <strong>{cat.title}</strong>
                      <span>{cat.note}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </aside>
          </section>
        )

      case 'playground':
        return <MemeArcade reduceMotion={reduceMotion} />

      case 'skills':
        return (
          <section id="skills" className="skills section-pad" aria-labelledby="skills-title">
            <p className="section-kicker" data-reveal>04 / toolkit</p>
            <h2 id="skills-title" data-reveal>Things currently living in my brain</h2>
            <div className="skill-grid">
              {skillGroups.map((group, index) => (
                <article className={`skill-note note-${index + 1}`} key={group.title} data-reveal>
                  <p>{group.title}</p>
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
                <h2 id="certificates-title">My cat-approved learning trail</h2>
              </div>
              <p className="margin-note">A crooked little timeline of things I learned. Click to inspect.</p>
            </div>
            <div className="certificate-trail">
              <div className="certificate-cat-track" aria-hidden="true">
                <img src={reduceMotion ? catLaptop : catTypingMeme} alt="" loading="lazy" />
                <span>me collecting one more certificate instead of closing tabs</span>
              </div>
              <div className="certificate-stage">
                {certificates.map((certificate, index) => (
                  <div className="certificate-plot" data-reveal key={certificate.title}>
                    <span className="certificate-node" aria-hidden="true" />
                    <CertificateCard
                      certificate={certificate}
                      index={index}
                      onOpen={() => setActiveCertificate(certificate)}
                      reduceMotion={reduceMotion}
                    />
                  </div>
                ))}
              </div>
            </div>

            <aside className="meme-break meme-break-reaction" data-reveal aria-label="Cat approval intermission">
              <div>
                <p className="section-kicker">quality assurance / passed</p>
                <h2>The tiny cat has reviewed the pull request.</h2>
              </div>
              <img src={reduceMotion ? catCouch : agingBlueCat} alt={reduceMotion ? 'A cat sitting beside a laptop' : 'Animated blue cat typing at a laptop'} loading="lazy" />
            </aside>
          </section>
        )

      case 'contact':
        return (
          <section id="contact" className="contact section-pad" aria-labelledby="contact-title">
            <div className="contact-intro" data-reveal>
              <p className="section-kicker">06 / say hello</p>
              <h2 id="contact-title">Have a good idea? Send it my way.</h2>
              <p>
                I am open to thoughtful collaborations, tech conversations, and excellent cat
                photos.
              </p>
              <div className="contact-cat-sticker">
                <img src={reduceMotion ? catCouch : judgementalCat} alt={reduceMotion ? 'A cat sitting beside a laptop' : 'Animated orange cat giving a judgmental look'} loading="lazy" />
                <span>Inbox supervisor. Very judgmental.</span>
              </div>
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
              <p>Built by Hannah, supervised by cats.</p>
              <small>
                Animated cats from <a href="https://commons.wikimedia.org/wiki/File:Wikipedia_iOS_Sticker_-_CatLaptop_2.gif" target="_blank" rel="noreferrer">Wikimedia Foundation</a>, <a href="https://tenor.com/view/cat-typing-typing-on-computer-computer-work-laptop-gif-3735158436717612412" target="_blank" rel="noreferrer">Tikvah4u2</a>, <a href="https://giphy.com/gifs/typing-work-stress-corporate-slave-QUGNjCVa2XFVlmZBYR" target="_blank" rel="noreferrer">Nope Cat</a>, <a href="https://tenor.com/view/judgemental-cat-judging-cat-funny-cat-cat-judging-cat-meme-gif-12106025989505123170" target="_blank" rel="noreferrer">m_toro</a>, <a href="https://tenor.com/view/cat-spin-oiia-spinning-cat-oiia-very-fast-spin-oiia-fast-spinning-cat-gif-11002452809956994839" target="_blank" rel="noreferrer">oiiaoiiaSpinningCAT</a>, <a href="https://tenor.com/view/banana-banana-cat-cat-sad-crying-gif-14374695503752541462" target="_blank" rel="noreferrer">wmma</a>, and <a href="https://tenor.com/view/huh-cat-meme-what-ya-doing-huh-cat-in-camera-cat-stare-gif-14539023150639272424" target="_blank" rel="noreferrer">meoshavsmeosha</a> via Tenor and GIPHY. 2026 cat-lab stickers credited on that page.
              </small>
              <a href="#home">Back to top</a>
            </footer>
          </section>
        )

      default:
        return null
    }
  }

  return (
    <div className="site-shell">
      {!introDone && (
        <LoadingScreen onComplete={handleIntroComplete} assets={introAssets} reduceMotion={reduceMotion} />
      )}

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
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={section.id === activeSection ? 'is-active' : ''}
              aria-current={section.id === activeSection ? 'location' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {section.label}
            </a>
          ))}
        </nav>
      </header>

      <main id="portfolio-content" inert={!introDone}>
        {SECTIONS.map(({ id }) => <Fragment key={id}>{renderSection(id)}</Fragment>)}
      </main>

      {activeProject && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setActiveProject(null)}>
          <article className="project-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setActiveProject(null)}>close</button>
            <img src={activeProject.image} alt={`${activeProject.title} preview`} />
            <p className="section-kicker">project {activeProject.number}</p>
            <h2 id="modal-title">{activeProject.title}</h2>
            <p className="company-name">{activeProject.client}</p>
            <p>{activeProject.description}</p>
            <ul className="tag-list">
              {activeProject.stack.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <a className="button button-primary" href={activeProject.link} target="_blank" rel="noreferrer">View on GitHub</a>
          </article>
        </div>
      )}

      {activeCertificate && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setActiveCertificate(null)}>
          <article className="certificate-modal" role="dialog" aria-modal="true" aria-labelledby="certificate-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setActiveCertificate(null)}>close</button>
            <img src={activeCertificate.image} alt={`${activeCertificate.title} certificate`} />
            <p className="section-kicker">verified learning</p>
            <h2 id="certificate-modal-title">{activeCertificate.title}</h2>
            <p className="company-name">{activeCertificate.issuer}</p>
          </article>
        </div>
      )}
    </div>
  )
}

export default App
