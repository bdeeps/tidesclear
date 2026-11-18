// The box and its chapters, in reading order.
import pull from './pull.js';
import sun from './sun.js';
import spin from './spin.js';
import basins from './basins.js';
import predictor from './predictor.js';
import friction from './friction.js';

export const BOX = { slug: 'tidesclear', title: "TidesClear" };
export const CHAPTERS = [pull, sun, spin, basins, predictor, friction];
