// Chapter 6: tides pay for themselves. The Earth turns faster than the Moon orbits, so friction drags the tidal bulge a
// little ahead of the line to the Moon. The Moon's gravity then pulls on that bulge: it slows the Earth's spin (days get
// longer) and tugs the Moon forward along its orbit, so the Moon spirals outward, about 3.8 cm a year (lunar laser
// ranging). The Moon itself has been through the same process: its rotation slowed until it is tidally locked.
import { THREE, M, sphere, COL, V, N, P2, dirAz, makeEarth, makeMoon, Poly, clamp } from '../tides.js';
import { arrow } from '../kit.js';

const ER = 1.5, OR = 6.2, TAU = Math.PI * 2, SPIN_PER_ORBIT = 7; // drawn: Earth turns 7× per Moon orbit (really about 27)

export default {
  id: 'friction',
  short: 'The Moon drifts away',
  title: 'Tidal friction and the drifting Moon',
  subtitle: 'The bulge leads the Moon, so the Earth slows and the Moon climbs.',
  view: { pos: [0, 11.5, 9], target: [0, 0, 0.5] },
  learn: `<p>The Earth spins once in 24 hours but the Moon takes about 27 days to orbit. So the Earth drags its bulge <b>ahead</b> of the line to the Moon, because water takes time to respond and rubs against the sea floor and coasts. The lag is only a few degrees (drawn much bigger here).</p>
    <p>The Moon's gravity pulls on that leading bulge. Its pull on the near-side bulge works against the spin, so the Earth <b>slows</b>: days lengthen by roughly 2 milliseconds per century. The reaction pulls the Moon <b>forward</b> along its orbit, so it gains energy and moves <b>outward</b>, by about <b>3.8 cm a year</b>. That is measured with laser pulses bounced off reflectors left on the Moon by Apollo and Soviet missions.</p>
    <p>The Moon was once spinning faster, but Earth's tides on it, in the same way, slowed it down until it turns exactly once per orbit. That is <b>tidal locking</b>, and it is why we always see the same face. The same thing is expected for the Earth, but only in a very distant future.</p>
    <p class="tip"><b>Try it:</b> raise the <b>bulge lag</b> from zero and watch the arrows appear. Then use the <b>Moon's spin</b> slider to set the Moon spinning. At exactly one turn per orbit the dark patch always faces Earth.</p>
    <p class="note">Speeds and sizes are not to scale. Rates change over geological time, so the Moon's recession in the past was not simply 3.8 cm a year.</p>`,
  terms: [
    { t: 'Tidal friction', d: 'The drag of tidal currents against the sea floor and coasts. It turns tidal energy into heat and slows the Earth.' },
    { t: 'Lunar laser ranging', d: 'Timing laser pulses that bounce off reflectors on the Moon to measure its distance to within millimetres.' },
    { t: 'Tidal locking', d: 'When a body spins exactly once per orbit, so one face always points at what it orbits.' },
    { t: 'Angular momentum', d: 'The amount of spin-and-orbit motion. The Earth loses spin, the Moon gains orbit, and the total is shared out.' },
  ],
  defaults: { lag: 0.25, spin: 0, run: true },
  controls: [
    { key: 'run', type: 'toggle', label: 'Run time' },
    { key: 'lag', type: 'range', label: 'Bulge lag', min: 0, max: 0.7, step: 0.01, fmt: (v) => (v === 0 ? 'None' : (v * 57.3).toFixed(0) + '° (real: a few degrees)') },
    { key: 'spin', type: 'range', label: 'Moon’s own spin', min: 0, max: 2, step: 0.01, fmt: (v) => (Math.abs(v - 1) < 0.015 ? '1 turn per orbit: locked' : v.toFixed(2) + ' turns per orbit'), hint: 'The dark patch is the Moon’s near side. A Moon that does not spin at all shows every side to Earth in turn.' },
  ],
  quiz: [
    { q: 'Why does the tidal bulge sit a little ahead of the Moon?', options: ['The Earth’s spin carries it forward faster than it can settle', 'The Moon pushes it', 'The Sun drags it', 'It does not'], answer: 0, why: 'The Earth turns faster than the Moon orbits, and the water responds slowly, so the bulge is dragged ahead of the Earth-Moon line.' },
    { q: 'How fast is the Moon moving away from us?', options: ['About 3.8 cm a year', 'About 3.8 m a year', 'About 3.8 km a year', 'It is coming closer'], answer: 0, why: 'Lunar laser ranging measures about 3.8 cm a year, roughly the rate fingernails grow.' },
    { q: 'What happens to the length of the day because of tides?', options: ['It gets longer, about 2 ms per century', 'It gets shorter', 'It stays the same', 'It gets shorter in summer only'], answer: 0, why: 'The Moon’s pull on the leading bulge acts as a brake on the Earth’s spin.' },
    { q: 'Why do we always see the same side of the Moon?', options: ['Earth’s tides slowed its spin until it is tidally locked', 'It does not spin because it is cold', 'The far side is dark', 'It orbits backwards'], answer: 0, why: 'Over a long time Earth’s tidal pull on the Moon slowed its rotation until it turns once per orbit.' },
  ],
  reel: [
    { ms: 6000, caption: 'Friction drags the bulge ahead of the Moon, which pulls the Moon forward: it drifts away 3.8 centimetres a year.', set: { lag: 0.35, spin: 1, run: true }, view: { pos: [0, 12.5, 8.5], target: [0, 0, 0.5] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const earth = makeEarth(ER); root.add(earth);
    const moon = makeMoon(0.5); root.add(moon);
    const ghost = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16), M.ghost(0xffb547, 0.22)); ghost.scale.set(1.22, 0.92, 0.92); root.add(ghost);
    stage.label('Moon', [0, 0.95, 0], moon, 'hot');
    const orbit = new Poly(stage, { color: 0x8f9bb5, width: 1, opacity: 0.35, max: 100 });
    const op = []; for (let i = 0; i < 100; i++) { const a = (i / 100) * TAU; op.push(V(Math.cos(a) * OR, 0, -Math.sin(a) * OR)); }
    orbit.set(op); root.add(orbit.obj);
    const line = new Poly(stage, { color: 0xffffff, width: 1, opacity: 0.4, closed: false, max: 2 }); root.add(line.obj);
    const bulgeLine = new Poly(stage, { color: COL.sun, width: 2, opacity: 0.8, closed: false, max: 2 }); root.add(bulgeLine.obj);
    const lbl = stage.label('Bulge', [0, 0, 0], root, 'hot');
    const brake = arrow(COL.coral, 1, 0.3, 0.05), push = arrow(COL.lime, 1, 0.3, 0.05); root.add(brake, push);
    const spinArrow = new THREE.Mesh(new THREE.TorusGeometry(ER + 0.55, 0.025, 8, 48, Math.PI * 1.3), M.glow(0xffffff)); spinArrow.rotation.x = Math.PI / 2; root.add(spinArrow);
    const spinTip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 12), M.glow(0xffffff)); root.add(spinTip);
    stage.label('Earth’s spin', [0, 0.3, 0], spinTip, 'hot');
    let a = 0.4, mdir = V(), bdir = V();
    const up = V(0, 1, 0);

    return {
      update(dt, st) {
        if (st.run) a += dt * 0.25;
        mdir.set(Math.cos(a), 0, -Math.sin(a));
        moon.position.copy(mdir).multiplyScalar(OR);
        moon.rotation.set(0, 0, 0); moon.rotation.y = st.spin * a + Math.PI;
        ghost.position.copy(moon.position); ghost.quaternion.setFromUnitVectors(V(1, 0, 0), mdir.clone().negate());
        earth.spin.rotation.y = a * SPIN_PER_ORBIT;
        const ba = a + st.lag; bdir.set(Math.cos(ba), 0, -Math.sin(ba));
        earth.shell.set(1.12, [{ dir: bdir, amp: 0.13 }]);
        line.set([V(0, 0, 0), mdir.clone().multiplyScalar(OR)]);
        bulgeLine.set([V(0, 0.02, 0), bdir.clone().multiplyScalar(ER * 1.45)]);
        lbl.position.copy(bdir).multiplyScalar(ER * 1.65); lbl.visible = st.lag > 0.05;
        // forces: the near bulge is pulled toward the Moon; its along-the-surface part brakes the Earth.
        const nb = bdir.clone().multiplyScalar(ER * 1.25);
        const toMoon = moon.position.clone().sub(nb).normalize();
        brake.visible = st.lag > 0.02;
        if (brake.visible) {
          brake.position.copy(nb); brake.quaternion.setFromUnitVectors(up, toMoon); brake.set(0.5 + 3 * st.lag);
        }
        // reaction on the Moon: forward along its orbit
        const fwd = V(-Math.sin(a), 0, -Math.cos(a));
        push.visible = st.lag > 0.02;
        if (push.visible) { push.position.copy(moon.position).addScaledVector(mdir, 0.55); push.quaternion.setFromUnitVectors(up, fwd); push.set(0.4 + 3 * st.lag); }
        // spin arrow follows Earth, drawn over the north pole
        const sa = a * SPIN_PER_ORBIT; spinArrow.position.y = ER + 0.55; spinArrow.rotation.z = sa;
        spinTip.position.set(Math.cos(sa + Math.PI * 1.3) * (ER + 0.55), ER + 0.55, -Math.sin(sa + Math.PI * 1.3) * (ER + 0.55));
        spinTip.quaternion.setFromUnitVectors(up, V(-Math.sin(sa + Math.PI * 1.3), 0, -Math.cos(sa + Math.PI * 1.3)));
        void P2; void dirAz;
      },
      readout(st) {
        const locked = Math.abs(st.spin - 1) < 0.015;
        const lag = st.lag > 0.02;
        return `<div class="big">${lag ? 'The Earth is braked, the Moon is pulled on' : 'No lag: no net push'}</div>
          <p class="r-say">${lag ? 'The leading bulge is pulled back by the Moon (slowing the Earth) and pulls the Moon forward (raising its orbit).' : 'With the bulge exactly under the Moon, the pulls cancel along the orbit, so nothing is exchanged.'}</p>
          <div class="row"><span>Moon moving away</span><b>≈ 3.8 cm a year</b></div>
          <div class="row"><span>Day getting longer</span><b>≈ 2 ms per century</b></div>
          <div class="row"><span>Moon’s spin</span><b>${locked ? 'Locked: same face to Earth' : st.spin === 0 ? 'Not spinning' : st.spin.toFixed(2) + ' turns per orbit'}</b></div>`;
      },
    };
  },
};
