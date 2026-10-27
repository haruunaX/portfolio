import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import portrait from './assets/images/for_lanyard.jpg'
import resume from './assets/resume/Hannah-Sheen-Resume.pdf'
import catLaptop from './assets/cats/cat-laptop.jpg'
import catCouch from './assets/cats/cat-couch-laptop.jpg'
import catSleepy from './assets/cats/cat-sleepy.jpg'
import ciudad from './assets/projects/ciudad.png'
import archivist from './assets/projects/tas.jpeg'
import quizOdyssey from './assets/projects/quiz_odessey.png'
import lifewoodWebsite from './assets/projects/lifewood-website.png'
import pfcSystem from './assets/projects/PFCSystem.png'

type Project = {
  number: string
  title: string
  client: string
  description: string
  image: string
  stack: string[]
  link: string
}

const navigation = ['about', 'experience', 'projects', 'skills', 'contact']

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
    role: 'Back End Intern',
    company: 'Camtastic Philippines Corp.',
    description: 'Built backend logic and worked with Pascal and SQL-based systems.',
  },
  {
    period: '2023',
    role: 'IT Intern',
    company: 'Lifewood Data Technology PH',
    description:
      'Explored enterprise workflows, prompt engineering, efficient coding, and modern AI tools.',
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

const catNotes = [
  'Debugging posture: suspiciously hunched.',
  'Current status: one tab away from greatness.',
  'The code works. Nobody touch anything.',
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [catNote, setCatNote] = useState(0)
  const [formStatus, setFormStatus] = useState('')

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveProject(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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
          <div className="hero-copy">
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

          <div className="hero-collage" aria-label="Portrait and cat photo collage">
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
          <div className="section-kicker">01 / about me</div>
          <div className="about-grid">
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
          <div className="section-heading">
            <div>
              <p className="section-kicker">02 / work log</p>
              <h2 id="experience-title">Places I have been useful</h2>
            </div>
            <p className="margin-note">A timeline, but with more personality.</p>
          </div>
          <div className="experience-list">
            {experiences.map((item) => (
              <article className={item.current ? 'experience-item current' : 'experience-item'} key={`${item.role}-${item.company}`}>
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

        <section className="projects section-pad" id="projects" aria-labelledby="projects-title">
          <div className="section-heading">
            <div>
              <p className="section-kicker">03 / selected work</p>
              <h2 id="projects-title">Things I made instead of sleeping</h2>
            </div>
            <p className="margin-note">Click a project for the short version.</p>
          </div>
          <div className="project-grid">
            {projects.map((project) => (
              <button className="project-card" type="button" key={project.title} onClick={() => setActiveProject(project)}>
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
          <p className="section-kicker">04 / toolkit</p>
          <h2 id="skills-title">Things currently living in my brain</h2>
          <div className="skill-grid">
            {skillGroups.map((group, index) => (
              <article className={`skill-note note-${index + 1}`} key={group.title}>
                <p>{group.title}</p>
                <ul>
                  {group.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="contact section-pad" id="contact" aria-labelledby="contact-title">
          <div className="contact-intro">
            <p className="section-kicker">05 / say hello</p>
            <h2 id="contact-title">Have a good idea? Send it my way.</h2>
            <p>
              I am open to thoughtful collaborations, tech conversations, and excellent cat
              photos.
            </p>
            <div className="contact-links">
              <a href="mailto:hannahsheen12@gmail.com">Email</a>
              <a href="https://github.com/haruunaX" target="_blank" rel="noreferrer">GitHub</a>
              <a href="https://www.linkedin.com/in/hannah-sheen-obejero-8a44b63a4" target="_blank" rel="noreferrer">LinkedIn</a>
            </div>
          </div>
          <form className="contact-form" onSubmit={handleSubmit}>
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
    </div>
  )
}

export default App
