/**
 * Sardine school: a framework-free boids engine drawn on a 2D canvas.
 * All state lives in typed arrays allocated once in `createSwarm`; `stepSwarm` and `drawSwarm`
 * never allocate. Coordinates are canvas CSS pixels (top-left origin).
 */

/** Fill colours by body type: 0 cream, 1 dim cream, 2 sun glint, 3 orange glint. */
const COLORS = ['#FFF4E2', '#FFF4E2', '#FFD21F', '#FF6A1A']
const ALPHAS = [1, 0.74, 1, 1]
const OUTLINE = 'rgba(5, 10, 61, 0.5)'

/** Pointer scatter radius, in px. */
const SCATTER_RADIUS = 120
/** Padding the host adds around each avoid rect before handing it over, in px. */
export const AVOID_PAD = 16
/** Extra radius the school keeps around the badge footprint, in px. */
export const BADGE_MARGIN = 26

export interface SwarmState {
  /** Fish count. */
  readonly n: number
  readonly x: Float32Array
  readonly y: Float32Array
  readonly vx: Float32Array
  readonly vy: Float32Array
  /** Body type 0..3. */
  readonly type: Uint8Array
  readonly size: Float32Array
  readonly phase: Float32Array
  /** Draw bucket: body type, plus 4 while the fish sits inside an avoid rect (drawn faint). */
  readonly bucket: Uint8Array
  /** Canvas size in CSS px and the pixel ratio the backing store uses. */
  w: number
  h: number
  dpr: number
  /** Pointer in canvas px, valid while `pointerActive`. */
  pointerX: number
  pointerY: number
  pointerActive: boolean
  /** Badge ellipse in canvas px, valid while `badgeActive`. */
  badgeX: number
  badgeY: number
  badgeRx: number
  badgeRy: number
  badgeActive: boolean
  /** Avoid rects as x0,y0,x1,y1 quads, canvas px; first `avoidCount` quads are live. */
  avoid: Float32Array
  avoidCount: number
}

export function createSwarm(n: number): SwarmState {
  return {
    n,
    x: new Float32Array(n),
    y: new Float32Array(n),
    vx: new Float32Array(n),
    vy: new Float32Array(n),
    type: new Uint8Array(n),
    size: new Float32Array(n),
    phase: new Float32Array(n),
    bucket: new Uint8Array(n),
    w: 0,
    h: 0,
    dpr: 1,
    pointerX: 0,
    pointerY: 0,
    pointerActive: false,
    badgeX: 0,
    badgeY: 0,
    badgeRx: 0,
    badgeRy: 0,
    badgeActive: false,
    avoid: new Float32Array(0),
    avoidCount: 0,
  }
}

/** Copy `count` quads of x0,y0,x1,y1 into the engine. Call on resize and scroll, never per frame. */
export function setAvoidRects(s: SwarmState, quads: ArrayLike<number>, count: number): void {
  if (s.avoid.length < count * 4) s.avoid = new Float32Array(count * 4)
  for (let i = 0; i < count * 4; i++) s.avoid[i] = quads[i]
  s.avoidCount = count
}

function insideAvoid(s: SwarmState, x: number, y: number): boolean {
  const a = s.avoid
  for (let k = 0; k < s.avoidCount; k++) {
    const o = k * 4
    if (x > a[o] && x < a[o + 2] && y > a[o + 1] && y < a[o + 3]) return true
  }
  return false
}

/** Seeds as a few loose schools so the swarm reads at first paint. */
const BLOBS: ReadonlyArray<readonly [number, number, number]> = [
  [0.56, 0.9, -0.1],
  [0.9, 0.8, 3.3],
  [0.92, 0.14, 2.9],
  [0.5, 0.1, 0.15],
  [0.14, 0.93, -0.2],
  [0.74, 0.5, 1.6],
]

function seed(s: SwarmState): void {
  const { w, h } = s
  for (let i = 0; i < s.n; i++) {
    let x = 0
    let y = 0
    let a = 0
    for (let t = 0; t < 8; t++) {
      if (Math.random() < 0.22) {
        x = Math.random() * w
        y = Math.random() * h
        a = Math.random() * 6.283
      } else {
        const bl = BLOBS[i % BLOBS.length]
        const gx = Math.random() + Math.random() + Math.random() - 1.5
        const gy = Math.random() + Math.random() + Math.random() - 1.5
        x = bl[0] * w + gx * 340
        y = bl[1] * h + gy * 230
        a = bl[2] + (Math.random() - 0.5) * 0.9
      }
      if (!insideAvoid(s, x, y)) break
    }
    s.x[i] = x
    s.y[i] = y
    const sp = 1.4 + Math.random()
    s.vx[i] = Math.cos(a) * sp
    s.vy[i] = Math.sin(a) * sp
    const r = Math.random()
    const type = r < 0.05 ? 2 : r < 0.1 ? 3 : r < 0.42 ? 1 : 0
    s.type[i] = type
    s.size[i] = type === 1 ? 0.8 + Math.random() * 0.2 : 1 + Math.random() * 0.35
    s.phase[i] = Math.random() * 6.283
    s.bucket[i] = type
  }
}

/** Set the canvas size. First call seeds the school; later calls rescale it to the new box. */
export function resizeSwarm(s: SwarmState, w: number, h: number, dpr: number): void {
  const ow = s.w
  const oh = s.h
  s.w = w
  s.h = h
  s.dpr = dpr
  if (ow <= 0 || oh <= 0) {
    seed(s)
    return
  }
  const kx = w / ow
  const ky = h / oh
  for (let i = 0; i < s.n; i++) {
    s.x[i] *= kx
    s.y[i] *= ky
  }
}

/**
 * Advance the school by `f` frames (1 = one 60 fps frame). `now` is a time in ms that only
 * drives the slow current field.
 */
export function stepSwarm(s: SwarmState, f: number, now: number): void {
  const { n, x: X, y: Y, vx: VX, vy: VY, w, h } = s
  const R2 = 62 * 62
  const SEP = 16
  const FR = SCATTER_RADIUS
  const FR2 = FR * FR
  const pa = s.pointerActive
  const px = s.pointerX
  const py = s.pointerY
  const ba = s.badgeActive
  const bx = s.badgeX
  const by = s.badgeY
  const brx = s.badgeRx || 1
  const bry = s.badgeRy || 1
  const av = s.avoid
  const avN = s.avoidCount

  for (let i = 0; i < n; i++) {
    let xi = X[i]
    let yi = Y[i]
    let vx = VX[i]
    let vy = VY[i]
    let sx = 0
    let sy = 0
    let avx = 0
    let avy = 0
    let cx = 0
    let cy = 0
    let nb = 0
    for (let j = 0; j < n; j++) {
      if (j === i) continue
      const dx = X[j] - xi
      const dy = Y[j] - yi
      const d2 = dx * dx + dy * dy
      if (d2 < R2) {
        nb++
        avx += VX[j]
        avy += VY[j]
        cx += dx
        cy += dy
        if (d2 < SEP * SEP && d2 > 0.01) {
          const d = Math.sqrt(d2)
          const wgt = (SEP - d) / SEP / d
          sx -= dx * wgt
          sy -= dy * wgt
        }
      }
    }
    if (nb) {
      vx += ((avx / nb - vx) * 0.07 + (cx / nb) * 0.006 + sx * 0.35) * f
      vy += ((avy / nb - vy) * 0.07 + (cy / nb) * 0.006 + sy * 0.35) * f
    }
    // slow ocean current so an undisturbed school keeps drifting
    const a = Math.sin(xi * 0.004 + now * 0.0004) * 3 + Math.cos(yi * 0.005 - now * 0.0003) * 3
    vx += Math.cos(a) * 0.02 * f
    vy += Math.sin(a) * 0.02 * f

    // scatter from the pointer
    if (pa) {
      const dx = xi - px
      const dy = yi - py
      const d2 = dx * dx + dy * dy
      if (d2 < FR2 && d2 > 0.01) {
        const d = Math.sqrt(d2)
        const wgt = 1 - d / FR
        vx += (dx / d) * wgt * wgt * 1.9 * f
        vy += (dy / d) * wgt * wgt * 1.9 * f
      }
    }

    // circle the badge: pushed out of its footprint, swirled around it, drawn in a little
    if (ba) {
      const ux = xi - bx
      const uy = yi - by
      const nx = ux / brx
      const ny = uy / bry
      const dd = Math.sqrt(nx * nx + ny * ny)
      if (dd < 2.3) {
        const len = Math.sqrt(ux * ux + uy * uy) || 1
        const ox = ux / len
        const oy = uy / len
        if (dd < 1.05) {
          const k = (1.05 - dd) * 2.8
          vx += ox * k * f
          vy += oy * k * f
        } else {
          const sw = 0.07 * (1 - (dd - 1.05) / 1.25)
          vx += -oy * sw * f
          vy += ox * sw * f
          const pull = (1.45 - dd) * 0.02
          vx += ox * pull * f
          vy += oy * pull * f
        }
      }
    }

    // keep clear of the avoid rects: gentle push out, drawn faint while inside
    let inside = 0
    for (let k = 0; k < avN; k++) {
      const o = k * 4
      const x0 = av[o]
      const y0 = av[o + 1]
      const x1 = av[o + 2]
      const y1 = av[o + 3]
      if (xi > x0 && xi < x1 && yi > y0 && yi < y1) {
        inside = 4
        const dl = xi - x0
        const dr = x1 - xi
        const dt = yi - y0
        const db = y1 - yi
        const m = Math.min(dl, dr, dt, db)
        const q = 0.16 * f
        if (m === dl) vx -= q
        else if (m === dr) vx += q
        else if (m === dt) vy -= q
        else vy += q
        break
      }
    }

    const sp = Math.sqrt(vx * vx + vy * vy) || 0.001
    const tgt = sp > 4 ? 4 : sp + (1.95 - sp) * 0.03 * f
    vx *= tgt / sp
    vy *= tgt / sp
    VX[i] = vx
    VY[i] = vy
    xi += vx * f
    yi += vy * f
    if (xi < -30) xi += w + 60
    else if (xi > w + 30) xi -= w + 60
    if (yi < -30) yi += h + 60
    else if (yi > h + 30) yi -= h + 60
    X[i] = xi
    Y[i] = yi
    s.bucket[i] = s.type[i] + inside
  }
}

/** Draw the school. Fish are batched into one path per colour/alpha bucket. */
export function drawSwarm(s: SwarmState, ctx: CanvasRenderingContext2D, now: number): void {
  const { n, x: X, y: Y, vx: VX, vy: VY, size: SZ, phase: PH, bucket: BK } = s
  ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0)
  ctx.clearRect(0, 0, s.w, s.h)
  ctx.lineJoin = 'round'
  ctx.lineWidth = 1.5
  ctx.strokeStyle = OUTLINE
  for (let b = 0; b < 8; b++) {
    ctx.beginPath()
    let any = false
    for (let i = 0; i < n; i++) {
      if (BK[i] !== b) continue
      any = true
      const vx = VX[i]
      const vy = VY[i]
      const sp = Math.sqrt(vx * vx + vy * vy) || 1
      const ux = vx / sp
      const uy = vy / sp
      const nx = -uy
      const ny = ux
      const L = 10.4 * SZ[i]
      const Wd = 2.5 * SZ[i]
      const tw = Math.sin(now * 0.014 * (0.6 + sp * 0.4) + PH[i]) * Wd * 1.1
      const x = X[i]
      const y = Y[i]
      ctx.moveTo(x + ux * L, y + uy * L)
      ctx.quadraticCurveTo(
        x + ux * L * 0.1 + nx * Wd * 1.9,
        y + uy * L * 0.1 + ny * Wd * 1.9,
        x - ux * L * 0.75 + nx * tw * 0.5,
        y - uy * L * 0.75 + ny * tw * 0.5,
      )
      ctx.lineTo(x - ux * L * 1.3 + nx * (tw + Wd * 1.2), y - uy * L * 1.3 + ny * (tw + Wd * 1.2))
      ctx.lineTo(x - ux * L * 1.05 + nx * tw * 0.9, y - uy * L * 1.05 + ny * tw * 0.9)
      ctx.lineTo(x - ux * L * 1.3 + nx * (tw - Wd * 1.2), y - uy * L * 1.3 + ny * (tw - Wd * 1.2))
      ctx.lineTo(x - ux * L * 0.75 + nx * tw * 0.5, y - uy * L * 0.75 + ny * tw * 0.5)
      ctx.quadraticCurveTo(
        x + ux * L * 0.1 - nx * Wd * 1.9,
        y + uy * L * 0.1 - ny * Wd * 1.9,
        x + ux * L,
        y + uy * L,
      )
    }
    if (!any) continue
    ctx.globalAlpha = ALPHAS[b & 3] * (b > 3 ? 0.24 : 1)
    ctx.stroke()
    ctx.fillStyle = COLORS[b & 3]
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/** Settle the school for a static frame: simulate ahead with no pointer, then draw once. */
export function settleSwarm(s: SwarmState, ctx: CanvasRenderingContext2D): void {
  const was = s.pointerActive
  s.pointerActive = false
  for (let k = 0; k < 220; k++) stepSwarm(s, 1, k * 16)
  s.pointerActive = was
  drawSwarm(s, ctx, 0)
}
