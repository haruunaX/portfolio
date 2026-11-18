/** Window event the shared `<Toaster />` listens for. */
export const TOAST_EVENT = 'hs:toast'

/** Shows a short status message (for example "Email copied") in the shared toaster. */
export function showToast(message: string): void {
  window.dispatchEvent(new CustomEvent<string>(TOAST_EVENT, { detail: message }))
}
