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
const FONT_LOADS = ['700 64px "Bricolage Grotesque"', '800 64px "Bricolage Grotesque"', '600 32px Inter', '700 32px Inter'];
const FONT_SAMPLE = 'Hannah Sheen HS Cum Laude CTU 2026 IT Executive Assistant Full-stack developer';

/**
 * Camera placement for the hero stage. The card is 2.25 units tall and hangs with its centre
 * near y = -0.45. The camera sits at that height so the card fills about 66% of the stage
 * height (visible height = 2 * z * tan(fov / 2) = 2.25 / 0.66), matching the DOM poster.
 */
const CAMERA_FOV = 20;
const CAMERA_POSITION: [number, number, number] = [0, -0.42, 9.7];
const GRAVITY: [number, number, number] = [0, -40, 0];

const COLORS = {
  cream: '#FFF6EC',
  paper: '#FFFFFF',
  ink: '#1B1035',
  grape: '#6A2BFF',
  grapeLight: '#8A5CFF',
  grapeDeep: '#4F17D6',
  pink: '#FF4FA0',
  sky: '#36C5F0',
  lime: '#C6F432'
};
/** Card geometry in BadgeFace cqi: the ink outline inside the edge, and the card's corner radius. */
const CARD_EDGE = 1.4;
const CARD_CORNER = 6;
const FONT_DISPLAY = '"Bricolage Grotesque"';
const FONT_BODY = 'Inter';

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

function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number, rotate = 0): void {
  const inner = outer * 0.42;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + rotate + (i * Math.PI) / 5;
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

/** The card slot: a solid ink pill. */
function paintSlot(ctx: CanvasRenderingContext2D): void {
  const w = cqi(17);
  const h = cqi(3.4);
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.roundRect(DESIGN_W / 2 - w / 2, cqi(4.2), w, h, h / 2);
  ctx.fill();
}

/**
 * Ink outline painted inside the card edge, then the card fill, then a clip to the inside, so
 * everything after it is cut to the rounded card like the DOM face. Call inside save/restore.
 */
function paintCardBase(ctx: CanvasRenderingContext2D, fill: string): void {
  const edge = cqi(CARD_EDGE);
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
  ctx.beginPath();
  ctx.roundRect(edge, edge, DESIGN_W - edge * 2, DESIGN_H - edge * 2, cqi(CARD_CORNER) - edge);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.clip();
}

/** Pink spark sticker with an ink outline, overlapping the photo's corner. */
function paintSpark(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  starPath(ctx, cx, cy, cqi(5.4), (12 * Math.PI) / 180);
  ctx.fillStyle = COLORS.pink;
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = cqi(0.87);
  ctx.lineJoin = 'round';
  ctx.stroke();
}

/*
 * Front layout in BadgeFace cqi (card is 100 wide x 140.6 tall); BadgeFace.css mirrors it:
 *   slot 4.2-7.6 | photo 11.5-77.5 | name 82.5-93.1 | role 94.7-105.7 | chip 109.7-116.3 |
 *   band 124.6-140.6
 */
function paintFront(ctx: CanvasRenderingContext2D, rect: UvRect, portrait: PaintableImage | null): void {
  ctx.save();
  ctx.translate(rect.x, rect.y);
  ctx.scale(rect.w / DESIGN_W, rect.h / DESIGN_H);
  ctx.beginPath();
  ctx.rect(0, 0, DESIGN_W, DESIGN_H);
  ctx.clip();

  paintCardBase(ctx, COLORS.cream);
  paintSlot(ctx);

  // Photo window: ink outline, then the formal portrait inside it, top aligned.
  const px = cqi(7);
  const py = cqi(11.5);
  const pw = cqi(86);
  const ph = cqi(66);
  const pr = cqi(5);
  const bw = cqi(1.2);
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, pr);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(px + bw, py + bw, pw - bw * 2, ph - bw * 2, pr - bw);
  ctx.clip();
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(px, py, pw, ph);
  if (portrait) {
    const iw = pw - bw * 2;
    const ih = ph - bw * 2;
    const scale = Math.max(iw / portrait.width, ih / portrait.height);
    const dw = portrait.width * scale;
    ctx.drawImage(portrait, px + bw + (iw - dw) / 2, py + bw, dw, portrait.height * scale);
  }
  ctx.restore();
  paintSpark(ctx, cqi(86), cqi(76));

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Name, ink, tightened like the DOM face (-0.02em).
  ctx.fillStyle = COLORS.ink;
  ctx.font = `800 ${cqi(10)}px ${FONT_DISPLAY}`;
  drawSpaced(ctx, 'Hannah Sheen', DESIGN_W / 2, cqi(87.8), -cqi(10) * 0.02);

  // Role, two lines, grape.
  ctx.fillStyle = COLORS.grape;
  ctx.font = `700 ${cqi(4.1)}px ${FONT_BODY}`;
  ctx.fillText('IT Executive Assistant', DESIGN_W / 2, cqi(97.45));
  ctx.fillText('Full-stack developer', DESIGN_W / 2, cqi(102.95));

  // Honors chip: lime with an ink outline, a hard ink shadow and an ink star.
  const label = `${education.honors} · CTU ${education.year}`;
  ctx.font = `700 ${cqi(3.5)}px ${FONT_BODY}`;
  const textWidth = ctx.measureText(label).width;
  const chipBorder = cqi(0.8);
  const starSize = cqi(3.6);
  const gap = cqi(1.6);
  const padLeft = cqi(2.4);
  const padRight = cqi(3);
  const chipW = chipBorder * 2 + padLeft + starSize + gap + textWidth + padRight;
  const chipH = cqi(6.6);
  const chipX = DESIGN_W / 2 - chipW / 2;
  const chipY = cqi(109.7);
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.roundRect(chipX + cqi(0.6), chipY + cqi(0.6), chipW, chipH, chipH / 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(chipX, chipY, chipW, chipH, chipH / 2);
  ctx.fill();
  ctx.fillStyle = COLORS.lime;
  ctx.beginPath();
  ctx.roundRect(chipX + chipBorder, chipY + chipBorder, chipW - chipBorder * 2, chipH - chipBorder * 2, chipH / 2 - chipBorder);
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  starPath(ctx, chipX + chipBorder + padLeft + starSize / 2, chipY + chipH / 2, starSize / 2);
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.fillText(label, chipX + chipBorder + padLeft + starSize + gap, chipY + chipH / 2 + 1);

  // Grape band: ink rule on top, a lime star either side of the lime HS monogram.
  const bandH = cqi(16);
  const bandY = DESIGN_H - bandH;
  const bandMid = bandY + cqi(8.6);
  ctx.fillStyle = COLORS.grape;
  ctx.fillRect(0, bandY, DESIGN_W, bandH);
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, bandY, DESIGN_W, cqi(1.2));
  ctx.fillStyle = COLORS.lime;
  starPath(ctx, DESIGN_W / 2 - cqi(17), bandMid, cqi(2.08));
  ctx.fill();
  starPath(ctx, DESIGN_W / 2 + cqi(17), bandMid, cqi(2.08));
  ctx.fill();
  ctx.font = `800 ${cqi(6.4)}px ${FONT_DISPLAY}`;
  ctx.textAlign = 'center';
  drawSpaced(ctx, 'HS', DESIGN_W / 2, bandMid, cqi(6.4) * 0.08);

  ctx.restore();
}

function paintBack(ctx: CanvasRenderingContext2D, rect: UvRect): void {
  ctx.save();
  ctx.translate(rect.x, rect.y);
  ctx.scale(rect.w / DESIGN_W, rect.h / DESIGN_H);
  ctx.beginPath();
  ctx.rect(0, 0, DESIGN_W, DESIGN_H);
  ctx.clip();

  paintCardBase(ctx, COLORS.grape);
  paintSlot(ctx);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // HS monogram medallion: lime disc, ink outline, hard ink shadow.
  const cx = DESIGN_W / 2;
  const cy = cqi(27);
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.arc(cx + cqi(1.2), cy + cqi(1.2), cqi(12.6), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, cqi(12.6), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.lime;
  ctx.beginPath();
  ctx.arc(cx, cy, cqi(11.4), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.font = `800 ${cqi(9)}px ${FONT_DISPLAY}`;
  drawSpaced(ctx, 'HS', cx, cy + 2, cqi(0.8));

  // Kicker.
  ctx.fillStyle = COLORS.lime;
  ctx.font = `700 ${cqi(3.2)}px ${FONT_BODY}`;
  drawSpaced(ctx, 'EDUCATION', cx, cqi(48), cqi(0.9));

  // Honors.
  ctx.fillStyle = COLORS.lime;
  ctx.font = `800 ${cqi(13.5)}px ${FONT_DISPLAY}`;
  ctx.fillText(education.honors, cx, cqi(61));

  ctx.fillStyle = COLORS.pink;
  ctx.beginPath();
  ctx.roundRect(cx - cqi(9), cqi(70.4), cqi(18), cqi(1.2), cqi(0.6));
  ctx.fill();

  // Degree.
  ctx.fillStyle = COLORS.cream;
  ctx.font = `600 ${cqi(4.5)}px ${FONT_BODY}`;
  ctx.fillText('Bachelor of Science in', cx, cqi(80));
  ctx.fillText('Information Technology', cx, cqi(86.5));

  // School and year.
  ctx.fillStyle = COLORS.lime;
  ctx.font = `700 ${cqi(3.9)}px ${FONT_BODY}`;
  ctx.fillText(education.school, cx, cqi(97));
  ctx.fillStyle = COLORS.cream;
  ctx.font = `600 ${cqi(3.5)}px ${FONT_BODY}`;
  ctx.fillText(`Class of ${education.year}`, cx, cqi(103.4));

  // Footer: three outlined stars.
  ctx.lineWidth = cqi(0.7);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = COLORS.ink;
  [COLORS.lime, COLORS.pink, COLORS.sky].forEach((colour, i) => {
    starPath(ctx, cx + (i - 1) * cqi(9), cqi(128), cqi(3));
    ctx.fillStyle = colour;
    ctx.fill();
    ctx.stroke();
  });

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

/** Strap tile: the name and the honour, each followed by a vector star. Stars are paths, never font glyphs. */
const STRAP_WORDS = ['HANNAH SHEEN', 'CUM LAUDE 2026'] as const;
const STRAP_SPACING_EM = 0.1;
const STRAP_STAR_EM = 0.56;
const STRAP_GAP_EM = 0.5;

/** Grape strap with the phrase repeated in cream. One tile is 4 : 1, matching the strap's proportions. */
function paintStrapTexture(anisotropy: number): THREE.CanvasTexture | null {
  const W = 1536;
  const H = 384;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = COLORS.grape;
  ctx.fillRect(0, 0, W, H);

  // Woven edges: lighter on top, darker at the bottom, then the stitching.
  ctx.fillStyle = COLORS.grapeLight;
  ctx.fillRect(0, 0, W, 16);
  ctx.fillStyle = COLORS.grapeDeep;
  ctx.fillRect(0, H - 16, W, 16);
  ctx.strokeStyle = 'rgba(255, 246, 236, 0.5)';
  ctx.lineWidth = 4;
  ctx.setLineDash([22, 16]);
  ctx.beginPath();
  ctx.moveTo(0, 38);
  ctx.lineTo(W, 38);
  ctx.moveTo(0, H - 38);
  ctx.lineTo(W, H - 38);
  ctx.stroke();
  ctx.setLineDash([]);

  const wordWidth = (size: number, word: string): number => {
    ctx.font = `700 ${size}px ${FONT_DISPLAY}`;
    return Array.from(word).reduce((sum, char) => sum + ctx.measureText(char).width, 0) + size * STRAP_SPACING_EM * (word.length - 1);
  };
  // Four items and four gaps per tile (the last gap is the seam), so every repeat is whole.
  const tileWidth = (size: number): number =>
    STRAP_WORDS.reduce((sum, word) => sum + wordWidth(size, word), 0) + size * STRAP_STAR_EM * 2 + size * STRAP_GAP_EM * 4;
  const REF_SIZE = 100;
  const size = Math.min(130, (REF_SIZE * W) / tileWidth(REF_SIZE));
  const gap = size * STRAP_GAP_EM;
  const starDiameter = size * STRAP_STAR_EM;
  const widths = STRAP_WORDS.map((word) => wordWidth(size, word));
  const content = widths[0] + widths[1] + starDiameter * 2 + gap * 3;

  ctx.font = `700 ${size}px ${FONT_DISPLAY}`;
  ctx.fillStyle = COLORS.cream;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const cy = H / 2;
  let x = (W - content) / 2;
  STRAP_WORDS.forEach((word, i) => {
    drawSpaced(ctx, word, x + widths[i] / 2, cy + size * 0.04, size * STRAP_SPACING_EM);
    x += widths[i] + gap;
    starPath(ctx, x + starDiameter / 2, cy, starDiameter / 2);
    ctx.fill();
    x += starDiameter + gap;
  });

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
      {/* flat = no ACES tone mapping, so the painted strap and card keep their exact colours (ACES desaturates them). */}
      <Canvas
        flat
        frameloop={active ? 'always' : 'never'}
        camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x000000), 0);
          setGlCanvas(gl.domElement);
        }}
      >
        {/* Neutral white light, so nothing tints the card or the metal clip. */}
        <ambientLight intensity={Math.PI * 0.85} />
        <directionalLight position={[4, 6, 5]} intensity={1.4} />
        <Physics gravity={GRAVITY} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band portrait={portrait} isMobile={isMobile} onReady={notifyReady} />
        </Physics>
        <Environment blur={0.75}>
          {/* White reflections only: a key from the top right, soft fills, and a rim from the bottom left. */}
          <Lightformer intensity={9} position={[7, 5, 4]} scale={[14, 5, 1]} target={[0, 0, 0]} />
          <Lightformer intensity={3} position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={4} position={[10, 2, 8]} scale={[10, 8, 1]} target={[0, 0, 0]} />
          <Lightformer intensity={5} position={[-8, -5, 3]} scale={[14, 3, 1]} target={[0, 0, 0]} />
          <Lightformer intensity={2} position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
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
              {/* Printed face is unlit (emissive), so it shows its exact painted colours under any light; the clearcoat still catches white highlights. */}
              <meshPhysicalMaterial
                color="black"
                emissive="white"
                emissiveMap={cardMap ?? materials.base.map}
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
