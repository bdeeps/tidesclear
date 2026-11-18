// Chapter 4: why real tides are not that simple. Real oceans are basins with edges, and a basin has its own natural period.
// (1) A long inlet closed at one end rings like an organ pipe: when its natural period (4L / sqrt(g h) for a quarter-wave
//     resonator) is close to the 12.42 h tidal period, the tide is amplified. That is the idea behind the Bay of Fundy
//     (Garrett 1972, Nature). The model is the textbook frictionless-ish channel with a little damping.
// (2) In a rotating ocean the tidal wave circles a point of no tide, an amphidromic point, instead of sloshing end to end.
const G = 9.81, TAU = Math.PI * 2, T_M2 = 12.4206 * 3600;
import { THREE, M, sphere, COL, V, N, Poly, makeGauge, frame2d, clamp, lerp } from '../tides.js';

const EPS = 0.08; // damping: complex wavenumber k(1 + i·EPS)
const cc = (z) => [Math.cos(z[0]) * Math.cosh(z[1]), -Math.sin(z[0]) * Math.sinh(z[1])]; // complex cos
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
// complex amplitude ratio at position x (0 = closed head, L = mouth)
const Q = (x, L, h) => { const k = TAU / T_M2 / Math.sqrt(G * h), k1 = k * 1, k2 = k * EPS; return cdiv(cc([k1 * x, k2 * x]), cc([k1 * L, k2 * L])); };
const gainAt = (L, h) => Math.hypot(...Q(0, L * 1000, h));
const natural = (L, h) => (4 * L * 1000) / Math.sqrt(G * h) / 3600; // hours

const PRESETS = {
  fundy: { L: 320, depth: 75, mouth: 1, a0: 0.8, label: 'Bay of Fundy-like' },
  short: { L: 100, depth: 70, mouth: 1, a0: 0.8, label: 'A short inlet' },
  med: { L: 1000, depth: 1500, mouth: 0.08, a0: 0.8, label: 'Mediterranean-like' },
};

const polarGrid = (R, nr, ns) => {
  const pos = [], idx = [];
  pos.push(0, 0, 0);
  for (let i = 1; i <= nr; i++) for (let j = 0; j < ns; j++) { const r = (i / nr) * R, a = (j / ns) * TAU; pos.push(Math.cos(a) * r, 0, -Math.sin(a) * r); }
  for (let j = 0; j < ns; j++) idx.push(0, 1 + j, 1 + ((j + 1) % ns));
  for (let i = 1; i < nr; i++) for (let j = 0; j < ns; j++) { const a = 1 + (i - 1) * ns + j, b = 1 + (i - 1) * ns + ((j + 1) % ns), c = a + ns, d = b + ns; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(pos.length), 3));
  g.setIndex(idx);
  return g;
};

export default {
  id: 'basins',
  short: 'Real coasts',
  title: 'Why real tides are not that simple',
  subtitle: 'Basins ring like organ pipes, and tides circle points where nothing happens.',
  view: { pos: [0, 4.2, 12], target: [0, 1.6, 0] },
  learn: `<p>The two-bulge picture is only the <b>driver</b>. Real oceans are broken up by continents into basins, and water takes time to slosh across them. A basin has its own natural period. If it is close to the tidal period of 12 h 25 min, the tide is <b>amplified</b>, like pushing a swing in time. The <b>Bay of Fundy</b>, with the Gulf of Maine, has a natural period of about 13 hours, and has the highest tides on Earth: up to about <b>16 m</b>. In the nearly closed <b>Mediterranean</b> the tides are small, mostly a few tens of centimetres, because the Strait of Gibraltar lets in little of the Atlantic tide.</p>
    <p>The second effect is the Earth's <b>rotation</b>. In a big ocean the tidal wave cannot just slosh from side to side: it turns and circles a point called an <b>amphidromic point</b>, where the tide is almost zero, like a ripple spinning round the rim of a cup. Lines radiating from it join places that have high water at the same time. The wave turns anticlockwise in the northern hemisphere and clockwise in the south.</p>
    <p class="tip"><b>Try it:</b> in the channel, slide the length until the amber head-of-bay height peaks. Then press <b>Bay of Fundy-like</b> and <b>Mediterranean-like</b>. Switch to the amphidromic view and watch the buoy at the centre not move.</p>
    <p class="note">Round numbers for a single idealised channel and one tidal period (M2). A real bay has a shape and a shelf that change the details.</p>`,
  terms: [
    { t: 'Resonance', d: 'A big response when something is pushed at its natural period. A basin’s natural period depends on its length and depth.' },
    { t: 'Amphidromic point', d: 'A place in a rotating sea where the tide is almost nothing and the tidal wave circles around it.' },
    { t: 'Cotidal line', d: 'A line joining places that have high tide at the same moment.' },
    { t: 'Tidal range', d: 'The gap between high and low water. In the Bay of Fundy it can be about 16 m; in much of the open ocean it is under 1 m.' },
  ],
  defaults: { view: 'chan', L: 320, depth: 75, mouth: 1, a0: 0.8, north: true },
  controls: [
    { key: 'view', type: 'seg', label: 'Show', options: [{ v: 'chan', label: 'A resonating channel' }, { v: 'amph', label: 'An amphidromic point' }] },
    { key: 'preset', type: 'buttons', label: 'Channel presets', items: Object.values(PRESETS).map((p) => ({ label: p.label, act: (s) => { Object.assign(s, { L: p.L, depth: p.depth, mouth: p.mouth, a0: p.a0, view: 'chan' }); } })) },
    { key: 'L', type: 'range', label: 'Channel length', min: 20, max: 1000, step: 1, fmt: (v) => v.toFixed(0) + ' km' },
    { key: 'depth', type: 'range', label: 'Channel depth', min: 10, max: 400, step: 1, fmt: (v) => v.toFixed(0) + ' m', hint: 'Wave speed is √(g × depth): about 27 m/s at 75 m.' },
    { key: 'mouth', type: 'range', label: 'How open the mouth is', min: 0.05, max: 1, step: 0.01, fmt: (v) => (v >= 0.99 ? 'Wide open' : (v * 100).toFixed(0) + '% gets in') },
    { key: 'north', type: 'toggle', label: 'Northern hemisphere (anticlockwise)' },
  ],
  quiz: [
    { q: 'Why can the Bay of Fundy have such huge tides?', options: ['It is close to the Moon', 'Its natural period is close to the tidal period, so it resonates', 'Volcanoes heat the water', 'The Sun pulls harder there'], answer: 1, why: 'Its size and depth give it a natural period of about 13 hours, close to the 12.4-hour tide, so the tide is amplified.' },
    { q: 'What happens at an amphidromic point?', options: ['The tide is highest', 'The tide is almost zero and the wave circles round it', 'The Moon is overhead', 'The water boils'], answer: 1, why: 'In a rotating basin the tidal wave circles a central point where the water level hardly changes.' },
    { q: 'Why are Mediterranean tides small?', options: ['The Moon is weaker there', 'The sea is nearly cut off by the narrow Strait of Gibraltar and is small itself', 'There is no gravity', 'It is too salty'], answer: 1, why: 'Little of the Atlantic tide gets through the strait, and the sea is too small to make much tide of its own.' },
    { q: 'If you make a closed-end channel much shorter than its resonant length, the tide at its head will be…', options: ['Close to the tide at the mouth', 'Enormous', 'Zero', 'Reversed every minute'], answer: 0, why: 'A short channel just rises and falls with the sea at its mouth. The big gain only comes near resonance.' },
  ],
  reel: [
    { ms: 5400, caption: 'Basins ring like organ pipes. Tune a bay to the tide and it grows: the Bay of Fundy reaches about 16 metres.', set: { view: 'chan', L: 100, depth: 75, mouth: 1, a0: 0.8 }, anim: { L: [100, 320] }, view: { pos: [0, 4.2, 12], target: [0, 1.6, 0] }, spin: 0 },
    { ms: 5400, caption: 'In an ocean that spins, the tide wave circles a point where nothing moves.', set: { view: 'amph', north: true }, view: { pos: [0, 6.3, 6.6], target: [0, 0, 0] }, spin: 0.6 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    // ---- channel group
    const ch = new THREE.Group(); root.add(ch);
    const W = 9, H = 3.2, DEPTH = 2.2, HALF = W / 2, VS = 0.2, BASE = 1.2; // x from -HALF (closed head) to +HALF (mouth)
    const tank = new THREE.Mesh(new THREE.BoxGeometry(W, H, DEPTH), M.clear(0xcfe8ff, 0.07)); tank.position.y = H / 2; ch.add(tank);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(W, 0.3, DEPTH), M.matte(0x3a3226)); bed.position.y = -0.15; ch.add(bed);
    const wallHead = new THREE.Mesh(new THREE.BoxGeometry(0.12, H, DEPTH + 0.1), M.matte(0x575f70)); wallHead.position.set(-HALF - 0.06, H / 2, 0); ch.add(wallHead);
    const NX = 160;
    const sg = new THREE.PlaneGeometry(W, DEPTH, NX, 1); sg.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: 0x4aa3ff, transparent: true, opacity: 0.7, roughness: 0.15, side: THREE.DoubleSide })); water.position.y = BASE; ch.add(water);
    // body of water below the surface (a ribbon of sides): draw as a second plane at the front using the same heights
    const side = new THREE.Mesh(new THREE.PlaneGeometry(W, 1, NX, 1), new THREE.MeshStandardMaterial({ color: 0x2f7fe0, transparent: true, opacity: 0.45, side: THREE.DoubleSide })); side.position.z = DEPTH / 2; ch.add(side);
    const env = new Poly(stage, { color: COL.moon, width: 2, opacity: 0.95, closed: false, max: NX + 1 }), env2 = new Poly(stage, { color: COL.moon, width: 2, opacity: 0.95, closed: false, max: NX + 1 });
    env.obj.position.z = DEPTH / 2 + 0.02; env2.obj.position.z = DEPTH / 2 + 0.02; ch.add(env.obj, env2.obj);
    const mid = new Poly(stage, { color: 0xffffff, width: 1, opacity: 0.4, closed: false, max: 2 }); mid.set([V(-HALF, BASE, DEPTH / 2 + 0.02), V(HALF, BASE, DEPTH / 2 + 0.02)]); ch.add(mid.obj);
    stage.label('Closed head', [-HALF, H + 0.2, 0], ch);
    stage.label('Open sea', [HALF, H + 0.2, 0], ch);
    const headBuoy = sphere(0.14, M.glow(COL.moon), 12); ch.add(headBuoy);
    const mouthBuoy = sphere(0.14, M.glow(0xffffff), 12); ch.add(mouthBuoy);
    // resonance curve
    var curve = makeGauge(stage, 4.6, 2.2, (g, w, h) => {
      const st = curve?.st; if (!st) return;
      const f = frame2d(g, w, h, { title: 'Tide at the head vs channel length', yLabel: 'amplitude, m' });
      const X = (L) => f.x0 + ((L - 20) / 980) * (f.x1 - f.x0); const top = 8; const Y = (v) => f.y0 - (Math.min(v, top) / top) * (f.y0 - f.y1);
      g.strokeStyle = '#2a3042'; g.fillStyle = '#7f8aa3'; g.font = '13px system-ui'; g.textAlign = 'right'; g.lineWidth = 1;
      for (const v of [0, 2, 4, 6, 8]) { g.beginPath(); g.moveTo(f.x0, Y(v)); g.lineTo(f.x1, Y(v)); g.stroke(); g.fillText(v, f.x0 - 6, Y(v) + 4); }
      g.textAlign = 'center'; for (const L of [20, 250, 500, 750, 1000]) g.fillText(L + ' km', X(L), f.y0 + 17);
      g.strokeStyle = '#c49bff'; g.lineWidth = 3; g.beginPath();
      for (let L = 20; L <= 1000; L += 4) { const v = st.a0 * st.mouth * gainAt(L, st.depth); L === 20 ? g.moveTo(X(L), Y(v)) : g.lineTo(X(L), Y(v)); }
      g.stroke();
      const v = st.a0 * st.mouth * gainAt(st.L, st.depth);
      g.fillStyle = '#ffb547'; g.beginPath(); g.arc(X(st.L), Y(v), 7, 0, TAU); g.fill();
    });
    curve.position.set(2.2, 4.6, -1); ch.add(curve);

    // ---- amphidromic group
    const am = new THREE.Group(); root.add(am);
    const R = 3.4, grid = polarGrid(R, 28, 96);
    const surf = new THREE.Mesh(grid, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, envMapIntensity: 0.25, side: THREE.DoubleSide })); am.add(surf);
    const ringLine = new Poly(stage, { color: 0xffffff, width: 2, opacity: 0.7, max: 96 }); am.add(ringLine.obj);
    const spokeMat = stage.lineMaterial({ color: 0xffb547, linewidth: 1.5, transparent: true, opacity: 0.7 }); spokeMat.depthTest = false;
    const spokes = new Poly(stage, { color: 0xffb547, width: 1.5, opacity: 0.8, closed: false, max: 12, pairs: true }); spokes.obj.material.depthTest = false; am.add(spokes.obj);
    const cBuoy = sphere(0.14, M.glow(0xffffff), 12), rBuoy = sphere(0.14, M.glow(COL.moon), 12); am.add(cBuoy, rBuoy);
    stage.label('Amphidromic point: no tide', [0, 0.6, 0], cBuoy, 'hot');
    stage.label('Rim: biggest tide', [0, 0.5, 0], rBuoy, 'hot');
    const A = 0.6;
    let clock = 0, lastMode = s.view, lastKey = '';
    const colAt = (z, c) => { const k = clamp((z / A + 1) / 2, 0, 1); c.setRGB(lerp(0.02, 0.5, k * k * k), lerp(0.08, 0.9, k * k), lerp(0.25, 1, k)); };
    const cc3 = new THREE.Color();
    const vp = grid.attributes.position, vc = grid.attributes.color;
    const nsp = 12;
    spokes.set(Array.from({ length: nsp * 2 }, () => V()));

    return {
      update(dt, st) {
        clock += dt;
        if (st.view !== lastMode) { lastMode = st.view; stage.setView(st.view === 'chan' ? [0, 4.2, 12] : [0, 6.3, 6.6], st.view === 'chan' ? [0, 1.6, 0] : [0, 0, 0], 1); }
        ch.visible = st.view === 'chan'; am.visible = st.view === 'amph';
        const wt = clock * TAU / 5; // one tidal cycle per 5 s on screen
        if (ch.visible) {
          const L = st.L * 1000, p = sg.attributes.position, sp = side.geometry.attributes.position;
          const mk = st.a0 * st.mouth;
          const top = [], bot = [];
          for (let i = 0; i <= NX; i++) {
            const u = i / NX, x = u * L; // from head (0) to mouth (L): screen x = -HALF + u*W
            const q = Q(x, L, st.depth), z = mk * (q[0] * Math.cos(wt) + q[1] * Math.sin(wt)), amp = mk * Math.hypot(q[0], q[1]);
            const y = z * VS;
            // plane vertices: row 0 (z=-D/2) then row 1 (z=+D/2) for PlaneGeometry(NX,1) rotated flat
            p.setY(i, y); p.setY(i + NX + 1, y);
            sp.setY(i, BASE + y); sp.setY(i + NX + 1, 0); // side ribbon from the surface down to the seabed
            top.push(V(-HALF + u * W, BASE + amp * VS, 0)); bot.push(V(-HALF + u * W, BASE - amp * VS, 0));
          }
          p.needsUpdate = true; sp.needsUpdate = true; sg.computeVertexNormals();
          env.set(top.map((v) => v.setZ(0))); env2.set(bot.map((v) => v.setZ(0)));
          const q0 = Q(0, L, st.depth), qL = Q(L, L, st.depth);
          headBuoy.position.set(-HALF + 0.25, BASE + mk * (q0[0] * Math.cos(wt) + q0[1] * Math.sin(wt)) * VS, 0);
          mouthBuoy.position.set(HALF - 0.25, BASE + mk * (qL[0] * Math.cos(wt) + qL[1] * Math.sin(wt)) * VS, 0);
          curve.faceCamera();
          const key = [st.L, st.depth, st.mouth, st.a0].join();
          if (key !== lastKey) { lastKey = key; curve.st = { L: st.L, depth: st.depth, mouth: st.mouth, a0: st.a0 }; curve.redraw(); }
        } else {
          const dir = st.north ? 1 : -1, ns = 96, nr = 28;
          const z = (r, a) => A * Math.sin(Math.min(1, r / R) * Math.PI / 2) * Math.cos(wt - dir * a);
          for (let i = 0; i < vp.count; i++) {
            const x = vp.getX(i), zz = vp.getZ(i), r = Math.hypot(x, zz), a = Math.atan2(-zz, x), h = z(r, a);
            vp.setY(i, h); colAt(h, cc3); vc.setXYZ(i, cc3.r, cc3.g, cc3.b);
          }
          vp.needsUpdate = true; vc.needsUpdate = true; grid.computeVertexNormals();
          cBuoy.position.set(0, 0.05, 0);
          rBuoy.position.set(R * 0.92, z(R * 0.92, 0), 0);
          const rim = []; for (let i = 0; i < ns; i++) { const a = (i / ns) * TAU; rim.push(V(Math.cos(a) * R, z(R, a) + 0.02, -Math.sin(a) * R)); } ringLine.set(rim);
          const sp = []; for (let k = 0; k < nsp; k++) { const a = dir * ((k / nsp) * TAU); sp.push(V(0, 0.04, 0), V(Math.cos(a) * R, 0.04, -Math.sin(a) * R)); }
          spokes.set(sp);
        }
      },
      readout(st) {
        if (st.view === 'amph') return `<div class="big">Tide circles a still point</div><p class="r-say">Spokes join places with high water at the same time, an hour apart. The wave turns ${st.north ? 'anticlockwise (north)' : 'clockwise (south)'}.</p><div class="row"><span>At the centre</span><b>almost no tide</b></div><div class="row"><span>At the rim</span><b>biggest tide</b></div>`;
        const L = st.L, h = st.depth, T0 = natural(L, h), g = gainAt(L, h), a = st.a0 * st.mouth * g;
        const near = Math.abs(T0 - 12.42) < 1.4;
        return `<div class="big">${near ? 'Near resonance' : T0 < 12.42 ? 'Too short to ring' : 'Too long to ring'}</div>
          <p class="r-say">${near ? 'The channel’s own period matches the tide, so each rise and fall adds to the last.' : 'The sea’s push comes at the wrong rhythm for this channel.'}</p>
          <div class="row"><span>Channel’s natural period</span><b>${T0.toFixed(1)} h</b></div>
          <div class="row"><span>Tide period (M2)</span><b>12.4 h</b></div>
          <div class="row"><span>Tide let in at the mouth</span><b>±${(st.a0 * st.mouth).toFixed(2)} m</b></div>
          <div class="row"><span>Amplification at the head</span><b>×${g.toFixed(1)}</b></div>
          <div class="row"><span>Range at the head (M2)</span><b>${(2 * a).toFixed(1)} m</b></div>`;
      },
    };
  },
};
