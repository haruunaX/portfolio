import { motion } from 'motion/react'
import type { CSSProperties, ReactNode, RefObject } from 'react'
import { slapIn } from '../lib/motion'
import { finePointer } from '../lib/pointer'
import { useReducedMotion } from '../lib/useReducedMotion'
import './Sticker.css'

type StickerProps = {
  children: ReactNode
  /** Resting tilt in degrees. Never set transform, rotate or scale on the sticker yourself. */
  rotate?: number
  /** Element the sticker may be dragged around inside (fine pointers only). Omit for a static sticker. */
  dragArea?: RefObject<HTMLElement | null>
  /**
   * Drag freely and spring back to its own slot on release (fine pointers only), with no container.
   * Use it for stickers in normal flow: Motion re-maps contained stickers when the window resizes,
   * which pushes flowing ones off their slots.
   */
  snapBack?: boolean
  /** Gentle idle bob. */
  float?: boolean
  /** Entrance delay in seconds. */
  delay?: number
  /** Controls the entrance from outside (for example the hero's intro). Omit to animate on scroll into view. */
  show?: boolean
  /** Play the slap-in entrance. Pass false to start already in place, for example when remounting. */
  appear?: boolean
  className?: string
  /** Position the sticker with left/top/right/bottom here, never with transforms. */
  style?: CSSProperties
  /** Accessible name for a sticker that carries meaning. Without it the sticker is decorative and hidden. */
  label?: string
}

/**
 * A die-cut sticker: slaps onto the page, bobs and wobbles on hover. Given a `dragArea` it can be
 * dragged and flicked around inside it; with `snapBack` it springs home when let go. Under reduced
 * motion it only fades in, stays still and stops where it is dropped.
 */
export default function Sticker({
  children,
  rotate = 0,
  dragArea,
  snapBack = false,
  float = false,
  delay = 0,
  show,
  appear = true,
  className,
  style,
  label,
}: StickerProps) {
  const reduced = useReducedMotion()
  const variants = slapIn(rotate, reduced, delay)
  const draggable = (Boolean(dragArea) || snapBack) && finePointer
  const entrance = show === undefined
    ? { whileInView: 'show', viewport: { once: true, amount: 0.5 } }
    : { animate: show ? 'show' : 'hidden' }

  return (
    <motion.div
      className={`sticker${draggable ? ' sticker--drag' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      variants={variants}
      initial={appear ? 'hidden' : false}
      {...entrance}
      whileHover={reduced ? undefined : { rotate: rotate + 5, scale: 1.05 }}
      drag={draggable}
      dragConstraints={draggable && !snapBack ? dragArea : undefined}
      dragSnapToOrigin={snapBack}
      dragElastic={0.18}
      dragMomentum={!reduced && !snapBack}
      dragTransition={{ bounceStiffness: 420, bounceDamping: 18 }}
      whileDrag={reduced ? { zIndex: 30 } : { scale: 1.1, rotate: rotate - 6, zIndex: 30 }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <span className={`sticker__body${float && !reduced ? ' sticker__body--float' : ''}`}>{children}</span>
    </motion.div>
  )
}
