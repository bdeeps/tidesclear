// Chapter 2: the Sun joins in. The Sun is 27 million times more massive than the Moon but about 390 times farther,
// so its tidal pull (which falls with distance cubed) is about 46 percent of the Moon's. When the two line up (new and
// full Moon) the bulges add: spring tides. At the quarters they cross: neap tides. (Equilibrium-tide numbers.)
import { THREE, M, sphere, COL, HEX, V, N, P2, SUN_RATIO, makeEarth, makeMoon, Poly, makeGauge, frame2d, rangeAt, clamp } from '../tides.js';

const ER = 1.5, OR = 5, TAU = Math.PI * 2;
const PHASES = ['New Moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full Moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
const phaseName = (ph) => PHASES[Math.round(((ph % TAU) + TAU) % TAU / (TAU / 8)) % 8];
// range in metres at phase ph (radians)
const R_MIN = rangeAt(Math.PI / 2), R_MAX = rangeAt(0);

export default {
  id: 'sun',
  short: 'Springs and neaps',
  title: 'The Sun, springs and neaps',
  subtitle: 'Two bulges from the Moon, a smaller pair from the Sun. Line them up, or cross them.',
  view: { pos: [2.2, 11, 10], target: [2.2, 0, 3] },
  learn: `<p>The Sun pulls the Earth far harder than the Moon does, but it is about 390 times farther away. The tidal stretch falls with the <b>cube</b> of distance, so the Sun's tidal effect ends up at about <b>46 percent</b> of the Moon's (a ratio of roughly 0.45). The Sun makes its own pair of bulges.</p>
    <p>At <b>new Moon</b> and <b>full Moon</b> the Sun, Earth and Moon are in a line, the two pairs of bulges overlap, and the tides are at their biggest: <b>spring tides</b> (nothing to do with the season). At the <b>quarter</b> Moons the Sun's bulges sit across the Moon's, so the highs are lower and the lows higher: <b>neap tides</b>. This repeats every half month, about 14.8 days.</p>
    <p>In this simple model the range at springs is about 0.79 m and at neaps about 0.29 m. Real springs are often a bit more than twice the neaps, which matches.</p>
    <p class="tip"><b>Try it:</b> drag the <b>Moon's phase</b> from new to first quarter to full. Watch the white outline change from a long ellipse into a rounder one and back, and the range on the graph.</p>
    <p class="note">The Moon's orbit is drawn small and the Sun close so both fit. The ocean shape is an exaggerated equilibrium tide with no continents.</p>`,
  terms: [
    { t: 'Spring tide', d: 'The biggest tides, at new and full Moon, when the Sun’s and Moon’s bulges line up. Nothing to do with the season.' },
    { t: 'Neap tide', d: 'The smallest tides, at the first and last quarter Moon, when the Sun’s bulges cross the Moon’s.' },
    { t: 'Tidal range', d: 'The height difference between high water and the following low water.' },
    { t: 'Synodic month', d: 'New Moon to new Moon, about 29.5 days. It sets the spring-neap cycle.' },
  ],
  defaults: { phase: 0, play: false, exag: 0.7 },
  controls: [
    { key: 'phase', type: 'range', label: 'Moon’s phase', min: 0, max: 360, step: 1, fmt: (v) => phaseName((v * Math.PI) / 180) + ' · day ' + ((v / 360) * N.synodic).toFixed(1), ends: ['New', 'Full', 'New'].slice(0, 2), hint: '0° is New Moon, 180° is Full Moon.' },
    { key: 'play', type: 'toggle', label: 'Run through the month' },
    { key: 'exag', type: 'range', label: 'Exaggeration', min: 0.2, max: 1, step: 0.01, fmt: (v) => '×' + (v * 3.2).toFixed(1) + ' million' },
  ],
  quiz: [
    { q: 'How strong is the Sun’s tidal effect compared with the Moon’s?', options: ['About 46 percent', 'About 5 times stronger', 'The same', 'Almost nothing'], answer: 0, why: 'The Sun is far more massive, but about 390 times farther, and tidal force falls with distance cubed. It nets out to about 0.46 of the Moon’s effect.' },
    { q: 'When do spring tides happen?', options: ['In spring', 'At new and full Moon', 'At the quarter Moons', 'Only in winter'], answer: 1, why: 'When the Sun, Earth and Moon line up, the two pairs of bulges add together, which gives the biggest tides.' },
    { q: 'At first-quarter Moon the Sun and Moon bulges are at right angles. The tides are…', options: ['Neap: smaller than average', 'Spring: larger than average', 'Exactly zero', 'Twice as high'], answer: 0, why: 'The Sun’s bulge fills in part of the Moon’s low water and flattens part of its high, so the range is smallest.' },
    { q: 'About how often do springs come round?', options: ['Daily', 'Every 7 days', 'About every 14.8 days', 'Once a year'], answer: 2, why: 'Springs come at both new and full Moon, which is twice per 29.5-day month.' },
  ],
  reel: [
    { ms: 5600, caption: 'The Sun adds about 46 percent of the Moon’s effect. Line them up and the bulges add: spring tides.', set: { phase: 180, exag: 0.75 }, anim: { phase: [120, 180] }, view: { pos: [2.2, 11, 10], target: [2.2, 0, 3] }, spin: 0 },
    { ms: 5600, caption: 'Cross them at the quarters and they partly cancel: neap tides.', set: { phase: 90, exag: 0.75 }, anim: { phase: [180, 270] }, view: { pos: [2.2, 11, 10], target: [2.2, 0, 3] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const earth = makeEarth(ER); root.add(earth);
    // the Sun sits to the right (+x), far off; the Moon circles on the ring
    const sun = sphere(1.15, M.glow(0xffd36a), 32); sun.position.set(14, 0, 0); root.add(sun);
    stage.label('Sun', [0, 1.7, 0], sun, 'hot');
    const halo = new THREE.Mesh(new THREE.SphereGeometry(1.7, 32, 16), M.ghost(0xffd36a, 0.14)); sun.add(halo);
    const moon = makeMoon(0.5); root.add(moon);
    const mlbl = stage.label('Moon', [0, 0.95, 0], moon, 'hot');
    const orbit = new Poly(stage, { color: 0x8f9bb5, width: 1, opacity: 0.4, max: 120 });
    const op = []; for (let i = 0; i < 120; i++) { const a = (i / 120) * TAU; op.push(V(Math.cos(a) * OR, 0, -Math.sin(a) * OR)); }
    orbit.set(op); root.add(orbit.obj);
    const sunLine = new Poly(stage, { color: 0xffd36a, width: 1, opacity: 0.35, closed: false, max: 2 });
    sunLine.set([V(-OR - 2, 0, 0), V(13, 0, 0)]); root.add(sunLine.obj);
    // outlines of the Moon-only, Sun-only and combined water surfaces in the orbit plane
    const outM = new Poly(stage, { color: COL.moon, width: 2, opacity: 0.9, max: 180 }), outS = new Poly(stage, { color: COL.sun, width: 2, opacity: 0.9, max: 180 }), outT = new Poly(stage, { color: 0xffffff, width: 3, opacity: 1, max: 180 });
    root.add(outM.obj, outS.obj, outT.obj);
    stage.label('Moon’s bulges', [0, 0, 0], root, 'hot').visible = false;

    // gauge: tidal range over the month
    var gauge = makeGauge(stage, 5.2, 2.7, (g, w, h) => {
      const f = frame2d(g, w, h, { title: 'Tidal range over one month', yLabel: 'metres (equilibrium model)' });
      g.fillStyle = 'rgba(255,255,255,.06)';
      const X = (d) => f.x0 + (d / N.synodic) * (f.x1 - f.x0), Y = (v) => f.y0 - (v / 0.9) * (f.y0 - f.y1);
      g.strokeStyle = '#2a3042'; g.lineWidth = 1; g.fillStyle = '#7f8aa3'; g.font = '13px system-ui'; g.textAlign = 'right';
      for (const v of [0, 0.3, 0.6, 0.9]) { g.beginPath(); g.moveTo(f.x0, Y(v)); g.lineTo(f.x1, Y(v)); g.stroke(); g.fillText(v.toFixed(1), f.x0 - 6, Y(v) + 4); }
      g.textAlign = 'center';
      [['New', 0], ['First qtr', 7.38], ['Full', 14.77], ['Last qtr', 22.15], ['New', 29.53]].forEach(([n, d]) => g.fillText(n, X(d), f.y0 + 17));
      g.strokeStyle = '#c49bff'; g.lineWidth = 3; g.beginPath();
      for (let i = 0; i <= 120; i++) { const d = (i / 120) * N.synodic, v = rangeAt((d / N.synodic) * TAU); i ? g.lineTo(X(d), Y(v)) : g.moveTo(X(d), Y(v)); }
      g.stroke();
      const ph = (gauge?.phase ?? 0), d = (ph / TAU) * N.synodic, v = rangeAt(ph);
      g.fillStyle = '#ffb547'; g.beginPath(); g.arc(X(d), Y(v), 7, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,181,71,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(X(d), f.y0); g.lineTo(X(d), Y(v)); g.stroke();
    });
    gauge.position.set(2.4, 0.2, 6.6); root.add(gauge);
    gauge.phase = 0;
    let lastPh = -1, lastRange = 0, clock = 0;

    const surface = (pts, fn) => { const out = []; for (let i = 0; i < 180; i++) { const a = (i / 180) * TAU, r = fn(a); out.push(V(Math.cos(a) * r, 0, -Math.sin(a) * r)); } pts.set(out); };

    return {
      update(dt, st) {
        clock += dt;
        if (st.play) st.phase = (st.phase + dt * 24) % 360;
        const ph = (st.phase * Math.PI) / 180;
        moon.position.set(Math.cos(ph) * OR, 0, -Math.sin(ph) * OR);
        moon.rotation.y = ph + Math.PI; // the Moon keeps its face to Earth
        const ex = st.exag * 0.16;
        const mA = ex * 0.6, sA = mA * SUN_RATIO, mdir = V(Math.cos(ph), 0, -Math.sin(ph)), sdir = V(1, 0, 0);
        earth.shell.set(1.12, [{ dir: mdir, amp: mA }, { dir: sdir, amp: sA }]);
        // outlines (drawn a little larger than the water)
        const base = 1.12 * ER + 0.05;
        surface(outM, (a) => base + ER * mA * P2(Math.cos(a - ph)) * 1.0);
        surface(outS, (a) => base + ER * sA * P2(Math.cos(a)));
        surface(outT, (a) => base + ER * (mA * P2(Math.cos(a - ph)) + sA * P2(Math.cos(a))));
        outT.obj.position.y = 0.01; outM.obj.position.y = -0.01;
        gauge.faceCamera();
        if (Math.abs(ph - lastPh) > 1e-4) { gauge.phase = ph; gauge.redraw(); lastPh = ph; }
        void lastRange;
      },
      readout(st) {
        const ph = (st.phase * Math.PI) / 180, r = rangeAt(ph);
        const kind = r > R_MAX * 0.93 ? 'Spring tides' : r < R_MIN * 1.12 ? 'Neap tides' : 'In between';
        const pct = Math.round(((r - R_MIN) / (R_MAX - R_MIN)) * 100);
        return `<div class="big">${kind}</div><p class="r-say">${phaseName(ph)}, day ${((st.phase / 360) * N.synodic).toFixed(1)} of the month.</p>
          <div class="row"><span>Moon’s tide alone</span><b>${(N.moonAmp * 1.5).toFixed(2)} m</b></div>
          <div class="row"><span>Sun’s tide alone</span><b>${(N.sunAmp * 1.5).toFixed(2)} m</b></div>
          <div class="row"><span>Combined range now</span><b>${r.toFixed(2)} m</b></div>
          <div class="row"><span>Between neap and spring</span><b>${pct}%</b></div>`;
      },
    };
  },
};
