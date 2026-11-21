import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FADE, POP } from '../lib/motion'
import { TOAST_EVENT } from '../lib/toast'
import { useReducedMotion } from '../lib/useReducedMotion'
import './Toast.css'

/** The single toast region. App mounts it once; anything can call `showToast` from `lib/toast`. */
export default function Toaster() {
  const reduced = useReducedMotion()
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)

  useEffect(() => {
    let timer = 0
    let id = 0
    const handleToast = (event: Event) => {
      id += 1
      setToast({ id, message: (event as CustomEvent<string>).detail })
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setToast(null), 2400)
    }
    window.addEventListener(TOAST_EVENT, handleToast)
    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast)
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <div className="toaster" role="status" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.span
            key={toast.id}
            className="toast"
            // The sticker slaps on with a small overshoot and a tilt; reduced motion only fades.
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 22, scale: 0.7, rotate: -7 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, rotate: -2 }}
            exit={{ opacity: 0, transition: FADE }}
            transition={reduced ? FADE : POP}
          >
            {toast.message}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
