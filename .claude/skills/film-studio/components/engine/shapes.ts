import {random} from 'remotion';
import type {Shape} from './types';

const f = (n: number) => Math.round(n * 100) / 100;
const rot = (x: number, y: number, cx: number, cy: number, deg: number): [number, number] => {
	const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
	return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
};

/** Catmull-Rom spline sampled to a dense point list. */
export const spline = (pts: number[][], closed: boolean, seg = 8): number[][] => {
	const n = pts.length, out: number[][] = [];
	const g = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
	for (let i = 0; i < (closed ? n : n - 1); i++) {
		const [p0, p1, p2, p3] = [g(i - 1), g(i), g(i + 1), g(i + 2)];
		for (let s = 0; s < seg; s++) {
			const t = s / seg, t2 = t * t, t3 = t2 * t;
			out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
		}
	}
	if (!closed) out.push(pts[n - 1]);
	return out;
};

/** Outline of any shape as a point list (lines return their centre line). */
export const outline = (s: Shape, seg = 8): number[][] => {
	if (s.t === 'rect') {
		const r = Math.min(s.r ?? 0, s.w / 2, s.h / 2);
		let pts: number[][] = [];
		if (r > 0.01) {
			const corners = [[s.x + s.w - r, s.y + r, -90], [s.x + s.w - r, s.y + s.h - r, 0], [s.x + r, s.y + s.h - r, 90], [s.x + r, s.y + r, 180]];
			for (const [cx, cy, a0] of corners) for (let i = 0; i <= 4; i++) {
				const a = ((a0 + (i * 90) / 4) * Math.PI) / 180;
				pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
			}
		} else pts = [[s.x, s.y], [s.x + s.w, s.y], [s.x + s.w, s.y + s.h], [s.x, s.y + s.h]];
		return s.rot ? pts.map(([x, y]) => rot(x, y, s.x + s.w / 2, s.y + s.h / 2, s.rot!)) : pts;
	}
	if (s.t === 'ellipse') {
		const pts: number[][] = [];
		for (let i = 0; i < 28; i++) {
			const a = (i / 28) * Math.PI * 2;
			pts.push([s.cx + Math.cos(a) * s.rx, s.cy + Math.sin(a) * s.ry]);
		}
		return s.rot ? pts.map(([x, y]) => rot(x, y, s.cx, s.cy, s.rot!)) : pts;
	}
	if (s.t === 'poly') return s.smooth ? spline(s.pts, true, seg) : s.pts;
	return s.smooth && s.pts.length > 2 ? spline(s.pts, false, seg) : s.pts;
};

export const ptsToD = (pts: number[][], closed: boolean) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join('') + (closed ? 'Z' : '');
export const toD = (s: Shape) => ptsToD(outline(s), s.t !== 'line');

/** Seeded wobble of an outline: `amp` in shape units. Resamples long edges so straight lines also wobble. */
export const wobble = (pts: number[][], amp: number, seed: string, closed: boolean, step = 9): number[][] => {
	const out: number[][] = [];
	const n = pts.length;
	for (let i = 0; i < (closed ? n : n - 1); i++) {
		const a = pts[i], b = pts[(i + 1) % n];
		const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
		const k = Math.max(1, Math.round(len / step));
		for (let j = 0; j < k; j++) out.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k]);
	}
	if (!closed) out.push(pts[n - 1]);
	return out.map(([x, y], i) => [x + (random(`${seed}x${i}`) - 0.5) * 2 * amp, y + (random(`${seed}y${i}`) - 0.5) * 2 * amp]);
};
export const smoothD = (pts: number[][], closed: boolean) => ptsToD(spline(pts, closed, 5), closed);

export const bbox = (shapes: Shape[]) => {
	let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
	for (const s of shapes) for (const [x, y] of outline(s, 3)) {
		const pad = s.t === 'line' ? s.w / 2 : 0;
		x0 = Math.min(x0, x - pad); y0 = Math.min(y0, y - pad); x1 = Math.max(x1, x + pad); y1 = Math.max(y1, y + pad);
	}
	return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
};

const inPoly = (x: number, y: number, p: number[][]) => {
	let c = false;
	for (let i = 0, j = p.length - 1; i < p.length; j = i++)
		if (p[i][1] > y !== p[j][1] > y && x < ((p[j][0] - p[i][0]) * (y - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
	return c;
};
const distSeg = (x: number, y: number, a: number[], b: number[]) => {
	const dx = b[0] - a[0], dy = b[1] - a[1];
	const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)));
	return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t);
};

/**
 * Rasterise shapes to a cols x rows grid. Returns for each cell the index of the top shape (or -1).
 * Used by pixel-art (hard grid) and by anything that needs a mask.
 */
export const rasterize = (shapes: Shape[], vb: [number, number], cols: number, rows: number, minLine = 1): Int16Array => {
	const grid = new Int16Array(cols * rows).fill(-1);
	const cw = vb[0] / cols, ch = vb[1] / rows;
	shapes.forEach((s, si) => {
		if (s.fill === 'none' && s.t !== 'line' && (!s.stroke || s.stroke === 'none')) return;
		const o = outline(s, 6);
		const half = s.t === 'line' ? Math.max(s.w / 2, (minLine * cw) / 2) : 0;
		const xs = o.map((p) => p[0]), ys = o.map((p) => p[1]);
		const c0 = Math.max(0, Math.floor((Math.min(...xs) - half) / cw)), c1 = Math.min(cols - 1, Math.ceil((Math.max(...xs) + half) / cw));
		const r0 = Math.max(0, Math.floor((Math.min(...ys) - half) / ch)), r1 = Math.min(rows - 1, Math.ceil((Math.max(...ys) + half) / ch));
		for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
			const x = (c + 0.5) * cw, y = (r + 0.5) * ch;
			let hit = false;
			if (s.t === 'line') {
				for (let i = 0; i < o.length - 1 && !hit; i++) hit = distSeg(x, y, o[i], o[i + 1]) <= half;
			} else if (s.fill === 'none') {
				const sw = Math.max((s.sw ?? 2) / 2, cw * 0.6);
				for (let i = 0; i < o.length && !hit; i++) hit = distSeg(x, y, o[i], o[(i + 1) % o.length]) <= sw;
			} else hit = inPoly(x, y, o);
			if (hit) grid[r * cols + c] = si;
		}
	});
	return grid;
};
