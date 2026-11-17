import formalPortrait from '../assets/images/hannah-formal.jpg'
import { education } from '../data/portfolio'
import './BadgeFace.css'

/**
 * The ID badge face as plain DOM. Shared by the loader card and the hero poster, so every size
 * inside scales with the card width (container query units) and both look identical.
 * Decorative: the parent supplies the accessible name.
 */
export default function BadgeFace({ className }: { className?: string }) {
  return (
    <div className={className ? `badge-face ${className}` : 'badge-face'}>
      <span className="badge-face__glow" />
      <span className="badge-face__slot" />

      <div className="badge-face__body">
        <div className="badge-face__photo">
          <img src={formalPortrait} alt="" decoding="async" draggable={false} />
        </div>

        <p className="badge-face__name">Hannah Sheen</p>
        <p className="badge-face__role">
          <span>IT Executive Assistant</span>
          <span>Full-stack developer</span>
        </p>

        <p className="badge-face__honors">
          <svg className="badge-face__star" viewBox="0 0 24 24" aria-hidden="true">
            <polygon points="12,2 14.47,8.6 21.51,8.91 15.99,13.3 17.88,20.09 12,16.2 6.12,20.09 8.01,13.3 2.49,8.91 9.53,8.6" />
          </svg>
          <span>
            {education.honors} · CTU {education.year}
          </span>
        </p>

        <p className="badge-face__place">
          <span className="badge-face__dot" />
          Cebu, Philippines
        </p>
      </div>

      <div className="badge-face__band">
        <span>HS</span>
      </div>
    </div>
  )
}
