import {random} from 'remotion';
import type {PanelDef, Zone, Zones} from './types';

type Side = 't' | 'b' | 'l' | 'r';
/** Cut a slice off one side of a zone. Returns [slice, rest]. */
export const cut = (z: Zone, side: Side, frac: number, gap = 0): [Zone, Zone] => {
	if (side === 't') return [{...z, h: z.h * frac}, {...z, y: z.y + z.h * frac + gap, h: z.h * (1 - frac) - gap}];
	if (side === 'b') return [{...z, y: z.y + z.h * (1 - frac), h: z.h * frac}, {...z, h: z.h * (1 - frac) - gap}];
	if (side === 'l') return [{...z, w: z.w * frac}, {...z, x: z.x + z.w * frac + gap, w: z.w * (1 - frac) - gap}];
	return [{...z, x: z.x + z.w * (1 - frac), w: z.w * frac}, {...z, w: z.w * (1 - frac) - gap}];
};
export const inset = (z: Zone, dx: number, dy = dx): Zone => ({x: z.x + dx, y: z.y + dy, w: z.w - dx * 2, h: z.h - dy * 2});
export const rows = (z: Zone, n: number, gap = 0): Zone[] => Array.from({length: n}, (_, i) => ({x: z.x, y: z.y + (i * (z.h + gap)) / n, w: z.w, h: (z.h + gap) / n - gap}));
export const cols = (z: Zone, n: number, gap = 0): Zone[] => Array.from({length: n}, (_, i) => ({x: z.x + (i * (z.w + gap)) / n, y: z.y, w: (z.w + gap) / n - gap, h: z.h}));
/** Largest box of aspect vb that fits the zone. ay: 0 top, 0.5 middle, 1 bottom. */
export const fitBox = (z: Zone, vb: [number, number], ax = 0.5, ay = 1): Zone => {
	const s = Math.min(z.w / vb[0], z.h / vb[1]);
	const w = vb[0] * s, h = vb[1] * s;
	return {x: z.x + (z.w - w) * ax, y: z.y + (z.h - h) * ay, w, h};
};

/** Height in px of a text at a kind's type size inside a width. Supplied by Panel (needs the loaded fonts). */
export type Measure = (text: string, kind: 'hero' | 'h1' | 'h2' | 'kicker' | 'sub' | 'label' | 'body' | 'attrib' | 'numeral', w: number, k?: number) => number;
type Item = {name: string; h?: number; flex?: number; max?: number; k?: number};

/**
 * Vertical stack. Fixed items keep their measured height, flex items share what is left (up to max),
 * and any slack is placed by ay (0 top .. 1 bottom) so the group sits on the anchor, never stranded.
 */
export const stack = (frame: Zone, items: Item[], gap: number, ay: number, out: Zones = {}): Zones => {
	const gaps = gap * Math.max(0, items.length - 1);
	const fixed = items.reduce((q, i) => q + (i.h ?? 0), 0);
	const shrink = fixed > frame.h - gaps ? Math.max(0.1, (frame.h - gaps) / fixed) : 1;
	const left = Math.max(0, frame.h - gaps - fixed * shrink);
	const fsum = items.reduce((q, i) => q + (i.flex ?? 0), 0);
	const hs = items.map((i) => (i.flex ? Math.min(i.max ?? Infinity, (left * i.flex) / fsum) : (i.h ?? 0) * shrink));
	const slack = Math.max(0, frame.h - gaps - hs.reduce((q, h) => q + h, 0));
	let y = frame.y + slack * ay;
	items.forEach((it, i) => {
		const k = (it.k ?? 1) * shrink;
		out[it.name] = {x: frame.x, y, w: frame.w, h: hs[i], ...(k !== 1 ? {k} : {})};
		y += hs[i] + gap;
	});
	return out;
};

/**
 * Named zones for a panel. Text is measured first and keeps only the room it needs; the visual takes
 * the rest, so a frame is filled at any ratio. `anchor` picks the edge the text hugs; when a panel has
 * none it comes from the style's allowed anchors, chosen by seed, so two films in one style do not
 * share compositions.
 */
export const zonesFor = (panel: PanelDef, frame: Zone, portrait: boolean, anchors: string[], seed: string, u: number, mh: Measure): Zones => {
	const a = panel.anchor ?? anchors[Math.floor(random(`${seed}-${panel.id}-anchor`) * anchors.length) % anchors.length] ?? 'tl';
	const v: Side = a.includes('b') ? 'b' : 't';
	const h: Side = a.includes('r') ? 'r' : 'l';
	const o: Side = h === 'l' ? 'r' : 'l';
	const ay = a.includes('t') ? 0.24 : a.includes('b') ? 0.76 : 0.5;
	const s = panel.slots;
	const g = u * 3;
	const pad = u * 1.2;
	const L = panel.layout;
	const z: Zones = {frame, _anchor: {x: h === 'l' ? 0 : 1, y: v === 't' ? 0 : 1, w: 0, h: 0}};
	const hasVisual = !!(s.cast?.length || s.prop || s.media);
	const side = !portrait && (hasVisual || L === 'chart') && L !== 'versus' && L !== 'timeline' && L !== 'list';
	// the column the text lives in: the full frame in portrait, one side in landscape
	let col = frame, sideZone: Zone | undefined;
	if (side) [col, sideZone] = cut(frame, h, L === 'figure' ? 0.46 : 0.42, g * 2);
	else if (!portrait && (L === 'title' || L === 'quote' || L === 'stat')) col = cut(frame, h, 0.8)[0];
	const T = (name: string, text: string | undefined, kind: Parameters<Measure>[1], k = 1, w = col.w): Item[] => (text ? [{name, h: mh(text, kind, w, k) + pad, k}] : []);
	const big = hasVisual ? 1 : portrait ? 1.45 : 1.25;
	const vis = (name: string, max: number): Item[] => (side ? [] : [{name, flex: 1, max}]);
	const order = (text: Item[], visual: Item[]) => (v === 'b' ? [...visual, ...text] : [...text, ...visual]);
	if (L === 'title') {
		stack(col, order([...T('kicker', s.kicker, 'kicker', 1.2), ...T('headline', s.headline, 'hero', big), ...T('sub', s.sub, 'sub', big > 1 ? 1.2 : 1)], hasVisual ? vis('visual', frame.w * 1.25) : []), g * 0.5, ay, z);
	} else if (L === 'object') {
		const top = [...T('kicker', s.kicker, 'kicker', 1.2), ...T('headline', s.headline, 'h1')];
		const sub = T('sub', s.sub, 'sub', 1.15);
		stack(col, v === 'b' ? [...vis('visual', frame.w * 1.1), ...top, ...sub] : [...top, ...vis('visual', frame.w * 1.1), ...sub], g * 0.6, 0.5, z);
	} else if (L === 'quote') {
		stack(col, order([...T('quote', s.quote?.text, 'h1', big * 0.95), ...T('attrib', s.quote?.by, 'attrib', 1.3)], hasVisual ? vis('visual', frame.w) : []), g, ay, z);
	} else if (L === 'stat') {
		const nk = hasVisual ? 1 : portrait ? 1.5 : 1.2;
		const num: Item[] = s.stat ? [{name: 'numeral', h: mh(s.stat.value + (s.stat.unit ?? ''), 'numeral', col.w * 0.8, nk) * 1.45, k: nk}] : [];
		stack(col, order([...T('kicker', s.kicker, 'kicker', 1.2), ...num, ...T('label', s.stat?.label, 'label', 1.5), ...T('headline', s.headline, 'h2'), ...T('sub', s.sub, 'sub')], hasVisual ? vis('visual', frame.w) : []), g * 0.5, ay, z);
	} else if (L === 'figure') {
		stack(col, order([...T('kicker', s.kicker, 'kicker', 1.2), ...T('headline', s.headline, 'h1'), ...T('sub', s.sub, 'sub')], vis('visual', frame.w * 1.5)), g * 0.6, side ? 0.5 : ay, z);
	} else if (L === 'chart') {
		const top = [...T('kicker', s.kicker, 'kicker', 1.2), ...T('headline', s.headline, 'h1')];
		const sub = T('sub', s.sub, 'sub');
		stack(col, side ? [...top, ...sub] : [...top, {name: 'chart', flex: 1, max: frame.w * 1.05}, ...sub], g * 0.6, 0.5, z);
		if (side && sideZone) z.chart = inset(sideZone, 0, sideZone.h * 0.06);
	} else if (L === 'versus') {
		stack(frame, [...T('headline', s.headline, 'h1', 1, frame.w), {name: 'body', flex: 1, max: portrait ? frame.w * 1.15 : frame.h}], g, 0.5, z);
		const [A, B] = cols(z.body, 2, g * 1.4);
		const off = z.body.h * 0.06; // offset the two sides so the pair is not a mirror image
		[A, B].forEach((c, i) => {
			const sd = s.sides?.[i];
			const key = i ? 'sideB' : 'sideA';
			const cz = i ? {...c, y: c.y + off, h: c.h - off} : {...c, h: c.h - off};
			z[key] = cz;
			stack(cz, [{name: key + '_v', flex: 1}, ...T(key + '_l', sd?.label, 'label', 1.5, c.w), ...(sd?.value ? [{name: key + '_n', h: mh(sd.value, 'numeral', c.w * 0.8, 0.55) * 1.5, k: 0.55}] : [])], g * 0.3, 0.5, z);
		});
	} else {
		// timeline, list
		const tl = L === 'timeline';
		const n = (tl ? s.points?.length : s.items?.length) ?? 0;
		const headItems = T('headline', s.headline, 'h1', 1, frame.w);
		if (tl && !portrait) {
			stack(frame, [...headItems, {name: 'body', flex: 1, max: frame.h * 0.5}], g, 0.5, z);
			cols(z.body, n, g).forEach((c, i) => {
				const pt = s.points![i];
				stack(c, [{name: `pt${i}w`, h: mh(pt.when, 'h2', c.w * 0.8) * 1.6}, ...T(`pt${i}t`, pt.what, 'body', 1.2, c.w)], g * 0.4, 0, z);
				z[`pt${i}`] = c;
			});
		} else {
			const area = portrait ? frame : cut(frame, h, 0.72)[0];
			const wW = tl ? area.w * 0.36 : u * 10;
			const tW = area.w - wW - g;
			const rowsI: Item[] = [];
			const th: number[] = [];
			for (let i = 0; i < n; i++) {
				th[i] = mh(tl ? s.points![i].what : s.items![i], 'body', tW, 1.45);
				rowsI.push({name: `pt${i}row`, h: Math.max(th[i], tl ? mh(s.points![i].when, 'h2', wW * 0.8) * 1.7 : u * 9) + pad});
			}
			stack(area, [...headItems.map((it) => ({...it, h: it.h! + g})), ...rowsI], g * 0.7, ay, z);
			for (let i = 0; i < n; i++) {
				const r = z[`pt${i}row`];
				const hh = Math.min(r.h, th[i] * (r.k ?? 1));
				z[`pt${i}w`] = {x: r.x, y: r.y, w: wW, h: r.h};
				z[`pt${i}t`] = {x: r.x + wW + g, y: r.y + (r.h - hh) / 2, w: tW, h: hh, k: (r.k ?? 1) * 1.45};
				z[`pt${i}`] = z[`pt${i}t`];
			}
			z.body = area;
		}
	}
	if (side && sideZone && L !== 'chart') z.visual = sideZone;
	if (z.visual && L === 'figure') {
		z.visual_full = z.visual;
		if (s.cast?.some((c) => c.says)) {
			const [fig, rest] = cut(z.visual, o, 0.64, g * 0.5);
			z.visual = fig;
			z.bubble = cut(rest, 't', 0.3)[0];
		}
	}
	return z;
};
