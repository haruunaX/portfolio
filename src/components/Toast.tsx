import { useEffect, useState } from 'react'
import { TOAST_EVENT } from '../lib/toast'
import './Toast.css'

/** The single toast region. App mounts it once; anything can call `showToast` from `lib/toast`. */
export default function Toaster() {
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
      {toast && (
        <span key={toast.id} className="toast">
          {toast.message}
        </span>
      )}
    </div>
  )
}
