/**
 * True on mouse and trackpad devices. Drag toys are limited to these: on touch screens dragging
 * would fight page scrolling, and the URL bar resizes the window while scrolling.
 */
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
