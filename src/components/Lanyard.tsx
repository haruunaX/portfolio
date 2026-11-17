'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, extend, useFrame, useThree, type ThreeElement, type ThreeEvent } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody
} from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial, type MeshLineMaterialParameters } from 'meshline';
import * as THREE from 'three';

import cardGLB from '../assets/lanyard/card.glb';
import { education } from '../data/portfolio';

extend({ MeshLineGeometry, MeshLineMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
    meshLineMaterial: ThreeElement<typeof MeshLineMaterial>;
  }
}

export interface LanyardProps {
  /** URL of the formal portrait painted on the card front. */
  portrait: string;
  /** False pauses rendering (frameloop 'never') and therefore the physics. */
  active: boolean;
  /** Fired once, after the textures are applied and the first frame has rendered. */
  onReady?: () => void;
  /** Fired if the WebGL context is lost, so the caller can fall back to a static badge. */
  onContextLost?: () => void;
}

interface CardGLTF {
  nodes: { card: THREE.Mesh; clip: THREE.Mesh; clamp: THREE.Mesh };
  materials: { base: THREE.MeshStandardMaterial; metal: THREE.MeshStandardMaterial };
}

type PaintableImage = CanvasImageSource & { width: number; height: number };

interface UvRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const FRONT_UV_RECT: UvRect = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT: UvRect = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

/** Fonts that must be loaded before textures are painted, so no fallback face is baked in. */
const FONT_LOADS = ['600 64px Fraunces', '400 32px "DM Sans"', '700 32px "DM Sans"'];
const FONT_SAMPLE = 'Hannah Sheen HS Cum Laude CTU 2026 Cebu, Philippines';

/**
 * Camera placement for the hero stage. The card is 2.25 units tall and hangs with its centre
 * near y = -0.45. The camera sits at that height so the card fills about 66% of the stage
 * height (visible height = 2 * z * tan(fov / 2) = 2.25 / 0.66), matching the DOM poster.
 */
const CAMERA_FOV = 20;
const CAMERA_POSITION: [number, number, number] = [0, -0.42, 9.7];
const GRAVITY: [number, number, number] = [0, -40, 0];

const COLORS = {
  shell: '#FFF8EF',
  text: '#2B1E17',
  muted: '#6B5A4E',
  mango: '#F2A93B',
  dusk: '#3A231B',
  lagoon: '#0B7471',
  seafoam: '#8FD9CF'
};
const FONT_DISPLAY = 'Fraunces';
const FONT_BODY = '"DM Sans"';

/** Design space for the card faces: 320 x 450, the same ratio as the DOM BadgeFace (32 : 45). */
const DESIGN_W = 320;
const DESIGN_H = 450;
/** One BadgeFace `cqi` (1% of the card width) in design pixels. */
const cqi = (n: number): number => n * (DESIGN_W / 100);

const vec = new THREE.Vector3();
const ang = new THREE.Vector3();
const rot = new THREE.Vector3();
const dir = new THREE.Vector3();
const smoothTarget = new THREE.Vector3();

/** Resolves once the badge fonts have loaded (or failed); never rejects. */
function loadBadgeFonts(): Promise<unknown> {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  return Promise.allSettled(FONT_LOADS.map((face) => document.fonts.load(face, FONT_SAMPLE)));
}

function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number): void {
  const inner = outer * 0.42;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Letter-spaced text, centred on cx. Uses the current font, fill and baseline. */
function drawSpaced(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, gap: number): void {
  const chars = Array.from(text);
  const widths = chars.map((char) => ctx.measureText(char).width);
  const total = widths.reduce((sum, w) => sum + w, 0) + gap * (chars.length - 1);
  let x = cx - total / 2;
  const align = ctx.textAlign;
  ctx.textAlign = 'left';
  chars.forEach((char, i) => {
    ctx.fillText(char, x, y);
    x += widths[i] + gap;
  });
  ctx.textAlign = align;
}

function paintSlot(ctx: CanvasRenderingContext2D, dark: boolean): void {
  const w = cqi(17);
  const h = cqi(3.4);
  const x = DESIGN_W / 2 - w / 2;
  const y = cqi(4.2);
  ctx.save();
  const fill = ctx.createLinearGradient(0, y, 0, y + h);
  fill.addColorStop(0, dark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(43, 30, 23, 0.22)');
  fill.addColorStop(1, dark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(43, 30, 23, 0.08)');
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = dark ? 'rgba(255, 248, 239, 0.18)' : 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y + 1, w, h, h / 2);
  ctx.stroke();
  ctx.restore();
}

function paintFront(ctx: CanvasRenderingContext2D, rect: UvRect, portrait: PaintableImage | null): void {
  ctx.save();
  ctx.translate(rect.x, rect.y);
  ctx.scale(rect.w / DESIGN_W, rect.h / DESIGN_H);
  ctx.beginPath();
  ctx.rect(0, 0, DESIGN_W, DESIGN_H);
  ctx.clip();

  // Shell card, lit from the top.
  const bg = ctx.createLinearGradient(0, 0, 0, DESIGN_H);
  bg.addColorStop(0, '#FFFFFF');
  bg.addColorStop(0.35, COLORS.shell);
  bg.addColorStop(1, '#F6EAD9');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

  // Soft Mango glow at the top.
  const glow = ctx.createRadialGradient(DESIGN_W / 2, 0, 0, DESIGN_W / 2, 0, cqi(72));
  glow.addColorStop(0, 'rgba(242, 169, 59, 0.42)');
  glow.addColorStop(1, 'rgba(242, 169, 59, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, DESIGN_W, cqi(46));

  paintSlot(ctx, false);

  // Formal portrait in a rounded rectangle, top aligned.
  const px = cqi(7);
  const py = cqi(11.5);
  const pw = cqi(86);
  const ph = cqi(62);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, cqi(5));
  ctx.clip();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(px, py, pw, ph);
  if (portrait) {
    const scale = Math.max(pw / portrait.width, ph / portrait.height);
    const dw = portrait.width * scale;
    ctx.drawImage(portrait, px + (pw - dw) / 2, py, dw, portrait.height * scale);
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(43, 30, 23, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, cqi(5));
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Name.
  ctx.fillStyle = COLORS.text;
  ctx.font = `600 ${cqi(9.4)}px ${FONT_DISPLAY}`;
  ctx.fillText('Hannah Sheen', DESIGN_W / 2, cqi(83.4));

  // Role, two lines.
  ctx.fillStyle = COLORS.muted;
  ctx.font = `400 ${cqi(4.1)}px ${FONT_BODY}`;
  ctx.fillText('IT Executive Assistant', DESIGN_W / 2, cqi(92.8));
  ctx.fillText('Full-stack developer', DESIGN_W / 2, cqi(98.3));

  // Honors chip with a Mango star.
  const label = `${education.honors} · CTU ${education.year}`;
  ctx.font = `700 ${cqi(3.5)}px ${FONT_BODY}`;
  const textWidth = ctx.measureText(label).width;
  const starSize = cqi(3.6);
  const gap = cqi(1.6);
  const padLeft = cqi(2.4);
  const padRight = cqi(3);
  const chipW = padLeft + starSize + gap + textWidth + padRight;
  const chipH = cqi(6);
  const chipX = DESIGN_W / 2 - chipW / 2;
  const chipY = cqi(104.4);
  ctx.fillStyle = 'rgba(242, 169, 59, 0.2)';
  ctx.beginPath();
  ctx.roundRect(chipX, chipY, chipW, chipH, chipH / 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(242, 169, 59, 0.5)';
  ctx.beginPath();
  ctx.roundRect(chipX, chipY, chipW, chipH, chipH / 2);
  ctx.stroke();
  ctx.fillStyle = COLORS.mango;
  starPath(ctx, chipX + padLeft + starSize / 2, chipY + chipH / 2, starSize / 2);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'left';
  ctx.fillText(label, chipX + padLeft + starSize + gap, chipY + chipH / 2 + 1);

  // Location with a Lagoon dot.
  ctx.font = `400 ${cqi(3.5)}px ${FONT_BODY}`;
  const place = 'Cebu, Philippines';
  const placeW = ctx.measureText(place).width;
  const dot = cqi(1.8);
  const placeGap = cqi(1.8);
  const placeX = DESIGN_W / 2 - (dot + placeGap + placeW) / 2;
  const placeY = cqi(115.5);
  ctx.fillStyle = 'rgba(11, 116, 113, 0.18)';
  ctx.beginPath();
  ctx.arc(placeX + dot / 2, placeY, dot / 2 + cqi(0.6), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.lagoon;
  ctx.beginPath();
  ctx.arc(placeX + dot / 2, placeY, dot / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(place, placeX + dot + placeGap, placeY + 1);

  // Lagoon band with the HS monogram.
  const bandY = DESIGN_H - cqi(15);
  ctx.fillStyle = COLORS.lagoon;
  ctx.fillRect(0, bandY, DESIGN_W, cqi(15));
  ctx.fillStyle = COLORS.mango;
  ctx.fillRect(0, bandY, DESIGN_W, cqi(0.8));
  ctx.fillStyle = 'rgba(143, 217, 207, 0.5)';
  ctx.fillRect(cqi(18), bandY + cqi(7.9), cqi(22), 1);
  ctx.fillRect(cqi(60), bandY + cqi(7.9), cqi(22), 1);
  ctx.fillStyle = COLORS.shell;
  ctx.font = `600 ${cqi(6.4)}px ${FONT_DISPLAY}`;
  ctx.textAlign = 'center';
  drawSpaced(ctx, 'HS', DESIGN_W / 2, bandY + cqi(8), cqi(0.8));

  ctx.restore();
}

function paintBack(ctx: CanvasRenderingContext2D, rect: UvRect): void {
  ctx.save();
  ctx.translate(rect.x, rect.y);
  ctx.scale(rect.w / DESIGN_W, rect.h / DESIGN_H);
  ctx.beginPath();
  ctx.rect(0, 0, DESIGN_W, DESIGN_H);
  ctx.clip();

  ctx.fillStyle = COLORS.dusk;
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
  const glow = ctx.createRadialGradient(DESIGN_W / 2, 0, 0, DESIGN_W / 2, 0, cqi(80));
  glow.addColorStop(0, 'rgba(143, 217, 207, 0.16)');
  glow.addColorStop(1, 'rgba(143, 217, 207, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, DESIGN_W, cqi(60));

  paintSlot(ctx, true);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // HS monogram medallion.
  const cx = DESIGN_W / 2;
  const cy = cqi(27);
  ctx.fillStyle = COLORS.lagoon;
  ctx.beginPath();
  ctx.arc(cx, cy, cqi(12), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(143, 217, 207, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, cqi(14), 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = COLORS.shell;
  ctx.font = `600 ${cqi(9)}px ${FONT_DISPLAY}`;
  drawSpaced(ctx, 'HS', cx, cy + 2, cqi(0.8));

  // Kicker.
  ctx.fillStyle = COLORS.seafoam;
  ctx.font = `700 ${cqi(3.2)}px ${FONT_BODY}`;
  drawSpaced(ctx, 'EDUCATION', cx, cqi(48), cqi(0.9));

  // Honors.
  ctx.fillStyle = COLORS.seafoam;
  ctx.font = `600 ${cqi(13.5)}px ${FONT_DISPLAY}`;
  ctx.fillText(education.honors, cx, cqi(61));

  ctx.fillStyle = COLORS.mango;
  ctx.fillRect(cx - cqi(9), cqi(71), cqi(18), 2);

  // Degree.
  ctx.fillStyle = COLORS.shell;
  ctx.font = `400 ${cqi(4.5)}px ${FONT_BODY}`;
  ctx.fillText('Bachelor of Science in', cx, cqi(80));
  ctx.fillText('Information Technology', cx, cqi(86.5));

  // School and year.
  ctx.fillStyle = COLORS.seafoam;
  ctx.font = `400 ${cqi(3.9)}px ${FONT_BODY}`;
  ctx.fillText(`${education.school} · ${education.year}`, cx, cqi(97));

  // Footer.
  ctx.fillStyle = COLORS.mango;
  starPath(ctx, cx - cqi(14), cqi(130), cqi(1.9));
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 248, 239, 0.7)';
  ctx.font = `400 ${cqi(3.5)}px ${FONT_BODY}`;
  ctx.textAlign = 'left';
  ctx.fillText('Cebu, Philippines', cx - cqi(10.5), cqi(130) + 1);

  ctx.restore();
}

/** Paints the badge onto a copy of the GLB atlas so edges and unused regions keep their look. */
function paintCardTexture(baseMap: THREE.Texture, portrait: PaintableImage | null, anisotropy: number): THREE.CanvasTexture | null {
  const baseImage = baseMap.image as PaintableImage;
  const canvas = document.createElement('canvas');
  canvas.width = baseImage.width;
  canvas.height = baseImage.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const W = canvas.width;
  const H = canvas.height;
  ctx.drawImage(baseImage, 0, 0, W, H);
  paintFront(ctx, { x: FRONT_UV_RECT.x * W, y: FRONT_UV_RECT.y * H, w: FRONT_UV_RECT.w * W, h: FRONT_UV_RECT.h * H }, portrait);
  paintBack(ctx, { x: BACK_UV_RECT.x * W, y: BACK_UV_RECT.y * H, w: BACK_UV_RECT.w * W, h: BACK_UV_RECT.h * H });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = baseMap.flipY;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

const STRAP_PHRASE = 'HANNAH SHEEN · CEBU';

/** Lagoon strap with the phrase repeated in Shell. One tile is 4 : 1, matching the strap's proportions. */
function paintStrapTexture(anisotropy: number): THREE.CanvasTexture | null {
  const W = 1536;
  const H = 384;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, '#0F8985');
  base.addColorStop(0.5, COLORS.lagoon);
  base.addColorStop(1, '#095A58');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // Woven edges and stitching.
  ctx.fillStyle = 'rgba(255, 248, 239, 0.16)';
  ctx.fillRect(0, 0, W, 10);
  ctx.fillRect(0, H - 10, W, 10);
  ctx.strokeStyle = 'rgba(143, 217, 207, 0.7)';
  ctx.lineWidth = 4;
  ctx.setLineDash([22, 16]);
  ctx.beginPath();
  ctx.moveTo(0, 34);
  ctx.lineTo(W, 34);
  ctx.moveTo(0, H - 34);
  ctx.lineTo(W, H - 34);
  ctx.stroke();
  ctx.setLineDash([]);

  // Phrase, fitted to 88% of the tile so every repeat is whole.
  ctx.fillStyle = COLORS.shell;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  let size = 112;
  let spacing = 7;
  const measure = (): number => {
    ctx.font = `700 ${size}px ${FONT_BODY}`;
    return Array.from(STRAP_PHRASE).reduce((sum, char) => sum + ctx.measureText(char).width, 0) + spacing * (STRAP_PHRASE.length - 1);
  };
  const total = measure();
  const maxWidth = W * 0.88;
  if (total > maxWidth) {
    const factor = maxWidth / total;
    size = Math.floor(size * factor);
    spacing = spacing * factor;
    measure(); // re-applies the font at the fitted size
  }
  drawSpaced(ctx, STRAP_PHRASE, W / 2, H / 2 + 4, spacing);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

export default function Lanyard({ portrait, active, onReady, onContextLost }: LanyardProps) {
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = (): void => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onReadyRef = useRef(onReady);
  const onContextLostRef = useRef(onContextLost);
  useEffect(() => {
    onReadyRef.current = onReady;
    onContextLostRef.current = onContextLost;
  }, [onReady, onContextLost]);
  const notifyReady = useCallback(() => onReadyRef.current?.(), []);

  // Only losses while this component is mounted count. On unmount R3F releases the context on
  // purpose (forceContextLoss, 500ms later); the cleanup below keeps that from reading as a failure.
  const [glCanvas, setGlCanvas] = useState<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!glCanvas) return;
    const handleLost = (): void => onContextLostRef.current?.();
    glCanvas.addEventListener('webglcontextlost', handleLost);
    return () => glCanvas.removeEventListener('webglcontextlost', handleLost);
  }, [glCanvas]);

  return (
    <div className="lanyard-root" style={{ width: '100%', height: '100%', touchAction: 'pan-y' }}>
      <Canvas
        frameloop={active ? 'always' : 'never'}
        camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x000000), 0);
          setGlCanvas(gl.domElement);
        }}
      >
        <ambientLight intensity={Math.PI * 0.85} color="#FFF3E2" />
        <directionalLight position={[4, 6, 5]} intensity={1.4} color="#FFE3BA" />
        <Physics gravity={GRAVITY} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band portrait={portrait} isMobile={isMobile} onReady={notifyReady} />
        </Physics>
        <Environment blur={0.75}>
          {/* Warm Shell and Mango light from the top right. */}
          <Lightformer intensity={9} color="#FFE6BF" position={[7, 5, 4]} scale={[14, 5, 1]} target={[0, 0, 0]} />
          <Lightformer intensity={3} color="#FFF8EF" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={5} color="#F2A93B" position={[10, 2, 8]} scale={[10, 8, 1]} target={[0, 0, 0]} />
          {/* Cool Seafoam rim from the bottom left. */}
          <Lightformer intensity={5} color="#8FD9CF" position={[-8, -5, 3]} scale={[14, 3, 1]} target={[0, 0, 0]} />
          <Lightformer intensity={2} color="#FFF8EF" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}

interface BandProps {
  portrait: string;
  isMobile: boolean;
  onReady: () => void;
}

const MAX_SPEED = 50;
const MIN_SPEED = 0;

/** Constructor args for the strap material; the live resolution is set through the prop. */
const STRAP_MATERIAL_ARGS: [MeshLineMaterialParameters] = [{ resolution: new THREE.Vector2(1000, 1000) }];

const SEGMENT_PROPS = {
  canSleep: true,
  colliders: false,
  angularDamping: 4,
  linearDamping: 4
} as const;

function Band({ portrait, isMobile, onReady }: BandProps) {
  const band = useRef<THREE.Mesh>(null);
  // react-three-rapier's joint hooks want non-null refs; every guard below still checks at runtime.
  const fixed = useRef<RapierRigidBody>(null!);
  const j1 = useRef<RapierRigidBody>(null!);
  const j2 = useRef<RapierRigidBody>(null!);
  const j3 = useRef<RapierRigidBody>(null!);
  const card = useRef<RapierRigidBody>(null!);
  const lerp1 = useRef<THREE.Vector3 | null>(null);
  const lerp2 = useRef<THREE.Vector3 | null>(null);
  const readyFired = useRef(false);

  const { nodes, materials } = useGLTF(cardGLB) as unknown as CardGLTF;
  const portraitTexture = useTexture(portrait);
  const maxAnisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy());

  const [cardMap, setCardMap] = useState<THREE.CanvasTexture | null>(null);
  const [strapMap, setStrapMap] = useState<THREE.CanvasTexture | null>(null);

  // Paint only after the badge fonts resolve, so no fallback face is baked into a texture.
  useEffect(() => {
    let alive = true;
    let paintedCard: THREE.CanvasTexture | null = null;
    let paintedStrap: THREE.CanvasTexture | null = null;
    const anisotropy = Math.min(isMobile ? 4 : 8, maxAnisotropy);
    const baseMap = materials.base.map;
    loadBadgeFonts().then(() => {
      if (!alive || !baseMap) return;
      paintedCard = paintCardTexture(baseMap, portraitTexture.image as PaintableImage | null, anisotropy);
      paintedStrap = paintStrapTexture(anisotropy);
      setCardMap(paintedCard);
      setStrapMap(paintedStrap);
    });
    return () => {
      alive = false;
      paintedCard?.dispose();
      paintedStrap?.dispose();
    };
  }, [materials.base.map, portraitTexture, isMobile, maxAnisotropy]);

  const [curve] = useState(() => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
    c.curveType = 'chordal';
    return c;
  });
  const [dragged, drag] = useState<false | THREE.Vector3>(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => {
        document.body.style.cursor = 'auto';
      };
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    const anchor = fixed.current;
    const body1 = j1.current;
    const body2 = j2.current;
    const body3 = j3.current;
    const cardBody = card.current;
    const mesh = band.current;
    if (!anchor || !body1 || !body2 || !body3 || !cardBody || !mesh) return;

    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [cardBody, body1, body2, body3, anchor].forEach((body) => body.wakeUp());
      cardBody.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z
      });
    }

    const smooth = (body: RapierRigidBody, store: { current: THREE.Vector3 | null }): THREE.Vector3 => {
      const t = body.translation();
      smoothTarget.set(t.x, t.y, t.z);
      if (!store.current) store.current = smoothTarget.clone();
      const clampedDistance = Math.max(0.1, Math.min(1, store.current.distanceTo(smoothTarget)));
      store.current.lerp(smoothTarget, delta * (MIN_SPEED + clampedDistance * (MAX_SPEED - MIN_SPEED)));
      return store.current;
    };
    const p1 = smooth(body1, lerp1);
    const p2 = smooth(body2, lerp2);

    curve.points[0].copy(body3.translation());
    curve.points[1].copy(p2);
    curve.points[2].copy(p1);
    curve.points[3].copy(anchor.translation());
    (mesh.geometry as MeshLineGeometry).setPoints(curve.getPoints(isMobile ? 16 : 32));
    ang.copy(cardBody.angvel());
    rot.copy(cardBody.rotation());
    cardBody.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true);
  });

  // The textures are applied from the render that follows setState, so a frame that sees both
  // maps has been drawn by the time the next animation frame callback runs.
  useFrame(() => {
    if (readyFired.current || !cardMap || !strapMap) return;
    readyFired.current = true;
    requestAnimationFrame(onReady);
  });

  const handlePointerUp = (event: ThreeEvent<PointerEvent>): void => {
    (event.target as unknown as Element).releasePointerCapture(event.pointerId);
    drag(false);
  };
  const handlePointerDown = (event: ThreeEvent<PointerEvent>): void => {
    const body = card.current;
    if (!body) return;
    (event.target as unknown as Element).setPointerCapture(event.pointerId);
    drag(new THREE.Vector3().copy(event.point).sub(vec.copy(body.translation())));
  };

  // Everything starts hanging straight down, so the rest pose matches the DOM poster.
  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...SEGMENT_PROPS} type="fixed" />
        <RigidBody position={[0, -1, 0]} ref={j1} {...SEGMENT_PROPS} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[0, -2, 0]} ref={j2} {...SEGMENT_PROPS} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[0, -3, 0]} ref={j3} {...SEGMENT_PROPS} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[0, -4.45, 0]} ref={card} {...SEGMENT_PROPS} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={handlePointerUp}
            onPointerDown={handlePointerDown}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap ?? materials.base.map}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.5}
                metalness={0.15}
              />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          args={STRAP_MATERIAL_ARGS}
          color="white"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap={strapMap ? 1 : 0}
          map={strapMap ?? undefined}
          repeat={[-6, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}
