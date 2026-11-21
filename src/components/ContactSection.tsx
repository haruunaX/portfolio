import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { contact } from '../data/contact'
import { riseIn } from '../lib/motion'
import { showToast } from '../lib/toast'
import { useReducedMotion } from '../lib/useReducedMotion'
import Buddy from './Buddy'
import ClickSpark, { type ClickSparkHandle } from './reactbits/ClickSpark'
import Magnet from './reactbits/Magnet'
import './ContactSection.css'

const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'
/** lime, pink, sky, cream */
const SPARK_COLORS = ['#C6F432', '#FF4FA0', '#36C5F0', '#FFF6EC']
/** How long Buddy cheers after a message goes out. */
const CHEER_MS = 3000

function subscribeFinePointer(onChange: () => void) {
  const query = window.matchMedia(FINE_POINTER_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

const getFinePointer = () => window.matchMedia(FINE_POINTER_QUERY).matches
const getFinePointerServer = () => false

function ArrowIcon() {
  return (
    <svg className="contact__arrow" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M4 12 12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ContactSection() {
  const reduceMotion = useReducedMotion()
  const finePointer = useSyncExternalStore(subscribeFinePointer, getFinePointer, getFinePointerServer)
  const magnetOff = reduceMotion || !finePointer

  const [status, setStatus] = useState('')
  // Counts successful sends while Buddy cheers; 0 means waving. A new send restarts the timer.
  const [cheers, setCheers] = useState(0)
  const [sending, setSending] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)
  const sparkRef = useRef<ClickSparkHandle>(null)

  // Buddy cheers for a few seconds after each successful send, then goes back to waving.
  useEffect(() => {
    if (!cheers) return
    const timer = window.setTimeout(() => setCheers(0), CHEER_MS)
    return () => window.clearTimeout(timer)
  }, [cheers])

  const celebrate = () => {
    if (reduceMotion) return
    const section = sectionRef.current
    const button = submitRef.current
    if (!section || !button) return
    const area = section.getBoundingClientRect()
    const target = button.getBoundingClientRect()
    sparkRef.current?.spark(target.left - area.left + target.width / 2, target.top - area.top + target.height / 2)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSending(true)
    setStatus('Sending...')
    const form = event.currentTarget
    const data = new FormData(form)
    const name = String(data.get('name') ?? '').trim()
    // /api/contact requires a subject; it also carries the sender's name into the inbox.
    const payload = {
      name,
      email: String(data.get('email') ?? '').trim(),
      subject: `Portfolio message from ${name || 'a visitor'}`,
      message: String(data.get('message') ?? '').trim(),
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Unable to send')
      form.reset()
      setStatus('Message sent. Thank you!')
      setCheers((count) => count + 1)
      celebrate()
    } catch {
      setStatus(`Email me directly at ${contact.email}`)
    } finally {
      setSending(false)
    }
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contact.email)
      showToast('Email copied')
    } catch {
      showToast(`Copy failed. Email ${contact.email}`)
    }
  }

  return (
    <section id="contact" ref={sectionRef} className="section surface-ink contact" aria-labelledby="contact-title">
      <div className="wrap contact__grid">
        <motion.div
          className="contact__intro"
          variants={riseIn(reduceMotion)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <p className="kicker">05 · Say hello</p>
          <h2 id="contact-title" className="section-title">
            Have a good idea? Send it <em>my way.</em>
          </h2>
          <p className="section-lede">I am open to thoughtful collaborations and tech conversations.</p>

          <div className="contact__links">
            <Magnet disabled={magnetOff} padding={90} magnetStrength={3} wrapperClassName="contact__magnet">
              <a className="btn btn-lime" href={`mailto:${contact.email}`}>
                Email
                <ArrowIcon />
              </a>
            </Magnet>
            <Magnet disabled={magnetOff} padding={90} magnetStrength={3} wrapperClassName="contact__magnet">
              <a className="btn btn-paper" href={contact.github} target="_blank" rel="noopener noreferrer">
                GitHub
                <ArrowIcon />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Magnet>
            <Magnet disabled={magnetOff} padding={90} magnetStrength={3} wrapperClassName="contact__magnet">
              <a className="btn btn-paper" href={contact.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn
                <ArrowIcon />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Magnet>
          </div>

          <div className="contact__copy">
            <button type="button" className="btn btn-paper" onClick={copyEmail}>
              Copy email
            </button>
            <span className="contact__address">{contact.email}</span>
          </div>
        </motion.div>

        <motion.form
          className="contact__form"
          onSubmit={handleSubmit}
          variants={riseIn(reduceMotion)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="contact__head">
            <p className="contact__hello hand">Drop me a note, Buddy will carry it over.</p>
            <div className="contact__buddy">
              <Buddy pose={cheers ? 'cheer' : 'wave'} size={104} />
            </div>
          </div>
          <div className="contact__field">
            <label htmlFor="contact-name">Name</label>
            <input id="contact-name" name="name" type="text" autoComplete="name" required />
          </div>
          <div className="contact__field">
            <label htmlFor="contact-email">Email</label>
            <input id="contact-email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="contact__field">
            <label htmlFor="contact-message">Message</label>
            <textarea id="contact-message" name="message" rows={5} required />
          </div>
          <div className="contact__actions">
            <button ref={submitRef} type="submit" className="btn btn-lime" disabled={sending}>
              Send message
            </button>
            <p className="contact__status" aria-live="polite">
              {status}
            </p>
          </div>
        </motion.form>
      </div>

      <footer className="wrap contact__foot">
        <p>Built by Hannah.</p>
        <a className="contact__top" href="#home">
          Back to top
        </a>
      </footer>

      <ClickSpark
        ref={sparkRef}
        className="contact__sparks"
        sparkColor={SPARK_COLORS}
        sparkCount={16}
        sparkRadius={72}
        sparkSize={16}
        sparkWidth={3}
        duration={900}
        gravity={0.35}
        randomness={0.5}
      />
    </section>
  )
}
