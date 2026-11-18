// Shared parts for TidesClear: the equilibrium-tide maths, an Earth with a deformable ocean shell,
// a Moon, fat rings, and a billboard gauge you can draw a graph on.
// All the numbers below are textbook values for the *equilibrium* tide (the tide a frictionless ocean
// covering the whole Earth would make). Real tides are shaped by coasts, depth and resonance (chapter 4).
import { THREE, M, sphere, clamp, lerp, smooth, canvasTexture } from './kit.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';

export { THREE, M, sphere, clamp, lerp, smooth };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const COL = { moon: 0xffb547, sun: 0x8ef0ff, ocean: 0x3d8bff, lime: 0xa3e635, coral: 0xff7a59, violet: 0xc49bff, white: 0xe9eef8, dim: 0x8f9bb5 };
export const HEX = (c) => '#' + c.toString(16).padStart(6, '0');
const TAU = Math.PI * 2;

// ---- numbers (SI) ----
export const N = {
  earthR: 6.371e6, // m
  moonD: 384400, // km, mean distance
  moonDmin: 356500, moonDmax: 406700, // km, perigee and apogee (extremes)
  moonAmp: 0.358, // m: equilibrium lunar tide at the sub-lunar point at mean distance, (M/E)(R/D)^3 R
  sunAmp: 0.164, // m: the same for the Sun
  synodic: 29.530589, // days, new moon to new moon
  sidereal: 27.321661, // days, Moon against the stars
  lunarDayH: 24 + 50.47 / 60, // hours between Moon crossings of one meridian
};
export const SUN_RATIO = N.sunAmp / N.moonAmp; // ≈ 0.46

// Degree-2 tidal shape: +1 under and opposite the body, -1/2 around the middle.
export const P2 = (c) => (3 * c * c - 1) / 2;

// A unit vector for azimuth a (radians, turning the same way the Earth spins) and declination d (above the equator).
export const dirAz = (a, d = 0, out = new THREE.Vector3()) => out.set(Math.cos(d) * Math.cos(a), Math.sin(d), -Math.cos(d) * Math.sin(a));

// h:mm from hours
export const hm = (h) => { h = ((h % 24) + 24) % 24; let m = Math.round(h * 60); const hh = Math.floor(m / 60) % 24; m %= 60; return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };
export const dur = (h) => { const m = Math.round(h * 60); return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };
export const m2 = (v) => (Math.abs(v) < 1 ? (v * 100).toFixed(0) + ' cm' : v.toFixed(2) + ' m');

// Range (highest minus lowest water level) of Moon + Sun equilibrium tides around the equator.
// phase = angle between Sun and Moon directions as seen from Earth (0 new, π full), mean distance.
export function rangeAt(phase, moonScale = 1, sunOn = true) {
  let lo = 1e9, hi = -1e9;
  for (let k = 0; k < 360; k++) {
    const x = (k / 360) * TAU;
    const z = N.moonAmp * moonScale * P2(Math.cos(x - phase)) + (sunOn ? N.sunAmp * P2(Math.cos(x)) : 0);
    lo = Math.min(lo, z); hi = Math.max(hi, z);
  }
  return hi - lo;
}

// ---------------------------------------------------------------- Earth texture
const LAND = [
  [[-168, 66], [-140, 70], [-95, 72], [-80, 70], [-62, 60], [-55, 50], [-67, 44], [-76, 35], [-81, 25], [-97, 26], [-97, 18], [-88, 16], [-82, 9], [-92, 14], [-105, 20], [-115, 30], [-124, 40], [-125, 49], [-140, 60], [-165, 60]],
  [[-80, 9], [-62, 10], [-50, 0], [-35, -6], [-40, -22], [-58, -38], [-66, -46], [-70, -54], [-74, -50], [-72, -30], [-80, -6]],
  [[-17, 21], [-17, 14], [-8, 5], [9, 4], [13, -12], [14, -28], [20, -35], [32, -28], [40, -15], [51, 11], [43, 12], [35, 28], [32, 31], [10, 37], [-6, 36]],
  [[-10, 36], [-9, 43], [-2, 48], [5, 52], [10, 58], [25, 70], [60, 70], [100, 77], [140, 72], [180, 68], [170, 60], [140, 52], [130, 35], [122, 30], [120, 22], [108, 12], [100, 2], [98, 15], [88, 22], [80, 10], [73, 20], [60, 25], [50, 28], [45, 15], [35, 28], [36, 36], [27, 37], [20, 40], [12, 44], [3, 43]],
  [[114, -22], [130, -12], [142, -11], [153, -27], [147, -39], [135, -34], [115, -34]],
  [[-55, 60], [-20, 70], [-22, 83], [-60, 82], [-72, 76]],
  [[-180, -72], [180, -72], [180, -90], [-180, -90]],
];
export function earthTexture() {
  return canvasTexture(1024, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1d4f86'); gr.addColorStop(0.5, '#1f6aa8'); gr.addColorStop(1, '#1d4f86');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#4c8a4f'; g.strokeStyle = '#7fb36f'; g.lineWidth = 2; g.lineJoin = 'round';
    for (const poly of LAND) {
      g.beginPath();
      poly.forEach(([lo, la], i) => { const x = ((lo + 180) / 360) * w, y = ((90 - la) / 180) * h; i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.closePath(); g.fill(); g.stroke();
    }
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1;
    for (let lo = -180; lo <= 180; lo += 30) { const x = ((lo + 180) / 360) * w; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let la = -60; la <= 60; la += 30) { const y = ((90 - la) / 180) * h; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  }).tex;
}

// A planet: opaque land sphere (rotates with `.spin`) plus a translucent ocean shell that does NOT rotate with it.
// shell.set(base, [{ dir, amp }]) sets the ocean's radius in each direction to base + Σ amp·P2(cos ψ), all in Earth radii.
export function makeEarth(R = 1.5, { seg = 96 } = {}) {
  const g = new THREE.Group(), spin = new THREE.Group();
  const land = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 32), new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.8 }));
  land.castShadow = true;
  spin.add(land);
  const geo = new THREE.SphereGeometry(1, seg, seg / 2);
  const unit = Float32Array.from(geo.attributes.position.array);
  const mat = new THREE.MeshStandardMaterial({ color: 0x4aa3ff, transparent: true, opacity: 0.55, roughness: 0.2, metalness: 0, depthWrite: false });
  const shell = new THREE.Mesh(geo, mat);
  shell.renderOrder = 2;
  let key = '';
  const dirs = [new THREE.Vector3(), new THREE.Vector3()];
  shell.set = (base, terms) => {
    const k = base + '|' + terms.map((t) => t.amp.toFixed(5) + t.dir.x.toFixed(4) + t.dir.y.toFixed(4) + t.dir.z.toFixed(4)).join('|');
    if (k === key) return; key = k;
    const p = geo.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      const x = unit[i], y = unit[i + 1], z = unit[i + 2];
      let r = base;
      for (const t of terms) r += t.amp * P2(x * t.dir.x + y * t.dir.y + z * t.dir.z);
      p[i] = x * r * R; p[i + 1] = y * r * R; p[i + 2] = z * r * R;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
  };
  void dirs;
  g.add(spin, shell);
  g.spin = spin; g.shell = shell; g.land = land; g.R = R;
  return g;
}

// A grey Moon with a dark patch marking its near side (so you can see whether it spins).
export function makeMoon(r = 0.4) {
  const tex = canvasTexture(256, 128, (g, w, h) => {
    g.fillStyle = '#b9bcc4'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(90,94,104,${0.08 + (i % 5) * 0.03})`; g.beginPath(); g.arc((i * 97) % w, 12 + ((i * 53) % (h - 24)), 2 + (i % 4) * 2, 0, TAU); g.fill(); }
    g.fillStyle = '#6d727e';
    for (const [x, y, rx, ry] of [[w * 0.5, h * 0.4, 30, 18], [w * 0.57, h * 0.6, 22, 14], [w * 0.44, h * 0.62, 16, 10], [w * 0.62, h * 0.38, 14, 12]]) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); }
  }).tex;
  const m = sphere(r, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }), 40);
  return m; // the near-side patch faces +x (u = 0.5) when rotation is zero… see ringFace below
}

// Fat rings / polylines (screen-space width). set(points[]) rebuilds the segments.
export class Poly {
  constructor(stage, { color = 0xffffff, width = 2, opacity = 1, closed = true, max = 400, pairs = false } = {}) {
    this.closed = closed; this.pairs = pairs; this.max = max;
    this.geo = new LineSegmentsGeometry();
    this.geo.setPositions(new Float32Array(max * 6).fill(0.0001));
    this.mat = stage.lineMaterial({ color, linewidth: width, transparent: true, opacity, worldUnits: false });
    this.obj = new LineSegments2(this.geo, this.mat);
    this.obj.frustumCulled = false;
    this.arr = new Float32Array(max * 6);
  }
  set(pts) {
    const n = Math.min(this.max, this.pairs ? pts.length >> 1 : this.closed ? pts.length : pts.length - 1), a = this.arr;
    for (let i = 0; i < n; i++) {
      const p = this.pairs ? pts[2 * i] : pts[i], q = this.pairs ? pts[2 * i + 1] : pts[(i + 1) % pts.length];
      a.set([p.x, p.y, p.z, q.x, q.y, q.z], i * 6);
    }
    const buf = this.geo.attributes.instanceStart.data; buf.array.set(a); buf.needsUpdate = true;
    this.geo.instanceCount = n;
  }
}

// A billboard you can draw a 2D graph on, drawn live. draw(ctx, w, h) is called whenever you call redraw().
export function makeGauge(stage, width, height, draw, px = 640) {
  const W = px, H = Math.round((px * height) / width);
  const { tex, redraw } = canvasTexture(W, H, (g, w, h, ...a) => draw(g, w, h, ...a));
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide }));
  mesh.renderOrder = 5;
  mesh.faceCamera = () => mesh.quaternion.copy(stage.camera.quaternion);
  mesh.redraw = redraw;
  return mesh;
}

// small canvas helpers for graphs
export function frame2d(g, w, h, { pad = [46, 18, 26, 14], title = '', yLabel = '' } = {}) {
  const [l, t, b, r] = [pad[0], pad[1], pad[2], pad[3]];
  g.fillStyle = 'rgba(7,8,12,0.82)'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
  g.fillStyle = '#9aa3b8'; g.font = '600 15px system-ui, sans-serif'; g.textAlign = 'left';
  if (title) g.fillText(title, l, 15);
  g.textAlign = 'right'; if (yLabel) g.fillText(yLabel, w - r, 15);
  return { x0: l, x1: w - r, y0: h - b, y1: t + 6 };
}
