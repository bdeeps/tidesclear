// Chapter 5: how tides are actually predicted. Instead of solving the ocean, tide tables add up a handful of
// cosine waves ("constituents"), each with its own period set by astronomy, and an amplitude and phase fitted
// to years of measurements at one port. Lord Kelvin's harmonic method (1860s-70s) did the sum with a machine.
// The speeds below are the standard values for the five main constituents. The preset amplitudes are
// illustrative, not any real port's constants.
import { THREE, M, sphere, COL, HEX, V, N, hm, makeGauge, frame2d, clamp } from '../tides.js';

const TAU = Math.PI * 2;
export const CONS = [
  { id: 'M2', name: 'Principal lunar', speed: 28.9841042, col: 0xffb547, say: 'The Moon’s main semi-diurnal tide. Period 12 h 25 min.' },
  { id: 'S2', name: 'Principal solar', speed: 30, col: 0x8ef0ff, say: 'The Sun’s semi-diurnal tide. Period exactly 12 h.' },
  { id: 'N2', name: 'Larger lunar elliptic', speed: 28.4397295, col: 0xc49bff, say: 'The Moon’s changing distance: bigger at perigee. Period 12 h 40 min.' },
  { id: 'K1', name: 'Lunisolar diurnal', speed: 15.0410686, col: 0xa3e635, say: 'The Moon’s and Sun’s declination. Period 23 h 56 min.' },
  { id: 'O1', name: 'Principal lunar diurnal', speed: 13.9430356, col: 0xff7a59, say: 'The Moon’s declination. Period 25 h 49 min.' },
];
const PRE = {
  semi: { label: 'Semi-diurnal coast', v: [[1, 0], [0.34, 40], [0.2, 330], [0.12, 120], [0.08, 200]] },
  mixed: { label: 'Mixed coast', v: [[0.6, 0], [0.2, 40], [0.12, 330], [0.4, 120], [0.3, 200]] },
  diurnal: { label: 'Diurnal coast', v: [[0.08, 0], [0.03, 40], [0.02, 330], [0.36, 120], [0.3, 200]] },
  moon: { label: 'Only M2', v: [[1, 0], [0, 0], [0, 0], [0, 0], [0, 0]] },
};
const defaults = { t: 48, rate: 3, win: 3 };
CONS.forEach((c, i) => { defaults['a' + c.id] = PRE.semi.v[i][0]; defaults['p' + c.id] = PRE.semi.v[i][1]; });
export const levelAt = (s, t) => CONS.reduce((z, c) => z + s['a' + c.id] * Math.cos(((c.speed * t - s['p' + c.id]) * Math.PI) / 180), 0);

export default {
  id: 'predictor',
  short: 'The tide predictor',
  title: 'How tide tables are made',
  subtitle: 'Add a few waves, one for each astronomical rhythm, and you get a tide curve.',
  view: { pos: [0, 2.8, 12], target: [0, 2.2, 0] },
  learn: `<p>Nobody predicts tides by solving the whole ocean. The method since the 19th century is <b>harmonic analysis</b>. The motions of the Moon and Sun are known very well, and each makes tidal waves at set periods, called <b>constituents</b>. At a port you measure the sea level for a year or more and work out how big each wave is (its <b>amplitude</b>) and when it peaks (its <b>phase</b>). Then the tide for any future time is just the <b>sum of the waves</b>.</p>
    <p>Five do most of the work: <b>M2</b> (the Moon, 12 h 25 min), <b>S2</b> (the Sun, 12 h), <b>N2</b> (the Moon's changing distance), <b>K1</b> and <b>O1</b> (the Moon's and Sun's declination, about a day). M2 and S2 drift in and out of step every 14.8 days: that is the <b>spring-neap cycle</b>. K1 and O1 make the day's two highs unequal. Real ports use dozens of constituents, which is why the amplitudes differ so much from one port to the next.</p>
    <p>Lord Kelvin built tide-predicting machines in the 1870s that added the waves with pulleys and wires and drew the curve on paper. They were used for about a century.</p>
    <p class="tip"><b>Try it:</b> press the presets, then turn a single wave down to zero and see what disappears. Widen the graph to a month and look for springs and neaps.</p>
    <p class="note">The amplitudes in the presets are made up to show typical patterns, not the constants of any real port.</p>`,
  terms: [
    { t: 'Constituent', d: 'One of the cosine waves of a tide, with a fixed period set by the motion of the Moon or Sun.' },
    { t: 'Amplitude and phase', d: 'How high the wave rises above mean level, and when it peaks. They are fitted to each port.' },
    { t: 'Harmonic analysis', d: 'Finding the amplitude and phase of each constituent from a long record of sea level.' },
    { t: 'Form factor', d: '(K1 + O1) / (M2 + S2). Under 0.25 means semi-diurnal; over 3 means diurnal; in between, mixed.' },
  ],
  defaults,
  controls: [
    { key: 'pre', type: 'buttons', label: 'Typical coasts', items: Object.values(PRE).map((p) => ({ label: p.label, act: (s) => { CONS.forEach((c, i) => { s['a' + c.id] = p.v[i][0]; s['p' + c.id] = p.v[i][1]; }); } })) },
    { key: 'rate', type: 'seg', label: 'Time', options: [{ v: 0, label: 'Paused' }, { v: 3, label: '3 h/s' }, { v: 12, label: '12 h/s' }, { v: 48, label: '2 days/s' }] },
    { key: 'win', type: 'seg', label: 'Graph shows', options: [{ v: 3, label: '3 days' }, { v: 15, label: '15 days' }, { v: 30, label: '1 month' }] },
    { key: 't', type: 'range', label: 'Clock', min: 0, max: 1440, step: 0.1, fmt: (v) => `Day ${Math.floor(v / 24) + 1}, ${hm(v)}` },
    ...CONS.flatMap((c) => [
      { key: 'a' + c.id, type: 'range', label: `${c.id} amplitude`, min: 0, max: 1.5, step: 0.01, fmt: (v) => v.toFixed(2) + ' m', hint: c.say },
      { key: 'p' + c.id, type: 'range', label: `${c.id} phase`, min: 0, max: 360, step: 1, fmt: (v) => v.toFixed(0) + '°' },
    ]),
  ],
  quiz: [
    { q: 'How are tide tables for a port usually made?', options: ['By simulating the whole ocean', 'By adding a set of cosine waves fitted to past measurements', 'By watching the Moon', 'By averaging last year'], answer: 1, why: 'Harmonic analysis finds each constituent’s amplitude and phase from a long record. The prediction is their sum.' },
    { q: 'Which two constituents beat against each other to give springs and neaps?', options: ['M2 and S2', 'K1 and O1', 'N2 and K1', 'M2 and K1'], answer: 0, why: 'M2 (12.42 h) and S2 (12 h) drift in and out of step, repeating every 14.8 days.' },
    { q: 'A port has large K1 and O1 and tiny M2 and S2. Its tide is…', options: ['Diurnal: about one high a day', 'Semi-diurnal', 'No tide', 'Faster than 12 h'], answer: 0, why: 'K1 and O1 have periods near one day, so the form factor is high and the tide is diurnal.' },
    { q: 'Why are the constituents’ periods known so exactly?', options: ['They come from the motions of the Moon and Sun', 'They are measured fresh each year', 'They are guessed', 'They are set by law'], answer: 0, why: 'Each period comes from a known combination of the Earth’s spin and the orbits of the Moon and Sun, so only amplitude and phase need fitting to a port.' },
  ],
  reel: [
    { ms: 5400, caption: 'Tide tables add up a few waves, each with a period set by the Moon or Sun. M2 and S2 beating makes springs and neaps.', set: { t: 0, rate: 0, win: 3, ...Object.fromEntries(CONS.flatMap((c, i) => [['a' + c.id, PRE.semi.v[i][0]], ['p' + c.id, PRE.semi.v[i][1]]])) }, anim: { t: [0, 48] }, view: { pos: [0, 2.8, 12], target: [0, 2.2, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    // a little harbour on the left: quay wall, pier post with ticks, water that follows the sum
    const VS = 0.55, BASE = 1.4, HX = -5.2;
    const harbour = new THREE.Group(); harbour.position.set(HX, 0, 0); root.add(harbour);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 2.4), M.matte(0x3a3226)); bed.position.y = -0.15; harbour.add(bed);
    const quay = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 2.4), M.matte(0x575f70)); quay.position.set(-1.0, 1.6, 0); harbour.add(quay);
    const waterG = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 2.2), new THREE.MeshStandardMaterial({ color: 0x4aa3ff, transparent: true, opacity: 0.6, roughness: 0.15 })); harbour.add(waterG);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.2, 0.1), M.matte(0xbfc6d6)); post.position.set(-0.7, 1.6, 0.9); harbour.add(post);
    for (let m = -2; m <= 2; m++) { const tick = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.12), M.glow(0xffffff)); tick.position.set(-0.55, BASE + m * VS, 0.9); harbour.add(tick); }
    const boat = new THREE.Group(); const hull = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.4), M.plastic(0xff7a59)); hull.position.y = 0.11; const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6), M.matte(0xe9eef8)); mast.position.y = 0.6; boat.add(hull, mast); harbour.add(boat);
    stage.label('Tide gauge', [0, 3.5, 0.9], harbour, 'hot');
    const mark = sphere(0.11, M.glow(0xffffff), 10); harbour.add(mark);

    var gauge = makeGauge(stage, 9, 4.4, (g, w, h) => {
      const st = gauge?.st; if (!st) return;
      const t1 = st.t + st.win * 24 * 0.18, t0 = t1 - st.win * 24; // now sits near the right edge
      const f = frame2d(g, w, h, { title: 'Water level: the five waves (thin) and their sum (white)', yLabel: 'metres above mean level' });
      let maxA = 0; CONS.forEach((c) => { maxA += st['a' + c.id]; }); const top = Math.max(1.2, Math.ceil(maxA * 2) / 2), lo = -top;
      const X = (t) => f.x0 + ((t - t0) / (t1 - t0)) * (f.x1 - f.x0), Y = (v) => f.y0 - ((v - lo) / (top - lo)) * (f.y0 - f.y1);
      g.strokeStyle = '#2a3042'; g.lineWidth = 1; g.fillStyle = '#7f8aa3'; g.font = '13px system-ui'; g.textAlign = 'right';
      for (let v = Math.ceil(lo); v <= top; v++) { g.beginPath(); g.moveTo(f.x0, Y(v)); g.lineTo(f.x1, Y(v)); g.stroke(); g.fillText(v, f.x0 - 6, Y(v) + 4); }
      g.textAlign = 'center';
      const step = st.win <= 3 ? 1 : st.win <= 15 ? 2 : 5;
      for (let d = Math.ceil(t0 / 24); d * 24 <= t1; d++) { if (d % step) continue; g.beginPath(); g.moveTo(X(d * 24), f.y1); g.lineTo(X(d * 24), f.y0); g.strokeStyle = '#323a52'; g.stroke(); g.fillText('day ' + (d + 1), X(d * 24), f.y0 + 17); }
      const n = 480;
      CONS.forEach((c) => {
        if (st['a' + c.id] < 0.005) return;
        g.strokeStyle = HEX(c.col); g.globalAlpha = 0.65; g.lineWidth = 1.5; g.beginPath();
        for (let i = 0; i <= n; i++) { const t = t0 + ((t1 - t0) * i) / n, y = st['a' + c.id] * Math.cos(((c.speed * t - st['p' + c.id]) * Math.PI) / 180); i ? g.lineTo(X(t), Y(y)) : g.moveTo(X(t), Y(y)); }
        g.stroke();
      });
      g.globalAlpha = 1; g.strokeStyle = '#fff'; g.lineWidth = 3.5; g.beginPath();
      for (let i = 0; i <= n; i++) { const t = t0 + ((t1 - t0) * i) / n, y = levelAt(st, t); i ? g.lineTo(X(t), Y(y)) : g.moveTo(X(t), Y(y)); }
      g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(X(st.t), Y(levelAt(st, st.t)), 7, 0, TAU); g.fill();
      g.textAlign = 'left'; g.font = '600 13px system-ui'; CONS.forEach((c, i) => { g.fillStyle = HEX(c.col); g.fillText(c.id, f.x0 + 8 + i * 38, f.y1 + 14); });
    });
    gauge.position.set(2.2, 2.4, 0); root.add(gauge);
    let lastKey = '';

    return {
      update(dt, st) {
        if (st.rate) st.t = (st.t + dt * st.rate) % 1440;
        const z = levelAt(st, st.t);
        waterG.scale.y = Math.max(0.05, BASE + z * VS); waterG.position.y = waterG.scale.y / 2;
        boat.position.set(0.1, BASE + z * VS, 0);
        mark.position.set(-0.55, BASE + z * VS, 0.9);
        gauge.faceCamera();
        const key = [st.t.toFixed(2), st.win, ...CONS.map((c) => st['a' + c.id] + ',' + st['p' + c.id])].join();
        if (key !== lastKey) { lastKey = key; gauge.st = { ...st }; gauge.redraw(); }
      },
      readout(st) {
        const a = (id) => st['a' + id], F = (a('K1') + a('O1')) / Math.max(1e-6, a('M2') + a('S2'));
        const kind = F < 0.25 ? 'Semi-diurnal' : F < 1.5 ? 'Mixed, mostly semi-diurnal' : F < 3 ? 'Mixed, mostly diurnal' : 'Diurnal';
        const z = levelAt(st, st.t);
        return `<div class="big">${kind}</div>
          <div class="row"><span>Water now</span><b>${z >= 0 ? '+' : ''}${z.toFixed(2)} m</b></div>
          <div class="row"><span>Form factor</span><b>${F.toFixed(2)}</b></div>
          <div class="row"><span>Spring range (≈ 2 × (M2+S2))</span><b>${(2 * (a('M2') + a('S2'))).toFixed(2)} m</b></div>
          <div class="row"><span>Neap range (≈ 2 × (M2−S2))</span><b>${(2 * Math.abs(a('M2') - a('S2'))).toFixed(2)} m</b></div>
          <p class="r-say">M2 and S2 beat every ${(360 / (CONS[1].speed - CONS[0].speed) / 24).toFixed(1)} days; K1 and O1 every ${(360 / (CONS[3].speed - CONS[4].speed) / 24).toFixed(1)} days.</p>`;
      },
    };
  },
};
