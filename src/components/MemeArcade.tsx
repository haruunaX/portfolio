import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import './MemeArcade.css'
import blackCatClapping from '../assets/cats/2026/black-cat-clapping-frame.webp'
import droolingCat from '../assets/cats/2026/drooling-cat.webp'
import droolingCrowd from '../assets/cats/2026/crowd-of-drooling-cats.webp'
import oiiaStill from '../assets/cats/2026/oiia-still.webp'
import bananaStill from '../assets/cats/2026/banana-cry-still.webp'
import oiiaGif from '../assets/cats/oiia-cat.gif'
import bananaGif from '../assets/cats/banana-cry-cat.gif'
import huhGif from '../assets/cats/huh-cat.gif'

type Credit = { label: string; href: string }

type Reaction = {
  id: string
  label: string
  kind: 'candidate' | 'classic'
  badge: string
  /** Static image: always shown in the deck, and on the stage when motion is off. */
  still: string
  /** Animated media: only mounted on the stage while motion is live. */
  moving?: string
  alt: string
  blurb: string
  pops: string[]
  credit: Credit
}

const INSTAGRAM_REEL = 'https://www.instagram.com/reel/DdtWc0qIbdH/'
const INSTAGRAM_EMBED = `${INSTAGRAM_REEL}embed/`

const REACTIONS: Reaction[] = [
  {
    id: 'clap',
    label: 'Black Cat Clapping',
    kind: 'candidate',
    badge: '2026 · interactive sticker',
    still: blackCatClapping,
    alt: 'A black cat with a human-looking grin and hands folded in a clap',
    blurb:
      'An AI-edited black cat with suspiciously human hands, mid-applause. Boop it for a round of clapping.',
    pops: ['clap!', 'clap clap', 'bravo', 'clap clap clap'],
    credit: { label: '@merkurianin on Instagram', href: INSTAGRAM_REEL },
  },
  {
    id: 'drool',
    label: 'Drooling Cat',
    kind: 'candidate',
    badge: '2026 · interactive sticker',
    still: droolingCat,
    alt: 'Two blurry low-resolution cats with wide pupils and blue drool',
    blurb: 'Low-res, wide-eyed, mid-drip. The official face of a brain that has left the chat.',
    pops: ['drip', 'blep', '...', 'brain?'],
    credit: {
      label: 'Know Your Meme entry',
      href: 'https://knowyourmeme.com/memes/drooling-cat-crowd-of-drooling-cats',
    },
  },
  {
    id: 'crowd',
    label: 'Crowd of Drooling Cats',
    kind: 'candidate',
    badge: '2026 · interactive sticker',
    still: droolingCrowd,
    alt: 'Rows of blurry cats staring ahead with blue drool hanging from their mouths',
    blurb:
      'The same expression, multiplied by a hundred. The slow zoom is this page, not the original image.',
    pops: ['we are many', 'drip x100', 'no brain', 'hello'],
    credit: {
      label: 'Know Your Meme entry',
      href: 'https://knowyourmeme.com/memes/drooling-cat-crowd-of-drooling-cats',
    },
  },
  {
    id: 'oiia',
    label: 'OIIA Cat',
    kind: 'classic',
    badge: 'Classic · animated GIF',
    still: oiiaStill,
    moving: oiiaGif,
    alt: 'A cat spinning against a bright green background',
    blurb: 'An older favourite that spins until further notice. Not new in 2026, just evergreen.',
    pops: ['oiia', 'oi oi', 'spin', 'oiia oiia'],
    credit: {
      label: 'oiiaoiiaSpinningCAT on Tenor',
      href: 'https://tenor.com/view/cat-spin-oiia-spinning-cat-oiia-very-fast-spin-oiia-fast-spinning-cat-gif-11002452809956994839',
    },
  },
  {
    id: 'huh',
    label: 'Huh Cat',
    kind: 'classic',
    badge: 'Classic · still GIF',
    still: huhGif,
    alt: 'A wide-eyed cat looking straight into the camera',
    blurb: 'The face you make when the function has fourteen parameters.',
    pops: ['huh?', 'huh??', 'what', 'huh'],
    credit: {
      label: 'meoshavsmeosha on Tenor',
      href: 'https://tenor.com/view/huh-cat-meme-what-ya-doing-huh-cat-in-camera-cat-stare-gif-14539023150639272424',
    },
  },
  {
    id: 'banana',
    label: 'Banana Cry Cat',
    kind: 'classic',
    badge: 'Classic · animated GIF',
    still: bananaStill,
    moving: bananaGif,
    alt: 'A cat in a banana costume crying',
    blurb: 'A banana-suited cat with big feelings. Reliable for any failed deploy.',
    pops: ['sniff', 'waah', 'sad banana', 'peel'],
    credit: {
      label: 'wmma on Tenor',
      href: 'https://tenor.com/view/banana-banana-cat-cat-sad-crying-gif-14374695503752541462',
    },
  },
]

const MAX_TURN = 70
const MAX_LEAN = 30
const KEY_STEP = 14
const POP_LEFTS = [14, 62, 36, 70, 24]
const POP_LIFETIME_MS = 1300
const MAX_POPS = 4

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

type Pop = { id: number; text: string; left: number }

type Props = { reduceMotion: boolean }

export default function MemeArcade({ reduceMotion }: Props) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(true)
  const [tabVisible, setTabVisible] = useState(true)
  const [boops, setBoops] = useState(0)
  const [spins, setSpins] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [pops, setPops] = useState<Pop[]>([])
  const [embedOpen, setEmbedOpen] = useState(false)
  const [status, setStatus] = useState('Pick a cat, then boop it, spin it or drag it.')

  const rootRef = useRef<HTMLElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const spinRef = useRef<HTMLDivElement | null>(null)
  const actorRef = useRef<HTMLDivElement | null>(null)
  const tiltRef = useRef({ turn: 0, lean: 0 })
  const dragRef = useRef<{ id: number; x: number; y: number; turn: number; lean: number } | null>(null)
  const spinAnimRef = useRef<Animation | null>(null)
  const boopAnimRef = useRef<Animation | null>(null)
  const popIdRef = useRef(0)
  const popTimersRef = useRef<number[]>([])

  const reaction = REACTIONS[index]
  const still = reduceMotion || paused
  const live = !still && inView && tabVisible
  const brain = Math.max(0, 100 - boops * 10 - spins * 5)
  const showEmbed = embedOpen && reaction.id === 'clap' && !still

  // Stop ambient work when scrolled off-screen or when the tab is hidden.
  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 },
    )
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onVisibility = () => setTabVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Unmount cleanup: cancel running Web Animations and pending pop timers.
  useEffect(
    () => () => {
      spinAnimRef.current?.cancel()
      boopAnimRef.current?.cancel()
      popTimersRef.current.forEach((timer) => window.clearTimeout(timer))
      popTimersRef.current = []
    },
    [],
  )

  // Entering a still state ends any in-flight scripted animation immediately.
  useEffect(() => {
    if (live) return
    spinAnimRef.current?.cancel()
    boopAnimRef.current?.cancel()
    spinAnimRef.current = null
    boopAnimRef.current = null
  }, [live])

  const applyTilt = useCallback((turn: number, lean: number) => {
    const next = { turn: clamp(turn, -MAX_TURN, MAX_TURN), lean: clamp(lean, -MAX_LEAN, MAX_LEAN) }
    tiltRef.current = next
    const card = cardRef.current
    if (!card) return next
    card.style.setProperty('--turn', `${next.turn}deg`)
    card.style.setProperty('--lean', `${next.lean}deg`)
    return next
  }, [])

  const selectReaction = useCallback((next: number) => {
    const target = (next + REACTIONS.length) % REACTIONS.length
    setIndex(target)
    setFlipped(false)
    setStatus(`${REACTIONS[target].label} is on stage.`)
  }, [])

  const addPop = useCallback(
    (text: string, count: number) => {
      const id = popIdRef.current + 1
      popIdRef.current = id
      const pop: Pop = { id, text, left: POP_LEFTS[count % POP_LEFTS.length] }
      setPops((current) => [...current.slice(-(MAX_POPS - 1)), pop])
      const timer = window.setTimeout(() => {
        setPops((current) => current.filter((item) => item.id !== id))
        popTimersRef.current = popTimersRef.current.filter((item) => item !== timer)
      }, POP_LIFETIME_MS)
      popTimersRef.current.push(timer)
    },
    [],
  )

  const boop = useCallback(() => {
    const count = boops + 1
    setBoops(count)
    addPop(reaction.pops[boops % reaction.pops.length], boops)
    const next = Math.max(0, 100 - count * 10 - spins * 5)
    setStatus(
      next === 0
        ? 'Brain offline. Cats online.'
        : `Boop ${count}. Brain power ${next}%.`,
    )
    const actor = actorRef.current
    if (!live || !actor) return
    boopAnimRef.current?.cancel()
    const animation = actor.animate(
      [
        { transform: 'scale(1, 1) translateY(0)' },
        { transform: 'scale(1.2, 0.78) translateY(6%)', offset: 0.22 },
        { transform: 'scale(0.9, 1.14) translateY(-5%)', offset: 0.5 },
        { transform: 'scale(1.05, 0.96) translateY(0)', offset: 0.75 },
        { transform: 'scale(1, 1) translateY(0)' },
      ],
      { duration: 620, easing: 'ease-out' },
    )
    boopAnimRef.current = animation
    animation.onfinish = () => {
      if (boopAnimRef.current === animation) boopAnimRef.current = null
    }
  }, [addPop, boops, live, reaction.pops, spins])

  const spin = useCallback(() => {
    const count = spins + 1
    setSpins(count)
    const next = Math.max(0, 100 - boops * 10 - count * 5)
    const spinner = spinRef.current
    if (!live || !spinner) {
      // Motion is off: give an instant, deterministic result instead of a spin.
      setFlipped((value) => !value)
      setStatus(`Flipped the sticker (motion is off). Brain power ${next}%.`)
      return
    }
    if (spinAnimRef.current) return
    setStatus(`Spin ${count}. Brain power ${next}%.`)
    const animation = spinner.animate(
      [
        { transform: 'perspective(800px) rotateY(0deg) scale(1)' },
        { transform: 'perspective(800px) rotateY(180deg) scale(1.08)', offset: 0.5 },
        { transform: 'perspective(800px) rotateY(360deg) scale(1)' },
      ],
      { duration: 900, easing: 'cubic-bezier(0.45, 0.05, 0.2, 1)' },
    )
    spinAnimRef.current = animation
    animation.onfinish = () => {
      if (spinAnimRef.current === animation) spinAnimRef.current = null
    }
  }, [boops, live, spins])

  const reset = useCallback(() => {
    spinAnimRef.current?.cancel()
    boopAnimRef.current?.cancel()
    spinAnimRef.current = null
    boopAnimRef.current = null
    applyTilt(0, 0)
    setBoops(0)
    setSpins(0)
    setFlipped(false)
    setPops([])
    setStatus('Stage reset. Brain power 100%.')
  }, [applyTilt])

  const turnBy = useCallback(
    (delta: number) => {
      const next = applyTilt(tiltRef.current.turn + delta, tiltRef.current.lean)
      setStatus(`Turned to ${Math.round(next.turn)} degrees.`)
    },
    [applyTilt],
  )

  const leanBy = useCallback(
    (delta: number) => {
      const next = applyTilt(tiltRef.current.turn, tiltRef.current.lean + delta)
      setStatus(`Leaned to ${Math.round(next.lean)} degrees.`)
    },
    [applyTilt],
  )

  const togglePause = () => {
    const next = !paused
    setPaused(next)
    if (next) setEmbedOpen(false)
    setStatus(next ? 'Motion paused. Showing still images.' : 'Motion resumed.')
  }

  const onStagePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      turn: tiltRef.current.turn,
      lean: tiltRef.current.lean,
    }
    setDragging(true)
  }

  const onStagePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return
    event.stopPropagation()
    applyTilt(
      drag.turn + (event.clientX - drag.x) * 0.45,
      drag.lean - (event.clientY - drag.y) * 0.3,
    )
  }

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.id !== event.pointerId) return
    dragRef.current = null
    setDragging(false)
  }

  const onStageKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    switch (event.key) {
      case 'ArrowLeft':
        turnBy(-KEY_STEP)
        break
      case 'ArrowRight':
        turnBy(KEY_STEP)
        break
      case 'ArrowUp':
        leanBy(KEY_STEP / 2)
        break
      case 'ArrowDown':
        leanBy(-KEY_STEP / 2)
        break
      case 'Enter':
      case ' ':
        boop()
        break
      case 's':
      case 'S':
        spin()
        break
      case 'r':
      case 'R':
        reset()
        break
      default:
        return
    }
    event.preventDefault()
    event.stopPropagation()
  }

  const onCardMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!live || event.pointerType === 'touch') return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    event.currentTarget.style.setProperty('--card-ry', `${x * 22}deg`)
    event.currentTarget.style.setProperty('--card-rx', `${-y * 22}deg`)
  }

  const onCardLeave = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.setProperty('--card-ry', '0deg')
    event.currentTarget.style.setProperty('--card-rx', '0deg')
  }

  const stageSrc = live && reaction.moving ? reaction.moving : reaction.still
  const rootClass = ['cat-lab', live ? 'is-live' : 'is-still', dragging ? 'is-dragging' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <section ref={rootRef} className={rootClass} aria-labelledby="playground-title">
      <div className="cat-lab__ticker" aria-hidden="true">
        <div className="cat-lab__ticker-track">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i}>Brain offline · Cats online ·</span>
          ))}
        </div>
      </div>

      <span className="cat-lab__orb cat-lab__orb--one" aria-hidden="true" />
      <span className="cat-lab__orb cat-lab__orb--two" aria-hidden="true" />

      <header className="cat-lab__head">
        <p className="cat-lab__kicker">Cat lab</p>
        <h2 id="playground-title">Brain offline. Cats online.</h2>
        <p className="cat-lab__lead">
          A tiny toy box of reaction cats. Pick one, boop it, spin it, drag it around. The brain meter only goes one way.
        </p>
      </header>

      <div className="cat-lab__layout">
        <div className="cat-lab__stage-col">
          <div className="cat-lab__scene">
            <div
              ref={cardRef}
              className="cat-lab__card"
              role="group"
              tabIndex={0}
              aria-label={`Cat stage showing ${reaction.label}. Drag sideways or use arrow keys to turn it. Enter boops, S spins, R resets.`}
              aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Enter Space S R"
              onPointerDown={onStagePointerDown}
              onPointerMove={onStagePointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onLostPointerCapture={endDrag}
              onKeyDown={onStageKeyDown}
              data-reaction={reaction.id}
            >
              <div key={reaction.id} className="cat-lab__swap">
                <div className="cat-lab__idle">
                  <div ref={spinRef} className="cat-lab__spin">
                    <div ref={actorRef} className="cat-lab__actor">
                      <div className="cat-lab__crop">
                        <div className="cat-lab__flip" data-flipped={flipped}>
                          <img
                            className="cat-lab__img"
                            src={stageSrc}
                            alt={reaction.alt}
                            draggable={false}
                            decoding="async"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <span className={`cat-lab__chip cat-lab__chip--${reaction.kind}`}>{reaction.badge}</span>

              <div className="cat-lab__pops" aria-hidden="true">
                {pops.map((pop) => (
                  <span key={pop.id} className="cat-lab__pop" style={{ left: `${pop.left}%` }}>
                    {pop.text}
                  </span>
                ))}
              </div>
            </div>
            <span className="cat-lab__floor" aria-hidden="true" />
          </div>

          <div className="cat-lab__caption">
            <h3>{reaction.label}</h3>
            <p>{reaction.blurb}</p>
            <p className="cat-lab__credit">
              {reaction.kind === 'candidate' ? 'Source: ' : 'Classic, via '}
              <a href={reaction.credit.href} target="_blank" rel="noreferrer">
                {reaction.credit.label}
              </a>
              {reaction.kind === 'candidate' && ' · shown as an interactive sticker, not the original video'}
            </p>
            {reaction.id === 'clap' && (
              <div className="cat-lab__embed-box">
                {showEmbed ? (
                  <>
                    <iframe
                      className="cat-lab__embed"
                      src={INSTAGRAM_EMBED}
                      title="Black Cat Clapping, original reel by @merkurianin on Instagram"
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
                    />
                    <button type="button" className="cat-lab__btn cat-lab__btn--small" onClick={() => setEmbedOpen(false)}>
                      Close Instagram embed
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="cat-lab__btn cat-lab__btn--small"
                      disabled={still}
                      onClick={() => setEmbedOpen(true)}
                    >
                      Load original reel
                    </button>
                    <span className="cat-lab__embed-note">
                      {still
                        ? 'Motion is off, so the Instagram embed stays closed. '
                        : 'Loads instagram.com content only after you press this; nothing plays until you press play. '}
                      <a href={INSTAGRAM_REEL} target="_blank" rel="noreferrer">
                        Open on Instagram
                      </a>
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="cat-lab__control-col">
          <div className="cat-lab__panel">
            <div className="cat-lab__meter-row">
              <span id="cat-lab-brain-label" className="cat-lab__meter-label">
                Brain power
              </span>
              <div
                className="cat-lab__meter"
                role="meter"
                aria-labelledby="cat-lab-brain-label"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={brain}
                aria-valuetext={`${brain} percent`}
              >
                <span style={{ width: `${brain}%` } as CSSProperties} />
              </div>
              <span className="cat-lab__meter-value">{brain}%</span>
            </div>

            <div className="cat-lab__buttons" role="group" aria-label="Cat controls">
              <button type="button" className="cat-lab__btn" onClick={() => selectReaction(index - 1)}>
                <span aria-hidden="true">◀</span> Prev cat
              </button>
              <button type="button" className="cat-lab__btn" onClick={() => selectReaction(index + 1)}>
                Next cat <span aria-hidden="true">▶</span>
              </button>
              <button type="button" className="cat-lab__btn cat-lab__btn--primary" onClick={boop}>
                Boop
              </button>
              <button type="button" className="cat-lab__btn cat-lab__btn--primary" onClick={spin}>
                Spin
              </button>
              <button type="button" className="cat-lab__btn" onClick={() => turnBy(-KEY_STEP)}>
                <span aria-hidden="true">↶</span> Turn left
              </button>
              <button type="button" className="cat-lab__btn" onClick={() => turnBy(KEY_STEP)}>
                Turn right <span aria-hidden="true">↷</span>
              </button>
              <button type="button" className="cat-lab__btn" onClick={reset}>
                Reset
              </button>
              <button
                type="button"
                className="cat-lab__btn"
                aria-pressed={still}
                disabled={reduceMotion}
                onClick={togglePause}
              >
                {reduceMotion ? 'Motion off (system)' : paused ? 'Resume motion' : 'Pause motion'}
              </button>
            </div>

            <p className="cat-lab__counts">
              Boops <strong>{boops}</strong> · Spins <strong>{spins}</strong>
            </p>
            <p className="cat-lab__status" role="status" aria-live="polite">
              {status}
            </p>
          </div>

          <ul className="cat-lab__deck" aria-label="Reaction deck">
            {REACTIONS.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`cat-lab__tile cat-lab__tile--${item.kind}`}
                  style={{ '--float-delay': `${i * -0.7}s` } as CSSProperties}
                  aria-pressed={i === index}
                  onClick={() => selectReaction(i)}
                  onPointerMove={onCardMove}
                  onPointerLeave={onCardLeave}
                  onBlur={(event) => {
                    event.currentTarget.style.setProperty('--card-ry', '0deg')
                    event.currentTarget.style.setProperty('--card-rx', '0deg')
                  }}
                >
                  <span className="cat-lab__tile-inner">
                    <img src={item.still} alt="" loading="lazy" decoding="async" draggable={false} />
                    <span className="cat-lab__tile-name">{item.label}</span>
                    <span className="cat-lab__tile-tag">{item.kind === 'candidate' ? '2026' : 'Classic'}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="cat-lab__credits" aria-label="Meme credits and provenance">
        <h3>Credits and provenance</h3>
        <div className="cat-lab__credit-grid">
          <div>
            <h4>2026 candidates</h4>
            <ul>
              <li>
                <strong>Black Cat Clapping</strong>: AI-edited video by Aleksandr Kim (
                <a href={INSTAGRAM_REEL} target="_blank" rel="noreferrer">
                  @merkurianin
                </a>
                ), Instagram, 25 Sep 2026. The cat above is a cropped still frame taken from the{' '}
                <a
                  href="https://trending.knowyourmeme.com/editorials/guides/what-is-the-black-cat-clapping-meme-the-origin-of-the-viral-ai-cat-memes-explained"
                  target="_blank"
                  rel="noreferrer"
                >
                  Know Your Meme guide
                </a>
                , animated only by this page.
              </li>
              <li>
                <strong>Drooling Cat / Crowd of Drooling Cats</strong>: 2026 reaction images, original author unknown. Resized
                from the{' '}
                <a href="https://knowyourmeme.com/memes/drooling-cat-crowd-of-drooling-cats" target="_blank" rel="noreferrer">
                  Know Your Meme entry
                </a>
                .
              </li>
              <li>
                <strong>Corn Dog Cat</strong>: older (2022) meme with a mid-2026 resurgence, so not counted as new. Not shown
                here because its photo is attributed to a stock photographer; see the{' '}
                <a
                  href="https://trending.knowyourmeme.com/editorials/guides/what-is-corn-dog-cat-the-absurd-cat-corndog-meme-character-explained"
                  target="_blank"
                  rel="noreferrer"
                >
                  Know Your Meme guide
                </a>
                .
              </li>
            </ul>
          </div>
          <div>
            <h4>Classics</h4>
            <ul>
              <li>
                OIIA Cat: <a href={REACTIONS[3].credit.href} target="_blank" rel="noreferrer">oiiaoiiaSpinningCAT</a>
              </li>
              <li>
                Huh Cat: <a href={REACTIONS[4].credit.href} target="_blank" rel="noreferrer">meoshavsmeosha</a>
              </li>
              <li>
                Banana Cry Cat: <a href={REACTIONS[5].credit.href} target="_blank" rel="noreferrer">wmma</a>
              </li>
            </ul>
            <p className="cat-lab__rights">
              No reuse licence was verified for any of these. They are small, credited fan-style stickers on a personal
              portfolio, not owned or royalty-free. Rights holders can ask for removal.
            </p>
          </div>
        </div>
      </footer>
    </section>
  )
}
