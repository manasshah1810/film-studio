import type {CastDef, Expr, FigureTemplate, Pose, Role, Shape} from './types';

/** Figure box is 100 wide, 200 tall; feet on y = 196; the figure faces right. */
export const FIG_VB: [number, number] = [100, 200];
type Char = Extract<CastDef, {kind: 'character'}>;
type P = {lean: number; head: number; af: [number, number]; ab: [number, number]; lf: [number, number]; lb: [number, number]; dy?: number; rot?: number};

/** Angles in degrees from straight down; positive swings toward the facing side. [upper, bend of lower]. */
const POSES: Record<Pose, P> = {
	idle: {lean: 0, head: 0, af: [10, -8], ab: [-10, 8], lf: [5, 0], lb: [-5, 0]},
	point: {lean: 3, head: -4, af: [98, 6], ab: [-14, 20], lf: [8, 0], lb: [-8, 0]},
	walk: {lean: 6, head: 0, af: [-32, -25], ab: [34, -30], lf: [26, 8], lb: [-24, 26]},
	run: {lean: 16, head: 4, af: [-60, -85], ab: [62, -80], lf: [52, 36], lb: [-42, 74]},
	cheer: {lean: -2, head: -10, af: [158, 14], ab: [-158, -14], lf: [12, 0], lb: [-12, 0], dy: -5},
	slump: {lean: 20, head: 30, af: [8, 4], ab: [14, 6], lf: [6, 4], lb: [-3, 6], dy: 3},
	think: {lean: 2, head: -8, af: [38, -128], ab: [-6, -74], lf: [5, 0], lb: [-6, 0]},
	shrug: {lean: 0, head: 8, af: [48, -118], ab: [-48, 118], lf: [7, 0], lb: [-7, 0]},
	hold: {lean: 2, head: 6, af: [62, -52], ab: [40, -46], lf: [6, 0], lb: [-6, 0]},
	fall: {lean: 0, head: -18, af: [150, 22], ab: [-118, -30], lf: [42, 30], lb: [-30, 52], rot: 68, dy: 20},
	reach: {lean: 10, head: -6, af: [132, 4], ab: [-24, 14], lf: [14, 0], lb: [-16, 12]},
};

const rad = (d: number) => (d * Math.PI) / 180;
/** Point at `len` from `o`, angle measured from straight down, positive toward +x. */
const at = (o: number[], deg: number, len: number) => [o[0] + Math.sin(rad(deg)) * len, o[1] + Math.cos(rad(deg)) * len];

export const buildFigure = (c: Char, pose: Pose = 'idle', expr: Expr = 'neutral', tpl: FigureTemplate & {skin?: Role; limbRole?: 'ink' | 'color' | 'skin'}): Shape[] => {
	if (c.species === 'cat') return buildCat(c, pose, expr, tpl);
	const p = POSES[pose] ?? POSES.idle;
	const skin: Role = tpl.skin ?? 'bg';
	const bw = tpl.bodyW * (c.build === 'slim' ? 0.82 : c.build === 'broad' ? 1.24 : 1);
	const limbRole: Role = tpl.limbRole === 'color' ? c.color : tpl.limbRole === 'skin' ? skin : 'ink';
	const hr = tpl.headShape === 'none' ? 0 : tpl.head;
	const neck = tpl.body === 'line' ? 2 : 3;
	const below = 190 - hr * 2 - neck;
	const legLen = (below * tpl.legLen) / (tpl.legLen + (tpl.torso ?? 50));
	const torso = below - legLen;
	const hip = [50, 196 - legLen * Math.cos(rad(Math.max(Math.abs(p.lf[0]), Math.abs(p.lb[0])) * 0.55)) + (p.dy ?? 0)];
	const sh = at(hip, 180 - p.lean, torso);
	const hc = at(sh, 180 - p.lean - p.head * 0.5, neck + hr);
	const out: Shape[] = [];
	const limb = (o: number[], [a, b]: [number, number], len: number, role: Role, tag: string, end: 'hand' | 'foot') => {
		const mid = at(o, a, len / 2);
		const tip = at(mid, a + b, len / 2);
		const w = tpl.limb * (tag.startsWith('leg') && tpl.limbStyle !== 'line' ? 1.15 : 1);
		out.push({t: 'line', pts: tpl.limbStyle === 'noodle' ? [o, [(o[0] + mid[0]) / 2 + (mid[1] - o[1]) * 0.06, (o[1] + mid[1]) / 2], mid, tip] : [o, mid, tip], w, smooth: tpl.limbStyle === 'noodle', stroke: role, tag});
		if (end === 'hand' && tpl.hands) out.push({t: 'ellipse', cx: tip[0], cy: tip[1], rx: w * 0.85, ry: w * 0.85, fill: skin, stroke: 'ink', tag: 'hand'});
		if (end === 'foot' && tpl.feet) out.push({t: 'ellipse', cx: tip[0] + w * 0.7, cy: tip[1] - w * 0.1, rx: w * 1.25, ry: w * 0.62, fill: 'ink', tag: 'foot'});
		return tip;
	};
	const shOff = tpl.body === 'line' ? 0 : bw * 0.32;
	// back limbs
	limb([sh[0] - shOff * 0.6, sh[1] + 3], p.ab, tpl.armLen, limbRole, 'arm-b', 'hand');
	limb([hip[0] - bw * 0.18, hip[1]], p.lb, legLen, limbRole === c.color ? 'ink' : limbRole, 'leg-b', 'foot');
	// body
	const ax = [Math.cos(rad(p.lean)), Math.sin(rad(p.lean))]; // across-body direction (roughly x)
	const side = (o: number[], k: number) => [o[0] + ax[0] * k, o[1] - ax[1] * k * -1];
	const prof: Record<string, [number, number, boolean]> = {bean: [0.46, 0.5, true], block: [0.5, 0.5, false], taper: [0.62, 0.36, false], drop: [0.3, 0.62, true]};
	if (tpl.body === 'line') out.push({t: 'line', pts: [sh, hip], w: tpl.limb, stroke: 'ink', tag: 'body'});
	else {
		const [ws, wh, sm] = prof[tpl.body];
		const top = [sh[0], sh[1] - 1], bot = [hip[0], hip[1] + (sm ? 4 : 2)];
		const pts = sm
			? [side(top, -bw * ws), [top[0], top[1] - 3], side(top, bw * ws), side([(top[0] + bot[0]) / 2, (top[1] + bot[1]) / 2], bw * (ws + wh) * 0.56), side(bot, bw * wh), [bot[0], bot[1] + 3], side(bot, -bw * wh), side([(top[0] + bot[0]) / 2, (top[1] + bot[1]) / 2], -bw * (ws + wh) * 0.56)]
			: [side(top, -bw * ws), side(top, bw * ws), side(bot, bw * wh), side(bot, -bw * wh)];
		out.push({t: 'poly', pts, smooth: sm, fill: c.color, stroke: 'ink', tag: 'body'});
	}
	limb([hip[0] + bw * 0.18, hip[1]], p.lf, legLen, limbRole === c.color ? 'ink' : limbRole, 'leg-f', 'foot');
	// accessories on the body
	if (c.accessory === 'tie' && tpl.body !== 'line') out.push({t: 'poly', pts: [[sh[0] + 2, sh[1] + 2], [sh[0] + 6, sh[1] + 5], [sh[0] + 4.5, sh[1] + torso * 0.5], [sh[0] + 1, sh[1] + torso * 0.42]], fill: 'highlight', tag: 'acc'});
	if (c.accessory === 'scarf') out.push({t: 'line', pts: [[sh[0] - bw * 0.3, sh[1]], [sh[0] + bw * 0.34, sh[1] + 2], [sh[0] + bw * 0.2, sh[1] + 16]], w: Math.max(5, tpl.limb * 1.2), stroke: 'secondary', tag: 'acc'});
	// head
	const tilt = p.head;
	if (hr > 0) {
		if (tpl.headShape === 'block') out.push({t: 'rect', x: hc[0] - hr, y: hc[1] - hr, w: hr * 2, h: hr * 2, r: hr * 0.34, rot: tilt, fill: skin, stroke: 'ink', tag: 'head'});
		else out.push({t: 'ellipse', cx: hc[0], cy: hc[1], rx: hr * (tpl.headShape === 'oval' ? 0.86 : 1), ry: hr, rot: tilt, fill: skin, stroke: 'ink', tag: 'head'});
		const hx = (dx: number, dy: number) => {
			const a = rad(tilt);
			return [hc[0] + dx * hr * Math.cos(a) - dy * hr * Math.sin(a), hc[1] + dx * hr * Math.sin(a) + dy * hr * Math.cos(a)];
		};
		const hairRole: Role = skin === 'ink' ? 'shadow' : 'ink';
		if (c.hair === 'short') out.push({t: 'poly', pts: [hx(-1.04, 0.1), hx(-0.9, -0.72), hx(-0.2, -1.12), hx(0.62, -0.98), hx(1.02, -0.36), hx(0.5, -0.5), hx(-0.4, -0.42), hx(-0.72, 0.16)], smooth: true, fill: hairRole, tag: 'hair'});
		if (c.hair === 'bun') { out.push({t: 'ellipse', cx: hx(-0.72, -0.98)[0], cy: hx(-0.72, -0.98)[1], rx: hr * 0.44, ry: hr * 0.44, fill: hairRole, tag: 'hair'}); out.push({t: 'poly', pts: [hx(-1.05, 0.3), hx(-0.92, -0.74), hx(0, -1.1), hx(0.86, -0.7), hx(0.3, -0.62), hx(-0.6, -0.3)], smooth: true, fill: hairRole, tag: 'hair'}); }
		if (c.hair === 'spike') out.push({t: 'poly', pts: [hx(-1.02, -0.1), hx(-1.2, -0.9), hx(-0.62, -0.74), hx(-0.5, -1.42), hx(0, -0.9), hx(0.4, -1.4), hx(0.6, -0.8), hx(1.16, -0.86), hx(0.98, -0.24), hx(0, -0.56)], fill: hairRole, tag: 'hair'});
		if (c.hair === 'cap') { out.push({t: 'poly', pts: [hx(-1.04, -0.2), hx(-0.86, -0.86), hx(0, -1.14), hx(0.86, -0.86), hx(1.04, -0.3)], smooth: false, fill: c.color === 'primary' ? 'secondary' : 'primary', tag: 'hair'}); out.push({t: 'line', pts: [hx(0.9, -0.34), hx(1.7, -0.22)], w: hr * 0.2, stroke: 'ink', tag: 'hair'}); }
		if (c.hair === 'long') out.push({t: 'poly', pts: [hx(0.7, -0.84), hx(0, -1.14), hx(-0.9, -0.8), hx(-1.22, 0.3), hx(-1.3, 1.5), hx(-0.6, 1.3), hx(-0.7, 0.1), hx(-0.2, -0.5)], smooth: true, fill: hairRole, tag: 'hair'});
		if (c.accessory === 'crown') out.push({t: 'poly', pts: [hx(-0.8, -0.8), hx(-0.9, -1.7), hx(-0.4, -1.2), hx(0, -1.86), hx(0.4, -1.2), hx(0.9, -1.7), hx(0.8, -0.8)], fill: 'highlight', stroke: 'ink', tag: 'acc'});
		// face
		const fi: Role = skin === 'ink' || skin === 'shadow' ? 'bg' : 'ink';
		const ex = 0.22, eg = 0.42, ey = -0.08;
		const er = hr * (expr === 'shocked' ? 0.17 : 0.11);
		if (tpl.face === 'visor') out.push({t: 'rect', x: hx(-0.2, -0.26)[0], y: hx(-0.2, -0.26)[1], w: hr * 1.14, h: hr * 0.42, r: hr * 0.2, rot: tilt, fill: fi, tag: 'face'});
		else if (tpl.face !== 'none') {
			for (const k of [0, 1]) {
				const [x, y] = hx(ex + k * eg - 0.1, ey);
				if (tpl.face === 'line' && expr !== 'shocked') out.push({t: 'line', pts: [[x - er * 1.2, y + (expr === 'angry' ? (k ? -er : er) * 0.8 : 0)], [x + er * 1.2, y + (expr === 'angry' ? (k ? er : -er) * 0.8 : 0)]], w: hr * 0.1, stroke: fi, tag: 'face'});
				else out.push({t: 'ellipse', cx: x, cy: y, rx: er, ry: expr === 'happy' ? er * 0.72 : er * 1.2, fill: fi, tag: 'face'});
				if (tpl.face === 'brows' || expr === 'angry' || expr === 'worried' || expr === 'sad') {
					const s = expr === 'angry' ? (k ? -1 : 1) : expr === 'worried' || expr === 'sad' ? (k ? 1 : -1) : 0;
					const by = expr === 'shocked' ? -0.52 : -0.36;
					const a = hx(ex + k * eg - 0.26, by + s * 0.1), b = hx(ex + k * eg + 0.06, by - s * 0.1);
					out.push({t: 'line', pts: [a, b], w: hr * 0.09, stroke: fi, tag: 'face'});
				}
			}
			const mw = 0.3, mx = 0.34, my = 0.46;
			const m: Record<Expr, number[][]> = {
				neutral: [hx(mx - mw, my), hx(mx + mw, my)],
				happy: [hx(mx - mw, my - 0.08), hx(mx, my + 0.2), hx(mx + mw, my - 0.1)],
				sad: [hx(mx - mw, my + 0.14), hx(mx, my - 0.06), hx(mx + mw, my + 0.14)],
				worried: [hx(mx - mw, my + 0.08), hx(mx - 0.1, my - 0.04), hx(mx + 0.1, my + 0.08), hx(mx + mw, my)],
				smug: [hx(mx - mw, my + 0.06), hx(mx + 0.06, my + 0.08), hx(mx + mw, my - 0.14)],
				angry: [hx(mx - mw, my + 0.1), hx(mx, my), hx(mx + mw, my + 0.1)],
				shocked: [],
			};
			if (expr === 'shocked') out.push({t: 'ellipse', cx: hx(mx, my + 0.06)[0], cy: hx(mx, my + 0.06)[1], rx: hr * 0.16, ry: hr * 0.24, fill: fi, tag: 'face'});
			else out.push({t: 'line', pts: m[expr], w: hr * 0.1, smooth: true, stroke: fi, tag: 'face'});
		}
		if (c.accessory === 'glasses') for (const k of [0, 1]) { const [x, y] = hx(ex + k * eg - 0.1, ey); out.push({t: 'ellipse', cx: x, cy: y, rx: hr * 0.26, ry: hr * 0.26, fill: 'none', stroke: fi, sw: hr * 0.08, tag: 'acc'}); }
	}
	// front arm
	limb([sh[0] + shOff * 0.6, sh[1] + 3], p.af, tpl.armLen, limbRole, 'arm-f', 'hand');
	if (p.rot) return out.map((s) => rotShape(s, 50, 150, p.rot!));
	return out;
};

const rp = (p: number[], cx: number, cy: number, d: number) => {
	const a = rad(d), c = Math.cos(a), s = Math.sin(a);
	return [cx + (p[0] - cx) * c - (p[1] - cy) * s, cy + (p[0] - cx) * s + (p[1] - cy) * c];
};
export const rotShape = (s: Shape, cx: number, cy: number, d: number): Shape => {
	if (s.t === 'poly' || s.t === 'line') return {...s, pts: s.pts.map((p) => rp(p, cx, cy, d))};
	if (s.t === 'ellipse') { const [x, y] = rp([s.cx, s.cy], cx, cy, d); return {...s, cx: x, cy: y, rot: (s.rot ?? 0) + d}; }
	const [x, y] = rp([s.x + s.w / 2, s.y + s.h / 2], cx, cy, d);
	return {...s, x: x - s.w / 2, y: y - s.h / 2, rot: (s.rot ?? 0) + d};
};

/** A sitting cat in the same 100 x 200 box (lower half used). Poses: idle/think/smug sit; point/reach paw out; walk/run stand. */
const buildCat = (c: Char, pose: Pose, expr: Expr, tpl: FigureTemplate & {skin?: Role}): Shape[] => {
	const o: Shape[] = [];
	const col = c.color, k = tpl.body === 'line';
	const st = (s: Shape): Shape => (k ? {...s, fill: s.t === 'line' ? undefined : 'none', stroke: 'ink'} as Shape : s);
	const reach = pose === 'reach' || pose === 'point', stand = pose === 'walk' || pose === 'run';
	const hx = stand ? 72 : 58, hy = stand ? 112 : 96, hr = 21;
	// tail
	o.push({t: 'line', pts: stand ? [[18, 150], [6, 128], [12, 104], [22, 96]] : [[30, 188], [8, 186], [2, 162], [14, 148]], w: 7, smooth: true, stroke: k ? 'ink' : col, tag: 'limb'});
	if (stand) {
		o.push(st({t: 'poly', pts: [[16, 150], [30, 132], [60, 130], [76, 144], [72, 164], [40, 168], [20, 164]], smooth: true, fill: col, stroke: 'ink', tag: 'body'}));
		for (const [x, a] of [[24, -8], [36, 10], [60, -10], [70, 12]]) o.push({t: 'line', pts: [[x, 160], [x + a, 194]], w: 7, stroke: k ? 'ink' : col, tag: 'limb'});
	} else {
		o.push(st({t: 'poly', pts: [[40, 112], [62, 114], [74, 150], [72, 190], [26, 192], [22, 160]], smooth: true, fill: col, stroke: 'ink', tag: 'body'}));
		o.push({t: 'line', pts: [[62, 150], [64, 192]], w: 8, stroke: k ? 'ink' : col, tag: 'limb'});
		if (reach) o.push({t: 'line', pts: [[66, 132], [84, 128], [100, 134]], w: 8, smooth: true, stroke: k ? 'ink' : col, tag: 'arm-f'});
		else o.push({t: 'line', pts: [[52, 150], [50, 192]], w: 8, stroke: k ? 'ink' : col, tag: 'limb'});
	}
	// ears + head
	for (const s of [-1, 1]) o.push(st({t: 'poly', pts: [[hx + s * 19, hy - 8], [hx + s * 17, hy - 34], [hx + s * 3, hy - 18]], fill: col, stroke: 'ink', tag: 'head'}));
	o.push(st({t: 'ellipse', cx: hx, cy: hy, rx: hr + 3, ry: hr, fill: col, stroke: 'ink', tag: 'head'}));
	const fi: Role = k ? 'ink' : tpl.skin === 'ink' || col === 'ink' ? 'bg' : 'ink';
	if (tpl.face !== 'none') {
		for (const s of [-1, 1]) {
			if (expr === 'smug' || expr === 'happy') o.push({t: 'line', pts: [[hx + s * 10 - 5, hy - 3], [hx + s * 10, hy - 6], [hx + s * 10 + 5, hy - 3]], w: 2.4, smooth: true, stroke: fi, tag: 'face'});
			else o.push({t: 'ellipse', cx: hx + s * 10, cy: hy - 4, rx: expr === 'shocked' ? 5 : 3.2, ry: expr === 'shocked' ? 6 : 4.4, fill: fi, tag: 'face'});
		}
		o.push({t: 'poly', pts: [[hx - 3, hy + 4], [hx + 3, hy + 4], [hx, hy + 8]], fill: fi, tag: 'face'});
		for (const s of [-1, 1]) for (const d of [-3, 3]) o.push({t: 'line', pts: [[hx + s * 12, hy + 7], [hx + s * 30, hy + 5 + d]], w: 1.2, stroke: fi, tag: 'face'});
	}
	return o;
};
