import type {Role, Shape} from './types';

/**
 * Prop library. Every prop is a list of flat shapes in a 100 x 100 box, coloured by palette ROLE,
 * so the same prop renders in any style and any palette. Talent Acquisition adds film-specific
 * props as the same JSON in cast definitions (`shapes`), never as code.
 */
const R = (x: number, y: number, w: number, h: number, r: number, fill: Role | 'none', stroke?: Role, rot?: number): Shape => ({t: 'rect', x, y, w, h, r, fill, stroke, rot});
const E = (cx: number, cy: number, rx: number, ry: number, fill: Role | 'none', stroke?: Role): Shape => ({t: 'ellipse', cx, cy, rx, ry, fill, stroke});
const P = (pts: number[][], fill: Role | 'none', smooth = false, stroke?: Role): Shape => ({t: 'poly', pts, fill, smooth, stroke});
const L = (pts: number[][], w: number, stroke: Role, smooth = false): Shape => ({t: 'line', pts, w, stroke, smooth});
const grid = (x: number, y: number, cols: number, rows: number, dx: number, dy: number, w: number, h: number, fill: Role): Shape[] =>
	Array.from({length: cols * rows}, (_, i) => R(x + (i % cols) * dx, y + Math.floor(i / cols) * dy, w, h, Math.min(w, h) * 0.3, fill));

export const PROPS: Record<string, Shape[]> = {
	// candy-bar feature phone: no logo, no brand marks
	'phone-brick': [R(30, 6, 40, 90, 9, 'primary', 'ink'), R(36, 14, 28, 26, 3, 'bg', 'ink'), L([[40, 22], [56, 22]], 2, 'shadow'), L([[40, 28], [50, 28]], 2, 'shadow'), R(43, 45, 14, 7, 3, 'highlight', 'ink'), ...grid(37, 57, 3, 4, 9.5, 8.5, 7, 5, 'ink')],
	smartphone: [R(28, 4, 44, 92, 8, 'ink', 'ink'), R(32, 9, 36, 78, 4, 'secondary'), R(36, 16, 12, 12, 3, 'highlight'), R(52, 16, 12, 12, 3, 'bg'), R(36, 32, 12, 12, 3, 'bg'), R(52, 32, 12, 12, 3, 'primary'), E(50, 91.5, 2.4, 2.4, 'bg')],
	crown: [P([[14, 72], [10, 30], [32, 50], [50, 18], [68, 50], [90, 30], [86, 72]], 'highlight', false, 'ink'), R(14, 72, 72, 12, 2, 'primary', 'ink'), E(50, 18, 5, 5, 'primary', 'ink'), E(10, 30, 4, 4, 'primary', 'ink'), E(90, 30, 4, 4, 'primary', 'ink')],
	tower: [R(34, 10, 32, 86, 1, 'secondary', 'ink'), ...grid(39, 16, 3, 8, 8, 9.5, 5, 6, 'bg'), R(44, 84, 12, 12, 1, 'ink'), L([[50, 10], [50, 1]], 2, 'ink')],
	coin: [E(50, 50, 38, 38, 'highlight', 'ink'), E(50, 50, 28, 28, 'none', 'ink'), L([[50, 34], [50, 66]], 5, 'ink'), L([[58, 40], [44, 40], [44, 50], [57, 50], [57, 60], [42, 60]], 4, 'ink')],
	clock: [E(50, 52, 40, 40, 'bg', 'ink'), L([[50, 52], [50, 26]], 4, 'ink'), L([[50, 52], [68, 62]], 4, 'primary'), E(50, 52, 4, 4, 'ink'), ...[0, 90, 180, 270].map((a) => L([[50 + Math.sin((a * Math.PI) / 180) * 33, 52 - Math.cos((a * Math.PI) / 180) * 33], [50 + Math.sin((a * Math.PI) / 180) * 38, 52 - Math.cos((a * Math.PI) / 180) * 38]], 3, 'ink'))],
	flame: [P([[50, 4], [70, 34], [82, 62], [70, 90], [50, 97], [30, 90], [18, 62], [34, 44], [38, 26]], 'primary', true), P([[50, 40], [62, 62], [58, 84], [50, 90], [42, 84], [38, 64]], 'highlight', true)],
	// oil platform: the "burning platform" memo image
	platform: [L([[24, 96], [34, 52]], 5, 'ink'), L([[76, 96], [66, 52]], 5, 'ink'), L([[28, 78], [72, 78]], 3, 'ink'), L([[30, 66], [72, 78]], 2, 'ink'), R(18, 42, 64, 11, 1, 'secondary', 'ink'), R(26, 26, 18, 16, 1, 'shadow', 'ink'), L([[62, 42], [62, 12]], 4, 'ink'), L([[62, 14], [78, 30]], 2, 'ink'), P([[62, 0], [70, 8], [66, 15], [58, 15], [55, 8]], 'primary', true)],
	house: [P([[8, 50], [50, 12], [92, 50]], 'primary', false, 'ink'), R(18, 50, 64, 44, 1, 'bg', 'ink'), R(42, 64, 16, 30, 1, 'secondary', 'ink'), R(24, 58, 12, 12, 1, 'highlight', 'ink'), R(64, 58, 12, 12, 1, 'highlight', 'ink'), R(66, 20, 9, 18, 1, 'shadow', 'ink')],
	bank: [P([[6, 36], [50, 8], [94, 36]], 'secondary', false, 'ink'), R(10, 36, 80, 8, 1, 'bg', 'ink'), ...[18, 36, 54, 72].map((x) => R(x, 46, 10, 36, 1, 'bg', 'ink')), R(6, 82, 88, 10, 1, 'secondary', 'ink'), E(50, 25, 5, 5, 'highlight', 'ink')],
	glass: [P([[30, 14], [70, 14], [64, 90], [36, 90]], 'bg', false, 'ink'), P([[32.5, 44], [67.5, 44], [64, 88], [36, 88]], 'secondary'), L([[40, 22], [41.5, 40]], 2.5, 'highlight')],
	vase: [P([[40, 8], [60, 8], [56, 26], [74, 52], [66, 90], [34, 90], [26, 52], [44, 26]], 'primary', true, 'ink'), L([[30, 56], [70, 56]], 3, 'highlight'), L([[33, 66], [67, 66]], 2, 'bg')],
	table: [R(4, 34, 92, 9, 2, 'secondary', 'ink'), R(12, 43, 7, 54, 1, 'shadow', 'ink'), R(81, 43, 7, 54, 1, 'shadow', 'ink')],
	memo: [R(22, 8, 56, 84, 2, 'bg', 'ink', -4), L([[32, 26], [62, 24]], 4, 'primary'), ...[38, 48, 58, 68].map((y, i) => L([[32, y], [i === 3 ? 52 : 68, y - 2.4]], 2.4, 'shadow'))],
	blocks: [R(20, 76, 60, 16, 1, 'secondary', 'ink'), R(24, 58, 52, 16, 1, 'primary', 'ink', -3), R(22, 40, 50, 16, 1, 'highlight', 'ink', 4), R(30, 22, 44, 16, 1, 'secondary', 'ink', -7), R(40, 4, 34, 16, 1, 'primary', 'ink', 9)],
	domino: [...[0, 1, 2, 3].map((i) => R(12 + i * 21, 36 - i * 2, 12, 56, 2, i === 0 ? 'primary' : 'bg', 'ink', i * 9)), L([[4, 94], [96, 94]], 3, 'ink')],
	briefcase: [R(10, 32, 80, 54, 5, 'secondary', 'ink'), R(38, 18, 24, 14, 3, 'none', 'ink'), R(10, 52, 80, 6, 0, 'shadow'), R(44, 48, 12, 14, 2, 'highlight', 'ink')],
	globe: [E(50, 50, 40, 40, 'secondary', 'ink'), E(50, 50, 18, 40, 'none', 'ink'), L([[10, 50], [90, 50]], 2.4, 'ink'), L([[16, 30], [84, 30]], 2, 'ink'), L([[16, 70], [84, 70]], 2, 'ink')],
	bulb: [P([[50, 6], [76, 22], [78, 46], [62, 64], [38, 64], [22, 46], [24, 22]], 'highlight', true, 'ink'), R(38, 66, 24, 8, 2, 'shadow', 'ink'), R(40, 76, 20, 8, 2, 'shadow', 'ink'), L([[42, 46], [50, 34], [58, 46]], 2.4, 'ink')],
	magnifier: [E(42, 40, 28, 28, 'bg', 'ink'), E(42, 40, 21, 21, 'secondary'), L([[62, 60], [90, 90]], 9, 'ink'), L([[30, 30], [38, 24]], 3, 'bg')],
	factory: [P([[8, 92], [8, 50], [30, 62], [30, 50], [52, 62], [52, 50], [74, 62], [74, 22], [92, 22], [92, 92]], 'secondary', false, 'ink'), ...[16, 38, 60].map((x) => R(x, 72, 10, 10, 1, 'highlight')), E(84, 12, 8, 6, 'shadow'), E(74, 6, 6, 4, 'shadow')],
	cash: [R(8, 30, 84, 44, 3, 'secondary', 'ink'), E(50, 52, 13, 13, 'bg', 'ink'), R(14, 36, 8, 8, 1, 'highlight'), R(78, 60, 8, 8, 1, 'highlight'), R(12, 78, 76, 5, 1, 'shadow'), R(16, 86, 68, 5, 1, 'shadow')],
	lock: [R(22, 44, 56, 46, 6, 'primary', 'ink'), L([[34, 44], [34, 28], [50, 14], [66, 28], [66, 44]], 7, 'ink', true), E(50, 62, 6, 6, 'ink'), L([[50, 64], [50, 76]], 5, 'ink')],
	'arrow-down': [L([[10, 20], [36, 44], [52, 30], [84, 76]], 8, 'primary'), P([[92, 88], [66, 80], [86, 62]], 'primary')],
	'arrow-up': [L([[10, 80], [36, 56], [52, 70], [84, 24]], 8, 'primary'), P([[92, 12], [66, 20], [86, 38]], 'primary')],
	keyboard: [R(6, 30, 88, 44, 5, 'shadow', 'ink'), ...grid(12, 36, 9, 3, 8.6, 9, 6.6, 6.6, 'bg'), R(28, 63, 44, 6, 2, 'bg')],
	paw: [E(50, 64, 22, 18, 'ink'), E(24, 40, 9, 12, 'ink'), E(42, 26, 9, 12, 'ink'), E(60, 26, 9, 12, 'ink'), E(77, 40, 9, 12, 'ink')],
	mouse: [E(46, 58, 30, 20, 'shadow', 'ink'), E(24, 40, 10, 10, 'shadow', 'ink'), E(40, 34, 10, 10, 'shadow', 'ink'), E(22, 58, 2.6, 2.6, 'ink'), L([[76, 62], [92, 54], [98, 66]], 2.6, 'ink', true)],
	brain: [P([[30, 20], [50, 10], [72, 18], [86, 38], [82, 62], [64, 78], [40, 80], [20, 66], [14, 42]], 'primary', true, 'ink'), L([[50, 12], [46, 34], [56, 52], [48, 78]], 2.6, 'ink', true), L([[24, 44], [38, 40], [44, 50]], 2.4, 'ink', true), L([[62, 28], [70, 40], [82, 42]], 2.4, 'ink', true)],
	paper: [P([[22, 6], [64, 6], [80, 22], [80, 94], [22, 94]], 'bg', false, 'ink'), P([[64, 6], [64, 22], [80, 22]], 'shadow', false, 'ink'), ...[36, 48, 60, 72].map((y) => L([[32, y], [70, y]], 2.4, 'shadow')), E(64, 80, 9, 9, 'primary')],
	wave: [P([[0, 60], [14, 40], [30, 26], [48, 26], [58, 38], [52, 50], [44, 46], [48, 38], [40, 36], [34, 48], [44, 64], [70, 66], [100, 58], [100, 100], [0, 100]], 'secondary', true)],
};

const zig = (x0: number, y0: number, x1: number, y1: number, n: number, amp: number) =>
	Array.from({length: n + 1}, (_, i) => [x0 + ((x1 - x0) * i) / n + (i % 2 ? amp : -amp), y0 + ((y1 - y0) * i) / n]);

/** Prop states that work in every style: `broken` adds a crack in bg colour, `small` shrinks. */
export const withState = (shapes: Shape[], state?: string): Shape[] => {
	if (state === 'broken') return [...shapes, {t: 'line', pts: zig(56, 2, 40, 98, 7, 7), w: 3.4, stroke: 'bg'}, {t: 'line', pts: zig(57.5, 2, 41.5, 98, 7, 7), w: 1.2, stroke: 'ink'}];
	return shapes;
};
export const getProp = (id: string, def?: {base?: string; shapes?: Shape[]}): Shape[] => {
	const s = def?.shapes ?? PROPS[def?.base ?? id];
	if (!s) throw new Error(`film-studio: prop "${id}" has no shapes and no library base`);
	return s;
};
