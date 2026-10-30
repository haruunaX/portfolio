import { useEffect, useState } from 'react'
import type { FormEvent, PointerEvent } from 'react'
import portrait from './assets/images/for_lanyard.jpg'
import resume from './assets/resume/Hannah-Sheen-Resume.pdf'
import catLaptop from './assets/cats/cat-laptop.jpg'
import catCouch from './assets/cats/cat-couch-laptop.jpg'
import catSleepy from './assets/cats/cat-sleepy.jpg'
import catLaptopSticker from './assets/cats/cat-laptop-sticker.gif'
import catSocks from './assets/cats/cat-socks.gif'
import walkingCat from './assets/cats/walking-cat.gif'
import animatedKitty from './assets/cats/animated-kitty.gif'
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

const navigation = ['about', 'experience', 'projects', 'skills', 'certificates', 'contact']

const experiences = [
  {
    period: 'Present',
    role: 'IT Executive Assistant',
    company: 'Lifewood Data Technology',
    description:
      'Supporting day-to-day IT operations while keeping people, priorities, and technical work organized and moving forward.',
    current: true,
  },
  {
    period: '2025',
    role: 'Logistics Officer',
    company: 'Google Developer Groups on Campus - CTUMC',
    description:
      'Coordinated equipment, venue preparation, and event logistics for developer bootcamps and student tech workshops.',
  },
  {
    period: '2024',
    role: 'Project Management Lead',
    company: 'Cebu Technological University',
    description:
      'Led the development of BARIOS, an administrative platform designed to reduce manual barangay workflows.',
  },
  {
    period: '2024',
    role: 'Technical Instructor',
    company: 'Brgy. San Roque',
    description:
      'Delivered hands-on digital literacy and system training with the CTU Main CCICT extension team.',
  },
  {
    period: '2023',
    role: 'Back End Developer Intern',
    company: 'Camtastic Philippines Corp.',
    description: 'Worked on backend logic using Pascal and SQL-based systems.',
  },
  {
    period: '2023',
    role: 'Full Stack Developer Intern',
    company: 'Lifewood Data Technology PH',
    description:
      'Worked across enterprise workflows, prompt engineering, efficient coding, and modern AI-assisted tools.',
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

function CertificateCard({
  certificate,
  index,
  onOpen,
}: {
  certificate: Certificate
  index: number
  onOpen: () => void
}) {
  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
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
        <img src={certificate.image} alt={`${certificate.title} certificate`} />
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [activeCertificate, setActiveCertificate] = useState<Certificate | null>(null)
  const [catNote, setCatNote] = useState(0)
  const [formStatus, setFormStatus] = useState('')

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveProject(null)
        setActiveCertificate(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const revealItems = document.querySelectorAll<HTMLElement>('[data-reveal]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    revealItems.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let frame = 0

    const updateScrollEffects = () => {
      const scrollRange = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollRange > 0 ? window.scrollY / scrollRange : 0
      document.documentElement.style.setProperty('--scroll-progress', progress.toString())
      document.documentElement.style.setProperty('--parallax-offset', `${window.scrollY * -0.014}px`)
      frame = 0
    }

    const handleScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateScrollEffects)
    }

    updateScrollEffects()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

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

  return (
    <div className="site-shell">
      <div className="scroll-progress" aria-hidden="true"><span /></div>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Hannah Sheen home">
          HS<span>.</span>
        </a>
        <button
          className="menu-button"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? 'close' : 'menu'}
        </button>
        <nav className={menuOpen ? 'site-nav is-open' : 'site-nav'} aria-label="Main navigation">
          {navigation.map((item) => (
            <a key={item} href={`#${item}`} onClick={() => setMenuOpen(false)}>
              {item}
            </a>
          ))}
        </nav>
      </header>

      <main id="top">
        <section className="hero section-pad" aria-labelledby="hero-title">
          <div className="hero-copy" data-reveal>
            <p className="eyebrow">Developer. Organizer. Professional tab hoarder.</p>
            <h1 id="hero-title">
              Hannah
              <span>Sheen</span>
            </h1>
            <p className="hero-role">IT Executive Assistant + full-stack developer</p>
            <p className="hero-intro">
              I turn busy ideas into useful digital experiences, tidy systems, and occasionally
              very specific cat memes.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#projects">
                See my work
              </a>
              <a className="button button-secondary" href={resume} target="_blank" rel="noreferrer">
                Open resume
              </a>
            </div>
          </div>

          <div className="hero-collage" aria-label="Portrait and cat photo collage" data-reveal>
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
        </section>

        <section className="about section-pad" id="about" aria-labelledby="about-title">
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
                move from “we should” to “done.”
              </p>
            </article>
            <figure className="photo-card sleepy-card">
              <img src={catSleepy} alt="A fluffy cat sleeping on a blanket" />
              <figcaption>after resolving one merge conflict</figcaption>
            </figure>
          </div>
        </section>

        <section className="experience section-pad" id="experience" aria-labelledby="experience-title">
          <div className="section-heading" data-reveal>
            <div>
              <p className="section-kicker">02 / work log</p>
              <h2 id="experience-title">Places I have been useful</h2>
            </div>
            <p className="margin-note">A timeline, but with more personality.</p>
          </div>
          <div className="experience-list">
            {experiences.map((item) => (
              <article className={item.current ? 'experience-item current' : 'experience-item'} key={`${item.role}-${item.company}`} data-reveal>
                <p className="experience-period">{item.period}</p>
                <div>
                  <h3>{item.role}</h3>
                  <p className="company-name">{item.company}</p>
                </div>
                <p>{item.description}</p>
                {item.current && <span className="current-stamp">now</span>}
              </article>
            ))}
          </div>
        </section>

        <aside className="meme-break meme-break-laptop" data-reveal aria-label="Cat coding intermission">
          <img src={catLaptopSticker} alt="Animated cat typing on a laptop" />
          <div>
            <p className="section-kicker">intermission / live debugging footage</p>
            <h2>Open tab. Fix bug. Create three new bugs.</h2>
          </div>
        </aside>

        <div className="motion-ticker" aria-hidden="true">
          <div className="motion-ticker-track">
            <span>build it clean</span><span>ship it kindly</span><span>ask the cat reviewer</span>
            <span>build it clean</span><span>ship it kindly</span><span>ask the cat reviewer</span>
          </div>
        </div>

        <section className="projects section-pad" id="projects" aria-labelledby="projects-title">
          <div className="section-heading" data-reveal>
            <div>
              <p className="section-kicker">03 / selected work</p>
              <h2 id="projects-title">Things I made instead of sleeping</h2>
            </div>
            <p className="margin-note">Click a project for the short version.</p>
          </div>
          <div className="project-grid">
            {projects.map((project) => (
              <button className="project-card" type="button" key={project.title} onClick={() => setActiveProject(project)} data-reveal>
                <span className="project-number">{project.number}</span>
                <img src={project.image} alt="" />
                <div className="project-copy">
                  <p>{project.client}</p>
                  <h3>{project.title}</h3>
                  <span>View notes</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="skills section-pad" id="skills" aria-labelledby="skills-title">
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

        <section className="certificates section-pad" id="certificates" aria-labelledby="certificates-title">
          <div className="section-heading" data-reveal>
            <div>
              <p className="section-kicker">05 / proof I did the homework</p>
              <h2 id="certificates-title">My cat-approved learning trail</h2>
            </div>
            <p className="margin-note">A crooked little timeline of things I learned. Click to inspect.</p>
          </div>
          <div className="certificate-trail">
            <div className="certificate-cat-track" aria-hidden="true">
              <img src={walkingCat} alt="" />
              <span>achievement patrol in progress</span>
            </div>
            <div className="certificate-stage">
              {certificates.map((certificate, index) => (
                <div className="certificate-plot" data-reveal key={certificate.title}>
                  <span className="certificate-node" aria-hidden="true" />
                  <CertificateCard
                    certificate={certificate}
                    index={index}
                    onOpen={() => setActiveCertificate(certificate)}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="meme-break meme-break-socks" data-reveal aria-label="Cat approval intermission">
          <div>
            <p className="section-kicker">quality assurance / passed</p>
            <h2>The tiny cat has reviewed the pull request.</h2>
          </div>
          <img src={catSocks} alt="Animated black and white cat" />
        </aside>

        <section className="contact section-pad" id="contact" aria-labelledby="contact-title">
          <div className="contact-intro" data-reveal>
            <p className="section-kicker">06 / say hello</p>
            <h2 id="contact-title">Have a good idea? Send it my way.</h2>
            <p>
              I am open to thoughtful collaborations, tech conversations, and excellent cat
              photos.
            </p>
            <div className="contact-cat-sticker">
              <img src={animatedKitty} alt="Animated black and white cat looking at the camera" />
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
        </section>
      </main>

      <footer>
        <p>Built by Hannah, supervised by cats.</p>
        <small>
          Animated cats from <a href="https://commons.wikimedia.org/wiki/File:Wikipedia_iOS_Sticker_-_CatLaptop_2.gif" target="_blank" rel="noreferrer">Wikimedia Foundation</a>, <a href="https://commons.wikimedia.org/wiki/File:Funsocks.gif" target="_blank" rel="noreferrer">the White House archive</a>, <a href="https://commons.wikimedia.org/wiki/File:Walking_cat.gif" target="_blank" rel="noreferrer">Sheilagraber</a>, and <a href="https://commons.wikimedia.org/wiki/File:Animatedkitty.gif" target="_blank" rel="noreferrer">Miranda</a>. The last two are <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a> and used unmodified.
        </small>
        <a href="#top">Back to top</a>
      </footer>

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
