// Chapter 1: the Moon's pull, and why it stretches. Gravity weakens with the square of distance, so the Moon pulls
// the near side of the Earth a little harder than the centre, and the far side a little less. The tide comes from
// that *difference* (the tidal force), which is why there are two bulges, not one.
import { THREE, M, sphere, COL, V, N, P2, makeEarth, makeMoon, Poly, clamp, lerp } from '../tides.js';
import { arrow } from '../kit.js';

const D0 = 60.27; // Moon's mean distance in Earth radii
const ER = 1.5; // Earth radius on screen
const MOON_X = 9; // Moon's place on screen (not to scale)

// Moon's pull at a point p (Earth radii) when the Moon is d radii away along +x, in units of the pull at Earth's centre at mean distance.
const pullAt = (p, d) => { const dx = d - p.x, dy = -p.y, dz = -p.z, r2 = dx * dx + dy * dy + dz * dz, r = Math.sqrt(r2); const k = (D0 * D0) / (r2 * r); return V(dx * k, dy * k, dz * k); };

export default {
  id: 'pull',
  short: 'The Moon’s pull',
  title: 'Why the Moon stretches the sea',
  subtitle: 'Gravity gets weaker with distance. The difference across the Earth is the tide.',
  view: { pos: [3.5, 11, 6.5], target: [3.5, 0, 0] },
  learn: `<p>The Moon pulls on everything on Earth. Gravity falls with the <b>square of distance</b>, so the Moon pulls the water on the near side a little <b>harder</b> than it pulls the Earth's centre, and the water on the far side a little <b>less</b>. The Earth is 6,371 km in radius and the Moon about 384,000 km away, so the difference is only about 3 percent.</p>
    <p>What makes a tide is not the pull itself but that <b>difference</b>. Take away the pull at the centre, and what is left points <b>outward</b> on the near side and also <b>outward on the far side</b> (the Earth is pulled away from the water there), and <b>inward</b> around the middle. That stretches the ocean into two bulges, one facing the Moon and one on the opposite side.</p>
    <p>You may have heard the far-side bulge is made by "centrifugal force". That is a shortcut that does not work: the Earth and Moon orbit a shared centre of mass, but every part of the Earth moves in the same-sized circle, so that sideways push is the <b>same everywhere</b> and cannot make a difference. The two bulges come from the difference in the Moon's <b>gravity</b>.</p>
    <p class="tip"><b>Try it:</b> switch between the three views, then push the <b>exaggeration</b> up to see the bulges. Move the Moon closer: the stretch grows with the <b>cube</b> of how near it is.</p>
    <p class="note">Not to scale: the Moon is really about 60 Earth radii away, and the real bulge is about half a metre high. The ocean here is drawn far too deep and too lumpy so you can see it.</p>`,
  terms: [
    { t: 'Tidal force', d: 'The difference between the Moon’s pull at a place and its pull at the Earth’s centre. It stretches the Earth along the line to the Moon.' },
    { t: 'Inverse-square law', d: 'Gravity falls as one over distance squared: twice as far, a quarter of the pull.' },
    { t: 'Tidal bulge', d: 'The slight rise of the ocean under the Moon and on the opposite side of the Earth.' },
    { t: 'Equilibrium tide', d: 'The tide an ocean with no friction and no land would make: two bulges that point at the Moon.' },
  ],
  defaults: { mode: 'diff', exag: 0.6, dist: 1 },
  controls: [
    { key: 'mode', type: 'seg', label: 'What to show', options: [{ v: 'pull', label: 'Moon’s pull' }, { v: 'diff', label: 'Minus the centre’s' }, { v: 'bulge', label: 'Just the bulge' }] },
    { key: 'exag', type: 'range', label: 'Exaggeration', min: 0, max: 1, step: 0.01, fmt: (v) => (v === 0 ? 'Real size (invisible)' : '×' + (Math.round(((v * 0.2) / (N.moonAmp / (N.earthR))) / 1e5) / 10).toFixed(1) + ' million') },
    { key: 'dist', type: 'range', label: 'Moon distance', min: 0.5, max: 1.5, step: 0.01, fmt: (v) => (v * N.moonD / 1000).toFixed(0) + ' thousand km', hint: 'The real Moon swings between about 357,000 and 407,000 km.' },
  ],
  quiz: [
    { q: 'Why does the near side of the Earth feel a stronger pull from the Moon than the centre does?', options: ['It is closer, and gravity weakens with distance', 'The Moon only pulls water', 'The Earth spins faster there', 'Because of the Sun'], answer: 0, why: 'Gravity gets weaker with the square of distance, so the closer near side is pulled a bit harder than the centre.' },
    { q: 'What actually stretches the ocean?', options: ['The Moon’s total pull', 'The difference in the Moon’s pull from place to place', 'Centrifugal force from spinning', 'Magnetism'], answer: 1, why: 'The Earth as a whole falls toward the Moon. Only the leftover difference between places stretches the water.' },
    { q: 'Why is there a bulge on the side facing away from the Moon?', options: ['Centrifugal force pushes it out', 'The Earth is pulled away from that water, which is pulled least', 'The Sun makes it', 'The Moon pushes there'], answer: 1, why: 'The Earth’s centre is pulled harder than the far-side water, so the far-side water is “left behind”. Orbiting about a common centre moves every part of the Earth in the same-sized circle, so it adds no difference.' },
    { q: 'If the Moon were half as far away, the tide-raising stretch would be about…', options: ['2×', '4×', '8×', 'the same'], answer: 2, why: 'The tidal stretch falls as one over distance cubed, so half the distance gives 2³ = 8 times as much.' },
  ],
  reel: [
    { ms: 5200, caption: 'The Moon pulls the near side of the Earth harder than its middle, and the far side less.', set: { mode: 'pull', exag: 0.35, dist: 1 }, view: { pos: [3.5, 7, 9], target: [3, 0, 0] }, spin: 0 },
    { ms: 5600, caption: 'Take away the pull at the centre and the sea is stretched into two bulges, not one.', set: { mode: 'diff', exag: 0.5, dist: 1 }, anim: { exag: [0.3, 0.9] }, view: { pos: [3, 8, 6.5], target: [2.5, 0, 0] }, spin: 0.4 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const earth = makeEarth(ER); root.add(earth);
    const moon = makeMoon(0.55); moon.position.set(MOON_X, 0, 0); root.add(moon);
    const mlbl = stage.label('Moon', [0, 1.0, 0], moon, 'hot');
    stage.label('Earth', [0, ER + 0.9, 0], earth);
    // an axis line from Earth to the Moon
    const axis = new Poly(stage, { color: 0x8f9bb5, width: 1, opacity: 0.45, closed: false, max: 2 });
    root.add(axis.obj);
    // arrows around the equatorial ring
    const NA = 16, arrows = [], centre = arrow(COL.violet, 1, 0.3, 0.05);
    for (let i = 0; i < NA; i++) { const a = arrow(COL.moon, 1, 0.22, 0.035); a.userData.ang = (i / NA) * Math.PI * 2; root.add(a); arrows.push(a); }
    const cArrow = arrow(COL.violet, 1, 0.3, 0.05); root.add(cArrow);
    const up = V(0, 1, 0), tmp = V();
    const point = (a, ang, p, len) => { a.position.copy(p); tmp.copy(len).normalize(); a.quaternion.setFromUnitVectors(up, tmp); a.set(len.length()); };
    let near = 0, far = 0;

    return {
      update(dt, st) {
        const d = D0 * st.dist, k = Math.pow(1 / st.dist, 3);
        moon.position.x = MOON_X * (0.55 + 0.45 * st.dist);
        const amp = st.exag * 0.2 * k;
        earth.shell.set(1.12, st.mode === 'pull' ? [] : [{ dir: V(1, 0, 0), amp: Math.min(0.6, amp) }]);
        axis.set([V(0, 0, 0), V(moon.position.x, 0, 0)]);
        // arrows: pull as seen at each ring point (lengths exaggerated about the centre's), or the tidal part only
        const g0 = pullAt(V(0, 0, 0), d);
        let maxT = 0;
        const rows = arrows.map((a) => {
          const p = V(Math.cos(a.userData.ang) * 1.12 * ER, 0, -Math.sin(a.userData.ang) * 1.12 * ER);
          const pe = V(p.x / ER, p.y / ER, p.z / ER);
          const g = pullAt(pe, d);
          const t = g.clone().sub(g0);
          maxT = Math.max(maxT, t.length());
          return { a, p, g, t };
        });
        near = pullAt(V(1, 0, 0), d).length() / g0.length() - 1; far = pullAt(V(-1, 0, 0), d).length() / g0.length() - 1;
        cArrow.visible = st.mode === 'pull';
        if (cArrow.visible) { cArrow.position.set(0, 0, 0); cArrow.quaternion.setFromUnitVectors(up, V(1, 0, 0)); cArrow.set(1.2); }
        rows.forEach(({ a, p, g, t }) => {
          a.visible = st.mode !== 'bulge';
          if (!a.visible) return;
          if (st.mode === 'pull') {
            // direction of the pull, length = 1.2 × (1 + 12 × the fractional difference from the centre's)
            const rel = 1 + 12 * (g.length() / g0.length() - 1);
            a.position.copy(p); a.quaternion.setFromUnitVectors(up, g.clone().normalize()); a.set(1.2 * clamp(rel, 0.2, 2));
          } else {
            const len = (t.length() / (maxT || 1)) * 1.3;
            a.position.copy(p); a.quaternion.setFromUnitVectors(up, t.clone().normalize()); a.set(len);
          }
        });
        mlbl.visible = true;
        void point;
      },
      readout(st) {
        const k = Math.pow(1 / st.dist, 3), amp = N.moonAmp * k;
        const say = st.mode === 'pull' ? 'The Moon pulls the whole Earth toward it. Arrows are drawn with the differences blown up 12 times.' : st.mode === 'diff' ? 'Subtract the pull at the centre. What is left points out on both sides and in around the middle.' : 'The ocean settles into two bulges lined up with the Moon.';
        return `<div class="big">${st.mode === 'pull' ? 'The Moon’s pull' : st.mode === 'diff' ? 'The tidal force' : 'Two bulges'}</div><p class="r-say">${say}</p>
          <div class="row"><span>Pull on near side vs centre</span><b>${near >= 0 ? '+' : ''}${(near * 100).toFixed(1)}%</b></div>
          <div class="row"><span>Pull on far side vs centre</span><b>${(far * 100).toFixed(1)}%</b></div>
          <div class="row"><span>Real bulge (high minus low)</span><b>≈ ${(amp * 1.5).toFixed(2)} m</b></div>`;
      },
    };
  },
};
