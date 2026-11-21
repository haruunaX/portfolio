import { useEffect, type CSSProperties, type MouseEvent } from 'react'
import { motion } from 'motion/react'
import { experiences } from '../data/portfolio'
import type { Experience } from '../data/portfolio'
import { FADE, MORPH } from '../lib/motion'
import { useReducedMotion } from '../lib/useReducedMotion'
import ScrollStack, { ScrollStackItem } from './reactbits/ScrollStack'
import './ExperienceSection.css'

type ExperienceSectionProps = {
  openId: string | null
  onOpen: (experience: Experience) => void
}

const TONES = ['pink', 'sky', 'lime', 'paper'] as const

/** Roles that are not the current one carry a short type tag derived from the role name. */
function tagFor(experience: Experience) {
  const { role, tags } = experience
  if (/intern/i.test(role)) return 'Internship'
  if (/instructor/i.test(role)) return 'Instructor'
  if (/lead/i.test(role)) return 'Lead'
  if (/officer/i.test(role)) return 'Officer'
  return tags[0]
}

/** Matches --r-lg. Motion needs a number to correct radius distortion during the morph. */
const SURFACE_RADIUS = 26

export default function ExperienceSection({ openId, onOpen }: ExperienceSectionProps) {
  const reduceMotion = useReducedMotion()

  /* The card that opened stays flat (no stack scale or dim) until the sheet is gone. */
  useEffect(() => {
    document
      .querySelectorAll<HTMLElement>('.experience [data-flat]')
      .forEach((card) => {
        if (card.dataset.flat !== openId) delete card.dataset.flat
      })
  }, [openId])

  const open = (experience: Experience, event: MouseEvent<HTMLButtonElement>) => {
    // Safari and Firefox on macOS do not focus buttons on click; the sheet returns focus to this.
    event.currentTarget.focus({ preventScroll: true })
    /* Flatten the stack scale, filter and dim (CSS keyed on data-flat) so the morph starts from the resting box. */
    const card = event.currentTarget.closest<HTMLElement>('.scroll-stack-card')
    if (card) card.dataset.flat = experience.id
    onOpen(experience)
  }

  return (
    <section
      id="experience"
      className={`section surface-cream experience${reduceMotion ? ' experience--still' : ''}`}
      aria-labelledby="experience-title"
    >
      <div className="wrap">
        <motion.div
          className="experience__head"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={FADE}
        >
          <div>
            <span className="kicker" style={{ '--kicker-bg': 'var(--sky)' } as CSSProperties}>
              03 · Work log
            </span>
            <h2 id="experience-title" className="section-title">
              Places I have been <em>useful</em>
            </h2>
          </div>
          <span className="experience__count" aria-hidden="true">
            {String(experiences.length).padStart(2, '0')}
          </span>
        </motion.div>

        <ScrollStack
          useWindowScroll
          smoothScroll={false}
          snap={false}
          stackPosition="12%"
          itemStackDistance={26}
          itemDistance={150}
          itemScale={reduceMotion ? 0 : 0.045}
          baseScale={0.8}
          dimAmount={reduceMotion ? 0 : 0.14}
          holdDistance={120}
        >
          {experiences.map((experience, index) => {
            const tone = TONES[index % TONES.length]
            const isOpen = openId === experience.id
            const company = experience.company.replace(' - ', ', ')
            const period = experience.period.replace(' - Present', ' \u00b7 Present').replace(' - ', ' to ')
            return (
              <ScrollStackItem
                key={experience.id}
                itemClassName={`experience__card experience__card--${tone}`}
              >
                <motion.div
                  className="experience__surface"
                  layoutId={`experience-card-${experience.id}`}
                  layoutDependency={isOpen ? 'exp-open' : 'exp-closed'}
                  transition={MORPH}
                  style={{ borderRadius: SURFACE_RADIUS }}
                />
                <div className="experience__spark-clip" aria-hidden="true">
                  <span className="experience__spark" />
                </div>
                <div className="experience__body">
                  <span className="experience__index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="experience__text">
                    <p className="experience__when">{period}</p>
                    <h3 className="experience__role">{experience.role}</h3>
                    <p className="experience__company">{company}</p>
                    <p className="experience__say">{experience.description}</p>
                  </div>
                  <div className="experience__aside">
                    <div className="experience__marks">
                      {!experience.current && <span className="chip experience__tag">{tagFor(experience)}</span>}
                      {experience.current && <span className="chip chip-lime experience__now">Now</span>}
                    </div>
                    <button
                      type="button"
                      className="btn btn-paper experience__open"
                      aria-haspopup="dialog"
                      aria-label={`Open file: ${experience.role}, ${company}`}
                      onClick={(event) => open(experience, event)}
                    >
                      Open file <span aria-hidden="true">{'\u2197'}</span>
                    </button>
                  </div>
                </div>
              </ScrollStackItem>
            )
          })}
        </ScrollStack>
      </div>
    </section>
  )
}
