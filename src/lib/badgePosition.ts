/**
 * Where the hero ID badge card is on screen, in viewport (client) pixels.
 * The badge (3D canvas or poster) writes it every frame while the hero is visible, and the
 * sardine swarm reads it to circle the badge. A plain mutable object on purpose: per-frame
 * values must never cause React renders.
 */
export const badgePosition = {
  /** Center of the card, viewport x. */
  x: 0,
  /** Center of the card, viewport y. */
  y: 0,
  /** Rough radius of the card's footprint, for the swarm to orbit and avoid. */
  radius: 0,
  /** False until the badge has been measured, and while it is off-screen. */
  visible: false,
}
