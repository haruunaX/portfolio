import { useState } from 'react'
import { motion } from 'motion/react'
import type { Experience } from '../data/portfolio'
import { experiencePhotos } from '../data/experiencePhotos'
import { MORPH } from '../lib/motion'
import './ExperienceMedia.css'

/** Matches --r-md and --r-sm. Motion needs numbers to correct radius distortion. */
const COVER_RADIUS = 18
const THUMB_RADIUS = 12

const SKIPPED_WORDS: Record<string, true> = {
  a: true,
  an: true,
  and: true,
  at: true,
  de: true,
  for: true,
  in: true,
  of: true,
  on: true,
  the: true,
}

/** Two initials from the first significant words, e.g. "Camtastic Philippines Corp." -> "CP". */
function monogramFor(company: string): string {
  const words = (company.match(/[\p{L}\p{N}]+/gu) ?? []).filter(
    (word) => !SKIPPED_WORDS[word.toLowerCase()],
  )
  if (words.length === 0) return 'HS'
  const letters =
    words.length === 1 ? words[0].slice(0, 2) : words[0].charAt(0) + words[1].charAt(0)
  return letters.toUpperCase()
}

export default function ExperienceMedia({ experience }: { experience: Experience }) {
  const { id, role, company, image, imageAlt, imageCaption } = experience
  const photos = [...(image ? [image] : []), ...(experiencePhotos[id] ?? [])]
  const total = photos.length
  const [selectedRaw, setSelected] = useState(0)
  const selected = selectedRaw < total ? selectedRaw : 0

  if (total === 0) {
    return (
      <div className="experience-media">
        <div className="experience-media__monogram">
          <span className="experience-media__initials" aria-hidden="true">
            {monogramFor(company)}
          </span>
          <span className="experience-media__company">{company}</span>
          <svg
            className="experience-media__sticker"
            viewBox="0 0 24 24"
            width="44"
            height="44"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M12 2.2l2.9 6.5 7.1.7-5.3 4.7 1.6 7-6.3-3.7-6.3 3.7 1.6-7L2 9.4l7.1-.7z"
              fill="var(--lime)"
              stroke="var(--ink)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {import.meta.env.DEV && (
          <p className="experience-media__hint">
            Add photos: drop files into <code>src/assets/experience/{id}/</code>
          </p>
        )}
      </div>
    )
  }

  const altFor = (index: number) => {
    if (image && index === 0) return imageAlt ?? `Photo from ${role} at ${company}`
    const base = `Photo from ${role} at ${company}`
    return total > 1 ? `${base} (${index + 1} of ${total})` : base
  }

  const showCaption = Boolean(imageCaption) && Boolean(image) && selected === 0

  return (
    <div className="experience-media">
      <figure className="experience-media__figure">
        <motion.div
          key={selected}
          className="experience-media__frame experience-media__frame--cover"
          layoutId={`experience-photo-${id}-${selected}`}
          layoutDependency={selected}
          transition={MORPH}
          style={{ borderRadius: COVER_RADIUS }}
        >
          <img
            className="experience-media__image"
            src={photos[selected]}
            alt={altFor(selected)}
            loading="lazy"
            decoding="async"
          />
        </motion.div>
        {showCaption && (
          <figcaption className="experience-media__caption">{imageCaption}</figcaption>
        )}
      </figure>

      {total > 1 && (
        <ul className="experience-media__strip">
          {photos.map((src, index) => (
            <li key={index} className="experience-media__thumb-cell">
              {index === selected ? (
                <button
                  type="button"
                  className="experience-media__thumb experience-media__thumb--selected"
                  aria-label={`Show photo ${index + 1} of ${total}`}
                  aria-current="true"
                >
                  <span className="experience-media__frame experience-media__frame--static">
                    <img className="experience-media__image" src={src} alt="" loading="lazy" decoding="async" />
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="experience-media__thumb"
                  aria-label={`Show photo ${index + 1} of ${total}`}
                  onClick={() => setSelected(index)}
                >
                  <motion.span
                    key={index}
                    className="experience-media__frame experience-media__frame--thumb"
                    layoutId={`experience-photo-${id}-${index}`}
                    layoutDependency={selected}
                    transition={MORPH}
                    style={{ borderRadius: THUMB_RADIUS }}
                  >
                    <img className="experience-media__image" src={src} alt="" loading="lazy" decoding="async" />
                  </motion.span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
