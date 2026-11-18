// Chapter 3: the Earth spins under the bulges. The bulges stay lined up with the Moon (and Sun) while the Earth turns
// through them, so a coast passes through two highs and two lows each lunar day. Because the Moon moves on in its orbit,
// the Earth needs about 50 minutes extra to catch up with it each day, so tides arrive about 50 minutes later every day.
import { THREE, M, sphere, COL, V, N, P2, SUN_RATIO, dirAz, hm, dur, makeEarth, makeMoon, Poly, makeGauge, frame2d, clamp } from '../tides.js';

const ER = 1.5, OR = 5.2, TAU = Math.PI * 2, DAY = 24;
const OM = TAU / (N.synodic * DAY); // Moon's rate relative to the Sun, rad per hour

// water level in metres (equilibrium) at latitude φ, time t (hours), Moon declination δ, Sun optional
export const level = (t, lat, dec, sunOn) => {
  const th = (TAU * t) / DAY, a = OM * t;
  const cm = Math.cos(lat) * Math.cos(dec) * Math.cos(th - a) + Math.sin(lat) * Math.sin(dec);
  const cs = Math.cos(lat) * Math.cos(th);
  return N.moonAmp * P2(cm) + (sunOn ? N.sunAmp * P2(cs) : 0);
};
// local maxima in [t0, t1], parabolic refinement
function highs(t0, t1, lat, dec, sunOn) {
  const out = [], h = 0.1; let y0 = level(t0 - h, lat, dec, sunOn), y1 = level(t0, lat, dec, sunOn);
  for (let t = t0 + h; t <= t1 + h; t += h) {
    const y2 = level(t, lat, dec, sunOn);
    if (y1 > y0 && y1 >= y2) { const d = (y0 - y2) / (2 * (y0 - 2 * y1 + y2) || 1); out.push({ t: t - h + d * h, y: y1 }); }
    y0 = y1; y1 = y2;
  }
  return out;
}

export default {
  id: 'spin',
  short: 'The spinning Earth',
  title: 'The Earth turns under the bulges',
  subtitle: 'Two highs and two lows a day, 50 minutes later each time.',
  view: { pos: [0.5, 14, 11], target: [0.5, 0, 3] },
  learn: `<p>The bulges do not spin with the Earth. They stay pointed at the Moon, and the Earth rotates <b>through</b> them. A coast carried round by the spin meets a bulge, then a trough, then the opposite bulge, then another trough: <b>two high tides and two low tides</b> in a bit more than a day. That pattern is called <b>semi-diurnal</b>.</p>
    <p>A <b>solar day</b> is 24 hours, but while the Earth turns once the Moon has moved on about 12° along its orbit. The Earth needs another <b>50 minutes</b> to catch up. So the <b>lunar day</b> is about <b>24 h 50 min</b>, and each high tide comes roughly 50 minutes later than the day before, with the two highs about 12 h 25 min apart.</p>
    <p>The Moon is not always over the equator. When it is far north or south (up to about 28° of <b>declination</b>), a coast away from the equator sees one high bigger than the other, and at high latitudes sometimes just <b>one</b> high and one low a day: <b>diurnal</b> tides.</p>
    <p class="tip"><b>Try it:</b> press play and watch the white pin. Read off the highs for each day and see them slip later. Then raise the Moon's <b>declination</b> and move the pin to a high latitude to make the two highs unequal. Switch the Sun on to see springs and neaps appear in a long window.</p>
    <p class="note">Equilibrium model: water levels follow the bulges at once. Real basins respond with delays and resonances (next chapter).</p>`,
  terms: [
    { t: 'Semi-diurnal', d: 'Two high and two low tides a day, the common pattern on Atlantic coasts.' },
    { t: 'Diurnal', d: 'One high and one low a day, as in parts of the Gulf of Mexico and South-East Asia.' },
    { t: 'Lunar day', d: 'The time for the Earth to turn to face the Moon again: about 24 h 50 min.' },
    { t: 'Declination', d: 'How far north or south of the equator the Moon sits, up to about 28.5°. It makes the two daily tides unequal.' },
  ],
  defaults: { t: 6, rate: 3, lat: 0, dec: 0, sun: false, win: 2 },
  controls: [
    { key: 'rate', type: 'seg', label: 'Time', options: [{ v: 0, label: 'Paused' }, { v: 3, label: '3 h/s' }, { v: 12, label: '12 h/s' }, { v: 48, label: '2 days/s' }] },
    { key: 't', type: 'range', label: 'Clock', min: 0, max: 720, step: 0.1, fmt: (v) => `Day ${Math.floor(v / 24) + 1}, ${hm(v)}` },
    { key: 'lat', type: 'range', label: 'Coast latitude', min: -70, max: 70, step: 1, fmt: (v) => Math.abs(v) + '°' + (v < 0 ? ' S' : v > 0 ? ' N' : ' (equator)') },
    { key: 'dec', type: 'range', label: 'Moon’s declination', min: 0, max: 28.5, step: 0.5, fmt: (v) => v.toFixed(1) + '° north of the equator' },
    { key: 'sun', type: 'toggle', label: 'Add the Sun’s tide' },
    { key: 'win', type: 'seg', label: 'Graph shows', options: [{ v: 2, label: '2 days' }, { v: 7, label: '1 week' }, { v: 30, label: '1 month' }] },
  ],
  quiz: [
    { q: 'Why does a coast get about two high tides a day?', options: ['The Earth spins through two bulges', 'The Moon orbits twice a day', 'The Sun and Moon swap places', 'The sea sloshes by itself'], answer: 0, why: 'There is a bulge under the Moon and one opposite it. The Earth’s spin carries a coast through both once per lunar day.' },
    { q: 'About how much later does high tide come each day?', options: ['10 minutes', '50 minutes', '3 hours', 'Not later at all'], answer: 1, why: 'The Moon moves on along its orbit while the Earth turns, so the Earth needs about 50 more minutes to face it again.' },
    { q: 'How long is the lunar day?', options: ['24 h exactly', '24 h 50 min', '27.3 days', '12 h 25 min'], answer: 1, why: 'A lunar day, from Moon-overhead to Moon-overhead, is about 24 h 50 min. Half of it, 12 h 25 min, is the usual gap between high tides.' },
    { q: 'What can make the two highs of a day unequal?', options: ['The Moon being north or south of the equator', 'The Moon being full', 'The Sun being hidden', 'Nothing can'], answer: 0, why: 'When the Moon has a declination, a coast away from the equator crosses one bulge nearer its crest than the other, so one high is bigger.' },
  ],
  reel: [
    { ms: 5200, caption: 'The bulges stay with the Moon while the Earth spins through them: two highs a day, about 50 minutes later each time.', set: { t: 0, rate: 0, lat: 0, dec: 0, sun: false, win: 2 }, anim: { t: [0, 52] }, view: { pos: [0.5, 14, 11], target: [0.5, 0, 3] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const earth = makeEarth(ER); root.add(earth);
    const sun = sphere(1.0, M.glow(0xffd36a), 24); sun.position.set(14, 0, 0); root.add(sun);
    stage.label('Sun', [0, 1.5, 0], sun, 'hot');
    const moon = makeMoon(0.5); root.add(moon);
    stage.label('Moon', [0, 0.95, 0], moon, 'hot');
    const orbit = new Poly(stage, { color: 0x8f9bb5, width: 1, opacity: 0.35, max: 100 });
    const op = []; for (let i = 0; i < 100; i++) { const a = (i / 100) * TAU; op.push(V(Math.cos(a) * OR, 0, -Math.sin(a) * OR)); }
    orbit.set(op); root.add(orbit.obj);
    // axis
    const axis = new Poly(stage, { color: 0x8f9bb5, width: 1, opacity: 0.5, closed: false, max: 2 });
    axis.set([V(0, -ER - 0.9, 0), V(0, ER + 0.9, 0)]); root.add(axis.obj);
    // the observer on the coast: a pin that rides the spinning surface
    const pin = new THREE.Group(); earth.spin.add(pin);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), M.glow(0xffffff)); stick.position.y = 0.45; pin.add(stick);
    const head = sphere(0.11, M.glow(0xffffff), 12); head.position.y = 0.92; pin.add(head);
    const youLbl = stage.label('You are here', [0, 0.25, 0], head, 'hot');
    const sunDir = V(1, 0, 0), mdir = V();
    const WIN = () => s.win * DAY;
    const hl = []; // marker labels

    var gauge = makeGauge(stage, 6.6, 2.9, (g, w, h) => {
      const st = gauge?.st; if (!st) return;
      const f = frame2d(g, w, h, { title: `Water level at your coast (last ${st.win === 2 ? '2 days' : st.win === 7 ? 'week' : 'month'})`, yLabel: 'metres, equilibrium model' });
      const t1 = st.t, t0 = t1 - st.win * DAY, lo = -0.45, hi = 0.65;
      const X = (t) => f.x0 + ((t - t0) / (t1 - t0)) * (f.x1 - f.x0), Y = (v) => f.y0 - ((v - lo) / (hi - lo)) * (f.y0 - f.y1);
      g.strokeStyle = '#2a3042'; g.lineWidth = 1; g.fillStyle = '#7f8aa3'; g.font = '13px system-ui'; g.textAlign = 'right';
      for (const v of [-0.4, -0.2, 0, 0.2, 0.4, 0.6]) { g.beginPath(); g.moveTo(f.x0, Y(v)); g.lineTo(f.x1, Y(v)); g.stroke(); g.fillText(v.toFixed(1), f.x0 - 6, Y(v) + 4); }
      // day boundaries
      g.textAlign = 'center';
      const step = st.win <= 2 ? 1 : st.win <= 7 ? 1 : 5;
      for (let d = Math.ceil(t0 / DAY); d * DAY <= t1; d++) { if (d % step) continue; g.beginPath(); g.moveTo(X(d * DAY), f.y1); g.lineTo(X(d * DAY), f.y0); g.strokeStyle = '#323a52'; g.stroke(); g.fillText(st.win <= 7 ? 'midnight' : 'day ' + (d + 1), X(d * DAY), f.y0 + 17); }
      g.strokeStyle = '#8ef0ff'; g.lineWidth = 3; g.beginPath();
      const n = 360;
      for (let i = 0; i <= n; i++) { const t = t0 + ((t1 - t0) * i) / n, y = level(t, st.lat, st.dec, st.sun); i ? g.lineTo(X(t), Y(y)) : g.moveTo(X(t), Y(y)); }
      g.stroke();
      if (st.win <= 7) {
        g.fillStyle = '#ffb547'; g.font = '600 13px system-ui';
        for (const p of highs(t0, t1, st.lat, st.dec, st.sun)) { g.beginPath(); g.arc(X(p.t), Y(p.y), 5, 0, TAU); g.fill(); if (st.win <= 2) g.fillText(hm(p.t), X(p.t), Y(p.y) - 10); }
      }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(X(t1), Y(level(t1, st.lat, st.dec, st.sun)), 7, 0, TAU); g.fill();
    });
    gauge.position.set(0.5, 0, 6.6); root.add(gauge);
    let lastKey = '';

    return {
      update(dt, st) {
        if (st.rate) st.t = (st.t + dt * st.rate) % 720;
        const th = (TAU * st.t) / DAY, a = OM * st.t, lat = (st.lat * Math.PI) / 180, dec = (st.dec * Math.PI) / 180;
        earth.spin.rotation.y = th;
        dirAz(a, dec, mdir);
        moon.position.copy(mdir).multiplyScalar(OR);
        moon.quaternion.setFromUnitVectors(V(1, 0, 0), mdir.clone().negate());
        sun.visible = st.sun;
        const A = 0.16;
        earth.shell.set(1.12, st.sun ? [{ dir: mdir, amp: A }, { dir: sunDir, amp: A * SUN_RATIO }] : [{ dir: mdir, amp: A }]);
        // pin at the coast
        const R = 1.12 * ER - 0.05;
        pin.position.set(Math.cos(lat) * ER, Math.sin(lat) * ER, 0);
        pin.quaternion.setFromUnitVectors(V(0, 1, 0), V(Math.cos(lat), Math.sin(lat), 0));
        void R;
        gauge.faceCamera();
        const key = [st.t.toFixed(2), st.lat, st.dec, st.sun, st.win].join();
        if (key !== lastKey) { lastKey = key; gauge.st = { t: st.t, lat, dec, sun: st.sun, win: st.win }; gauge.redraw(); }
      },
      readout(st) {
        const lat = (st.lat * Math.PI) / 180, dec = (st.dec * Math.PI) / 180;
        const d0 = Math.floor(st.t / DAY) * DAY;
        const day = (k) => highs(d0 + k * DAY, d0 + (k + 1) * DAY - 0.01, lat, dec, st.sun);
        const a = day(0), b = day(1);
        const lv = level(st.t, lat, dec, st.sun), mean = level(st.t, lat, dec, st.sun) * 0;
        void mean;
        const ratio = Math.abs(4 * Math.tan(lat) * Math.tan(dec)), kind = ratio < 0.25 ? 'Semi-diurnal: two highs, two lows' : ratio < 1.5 ? 'Mixed, mostly semi-diurnal' : ratio < 3 ? 'Mixed, mostly diurnal' : 'Diurnal: one high, one low';
        const list = (xs) => xs.map((p) => hm(p.t)).join(', ') || 'none';
        let shift = null;
        if (a[0] && b.length) { const c = b.reduce((m, p) => (Math.abs(p.t - (a[0].t + 24.8)) < Math.abs(m.t - (a[0].t + 24.8)) ? p : m)); shift = (c.t - a[0].t - DAY) * 60; if (Math.abs(shift - 50) > 40) shift = null; }
        return `<div class="big">${kind}</div>
          <div class="row"><span>Water now</span><b>${lv >= 0 ? '+' : ''}${lv.toFixed(2)} m</b></div>
          <div class="row"><span>Highs on day ${Math.floor(d0 / DAY) + 1}</span><b>${list(a)}</b></div>
          <div class="row"><span>Highs on day ${Math.floor(d0 / DAY) + 2}</span><b>${list(b)}</b></div>
          <div class="row"><span>Same high, a day later, comes later by</span><b>${shift === null ? '–' : shift.toFixed(0) + ' min'}</b></div>
          <div class="row"><span>Lunar day</span><b>${dur(N.lunarDayH)}</b></div>`;
      },
    };
  },
};
