// Procedural canvas lightning — recursive midpoint displacement + shadowBlur glow
import { useRef, useEffect } from 'react';

interface Pt { x: number; y: number; }
interface Seg { pts: Pt[]; width: number; alpha: number; }

// Recursive midpoint displacement — produces organic fractal lightning
function subdivide(
  out: Pt[], x1: number, y1: number, x2: number, y2: number,
  spread: number, depth: number,
) {
  if (depth === 0 || spread < 1.2) { out.push({ x: x2, y: y2 }); return; }
  const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * spread;
  const my = (y1 + y2) / 2 + (Math.random() - 0.5) * spread * 0.18;
  subdivide(out, x1, y1, mx, my, spread * 0.56, depth - 1);
  subdivide(out, mx, my, x2, y2, spread * 0.56, depth - 1);
}

function buildBolt(x1: number, y1: number, x2: number, y2: number, spread: number): Seg[] {
  const segs: Seg[] = [];

  // Main channel
  const main: Pt[] = [{ x: x1, y: y1 }];
  subdivide(main, x1, y1, x2, y2, spread, 9);
  segs.push({ pts: main, width: 2.2, alpha: 1 });

  // Branches
  const step = Math.max(2, Math.floor(main.length / 12));
  for (let i = step; i < main.length - step; i += step) {
    if (Math.random() > 0.45) continue;
    const p = main[i];
    const baseAng = Math.atan2(y2 - y1, x2 - x1);
    const side = Math.random() > 0.5 ? 1 : -1;
    const ang = baseAng + side * (0.35 + Math.random() * 0.65);
    const len = 55 + Math.random() * 110;
    const bx = p.x + Math.cos(ang) * len;
    const by = p.y + Math.sin(ang) * len;
    const br: Pt[] = [p];
    subdivide(br, p.x, p.y, bx, by, spread * 0.38, 6);
    segs.push({ pts: br, width: 1.1, alpha: 0.72 });

    // Sub-branch
    if (br.length > 4 && Math.random() > 0.6) {
      const mid = br[Math.floor(br.length * 0.45)];
      const sang = ang + (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.5);
      const slen = 28 + Math.random() * 55;
      const sb: Pt[] = [mid];
      subdivide(sb, mid.x, mid.y, mid.x + Math.cos(sang) * slen, mid.y + Math.sin(sang) * slen, spread * 0.18, 4);
      segs.push({ pts: sb, width: 0.6, alpha: 0.48 });
    }
  }

  return segs;
}

function paintBolt(
  ctx: CanvasRenderingContext2D,
  segs: Seg[],
  brightness: number,
  atmoColor: string,
  glowColor: string,
) {
  const tracePath = (pts: Pt[]) => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  };

  segs.forEach(({ pts, width, alpha }) => {
    if (pts.length < 2) return;
    const b = brightness * alpha;

    // Wide atmospheric glow
    ctx.save();
    tracePath(pts);
    ctx.strokeStyle = atmoColor;
    ctx.lineWidth = width * 9;
    ctx.globalAlpha = 0.22 * b;
    ctx.shadowBlur = 30;
    ctx.shadowColor = atmoColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // Tight inner glow
    ctx.save();
    tracePath(pts);
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = width * 3.5;
    ctx.globalAlpha = 0.55 * b;
    ctx.shadowBlur = 12;
    ctx.shadowColor = glowColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // Bright core
    ctx.save();
    tracePath(pts);
    ctx.strokeStyle = `rgba(225, 240, 255, ${0.96 * b})`;
    ctx.lineWidth = width * 0.85;
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#FFFFFF';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  });
}

// Bolt slot — each fires on its own schedule
interface Slot {
  x1p: number; y1p: number; x2p: number; y2p: number; // % of canvas
  spread: number;
  atmo: string; glow: string;
  interval: number; jitter: number; // ms
  flashDur: number; fadeDur: number;
  // runtime state
  segs: Seg[];
  state: 'idle' | 'flash' | 'fade';
  stateStart: number;
  nextFire: number;
}

const SLOTS: Omit<Slot, 'segs'|'state'|'stateStart'|'nextFire'>[] = [
  { x1p:75, y1p:0,  x2p:82, y2p:90, spread:105, atmo:'#1E3A8A', glow:'#60A5FA', interval:6500,  jitter:4000, flashDur:90,  fadeDur:220 },
  { x1p:5,  y1p:20, x2p:18, y2p:100,spread:85,  atmo:'#4C1D95', glow:'#A78BFA', interval:9000,  jitter:5000, flashDur:80,  fadeDur:200 },
  { x1p:12, y1p:0,  x2p:68, y2p:8,  spread:60,  atmo:'#0C4A6E', glow:'#38BDF8', interval:5500,  jitter:3000, flashDur:100, fadeDur:180 },
  { x1p:88, y1p:25, x2p:65, y2p:95, spread:80,  atmo:'#1E3A8A', glow:'#3B82F6', interval:8000,  jitter:4500, flashDur:75,  fadeDur:210 },
  { x1p:42, y1p:0,  x2p:52, y2p:100,spread:115, atmo:'#3B0764', glow:'#8B5CF6', interval:12000, jitter:5000, flashDur:110, fadeDur:280 },
  { x1p:60, y1p:0,  x2p:28, y2p:55, spread:70,  atmo:'#0C4A6E', glow:'#22D3EE', interval:7000,  jitter:3500, flashDur:85,  fadeDur:190 },
  { x1p:22, y1p:0,  x2p:55, y2p:12, spread:65,  atmo:'#1E3A8A', glow:'#93C5FD', interval:8500,  jitter:4000, flashDur:90,  fadeDur:200 },
];

export function ElectricLightning() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const slotsRef  = useRef<Slot[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    // Init slots
    const now = Date.now();
    slotsRef.current = SLOTS.map((s, i) => ({
      ...s,
      segs: [],
      state: 'idle' as const,
      stateStart: 0,
      nextFire: now + (i * 900) + Math.random() * s.jitter, // stagger starts
    }));

    const frame = () => {
      const t   = Date.now();
      const W   = canvas.width;
      const H   = canvas.height;
      ctx.clearRect(0, 0, W, H);

      slotsRef.current.forEach(slot => {
        // State machine
        if (slot.state === 'idle' && t >= slot.nextFire) {
          const x1 = W * slot.x1p / 100;
          const y1 = H * slot.y1p / 100;
          const x2 = W * slot.x2p / 100;
          const y2 = H * slot.y2p / 100;
          slot.segs     = buildBolt(x1, y1, x2, y2, slot.spread);
          slot.state    = 'flash';
          slot.stateStart = t;
        } else if (slot.state === 'flash' && t - slot.stateStart >= slot.flashDur) {
          slot.state    = 'fade';
          slot.stateStart = t;
        } else if (slot.state === 'fade' && t - slot.stateStart >= slot.fadeDur) {
          slot.state    = 'idle';
          slot.nextFire = t + slot.interval + (Math.random() - 0.5) * slot.jitter;
          slot.segs     = [];
        }

        if (slot.segs.length === 0) return;

        let bright = 1;
        if (slot.state === 'fade') {
          bright = 1 - (t - slot.stateStart) / slot.fadeDur;
          bright = Math.max(0, bright);
          // ease out
          bright = bright * bright;
        }

        paintBolt(ctx, slot.segs, bright, slot.atmo, slot.glow);

        // Second strike (random double-flash)
        if (slot.state === 'flash' && t - slot.stateStart > slot.flashDur * 0.55 && Math.random() < 0.004) {
          slot.segs = buildBolt(
            W * slot.x1p / 100, H * slot.y1p / 100,
            W * slot.x2p / 100, H * slot.y2p / 100,
            slot.spread,
          );
        }
      });

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position:'fixed', inset:0, pointerEvents:'none', userSelect:'none', zIndex:0 }}
    />
  );
}
