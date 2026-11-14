import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Easing, Freeze, interpolate, spring, useCurrentFrame} from 'remotion';
import ds from '../../../styles/glowing-plexus/design-system.json';
import {FontGate} from '../../engine/fonts';
import {fontCss} from '../../engine/tokens';
import type {Pairing} from '../../engine/types';

/**
 * glowing-plexus specimen: one 6 s scene, 1080 x 1920 at 30 fps. A seeded network of 3 hub clusters and a loose web, projected from 3D
 * by hand onto a 2D canvas with additive compositing. Links fade with 3D distance, nodes grow with degree, the camera drifts forward
 * the whole time. Hub 1 fires; light packets run down a shortest path tree, cross a cause and effect bridge to hub 2, then to hub 3.
 * Each hub springs up (elastic zoom), opens an OrbitRing and pulls the RackFocus. Every position is a pure function of the seed and the
 * frame. All text is DOM, on plates with a bg scrim.
 */
export type PreviewProps = {palette?: string; pairing?: string};
export const PREVIEW_FRAMES = 180;
export const SHEET_FRAMES = [44, 96, 170];
const W = 1080;
const H = 1920;
const FPS = 30;
export const SHEET_SIZE = {width: W * SHEET_FRAMES.length, height: H};
const P = ds.plexus;
const M = ds.motion;
const T = ds.tokens;

/** Static text boxes in percent of the frame. Mirrored 1:1 by the storyboard that check-safezones reads. */
export const BOXES = {
	kicker: {x: 9, y: 6.5, w: 76, h: 2.4},
	title: {x: 9, y: 9.3, w: 76, h: 11},
	t1: {x: 38, y: 24, w: 40, h: 6.4},
	t2: {x: 22, y: 41.5, w: 40, h: 6.4},
	t3: {x: 40, y: 59, w: 40, h: 6.4},
	r1: {x: 9, y: 70, w: 24, h: 7.4},
	r2: {x: 35, y: 70, w: 24, h: 7.4},
	r3: {x: 61, y: 70, w: 24, h: 7.4},
};
type Box = {x: number; y: number; w: number; h: number};
const abs = (b: Box) => ({position: 'absolute', left: (b.x / 100) * W, top: (b.y / 100) * H, width: (b.w / 100) * W, height: (b.h / 100) * H}) as React.CSSProperties;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (n: keyof typeof M.easings) => Easing.bezier(...(M.easings[n] as [number, number, number, number]));
const seg = (f: number, a: number, b: number, e: keyof typeof M.easings = 'settle') => interpolate(f, [a, b], [0, 1], {...clamp, easing: ease(e)});
const sp = (f: number, start: number, cfg: keyof typeof M.springs) => (f < start ? 0 : spring({frame: f - start, fps: FPS, config: M.springs[cfg]}));
const rad = (d: number) => (d * Math.PI) / 180;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

type V3 = [number, number, number];
type RGB = [number, number, number];
const rgb = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${clamp01(a).toFixed(3)})`;
const mixRgb = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => Math.round(a[i] * (1 - t) + b[i] * t)) as RGB;
const mixHex = (a: string, b: string, t: number) => '#' + mixRgb(rgb(a), rgb(b), t).map((v) => v.toString(16).padStart(2, '0')).join('');
type Roles = Record<string, string>;

/** Focused palettes have 5 roles; secondary, dim and link are derived. Expanded palettes carry them. */
const rolesOf = (id: string): Roles => {
	const p = ds.palettes.find((x) => x.id === id) ?? ds.palettes[0];
	const r: Roles = {...(p.roles as Roles)};
	// text only ever uses palette roles: readout labels are dim when the palette has it, else primary
	r.label = r.dim ?? r.primary;
	r.secondary ??= mixHex(r.primary, r.ink, 0.45);
	r.dim ??= mixHex(r.ink, r.bg, 0.35);
	r.link ??= mixHex(r.primary, r.bg, 0.72);
	return r;
};

/* ---------- the seeded network: built once, never touched by a frame ---------- */
const fnv1a = (s: string) => {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
};
const mulberry32 = (seed: number) => {
	let a = seed | 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};
const dist3 = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** The three labelled hubs, in world units. Hub i fires at P.beats.fire[i]. */
export const HUBS: V3[] = [
	[-0.85, 1.55, 0.3],
	[1.15, 0.35, -0.4],
	[-0.75, -1.0, 0.6],
];
const FIRE = P.beats.fire;
type PNode = {p: V3; c: number; hub: number; ph: V3; per: number; delay: number};

const buildNet = () => {
	const rnd = mulberry32(fnv1a(P.seed));
	const range = (r: number[]) => r[0] + rnd() * (r[1] - r[0]);
	const gauss = () => {
		const u = Math.max(1e-6, rnd());
		const v = rnd();
		const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
		return Math.max(-P.clusters.clamp_sigma, Math.min(P.clusters.clamp_sigma, g));
	};
	const pts: {p: V3; c: number; hub: number}[] = HUBS.map((p, i) => ({p, c: i, hub: i}));
	const free = (p: V3) => pts.every((n) => dist3(n.p, p) >= P.min_spacing);
	const place = (gen: () => V3) => {
		for (let k = 0; k < 40; k++) {
			const p = gen();
			if (free(p)) return p;
		}
		return null;
	};
	for (let c = 0; c < HUBS.length; c++)
		for (let i = 0; i < P.clusters.nodes_each; i++) {
			const p = place(() => HUBS[c].map((v) => v + gauss() * P.clusters.sigma) as V3);
			if (p) pts.push({p, c, hub: -1});
		}
	for (let i = 0; i < P.scatter.nodes; i++) {
		const p = place(() => [range(P.field.x), range(P.field.y), range(P.field.z)]);
		if (!p) continue;
		let c = 0;
		HUBS.forEach((h, k) => {
			if (dist3(h, p) < dist3(HUBS[c], p)) c = k;
		});
		pts.push({p, c, hub: -1});
	}
	const nodes: PNode[] = pts.map((n) => ({...n, ph: [rnd() * 2 * Math.PI, rnd() * 2 * Math.PI, rnd() * 2 * Math.PI], per: range(P.drift.bob_period), delay: rnd() * M.intro.seeded_delay}));
	const N = nodes.length;
	const reach = (i: number) => (nodes[i].hub >= 0 ? P.hubs.reach : 1);
	const edges: {a: number; b: number; lim: number}[] = [];
	const adj: {j: number; d: number}[][] = nodes.map(() => []);
	for (let a = 0; a < N; a++)
		for (let b = a + 1; b < N; b++) {
			const d = dist3(nodes[a].p, nodes[b].p);
			const lim = P.edges.link * Math.max(reach(a), reach(b));
			if (d >= lim) continue;
			edges.push({a, b, lim});
			adj[a].push({j: b, d});
			adj[b].push({j: a, d});
		}
	const deg = adj.map((x) => x.length);
	const maxDeg = Math.max(...deg);
	const w = deg.map((d) => Math.pow(d / maxDeg, P.hubs.weight_pow));
	// arrival frames: a shortest path tree inside each hub's cluster, then a spill over any link to what is left
	const t = new Array<number>(N).fill(Infinity);
	const parent = new Array<number>(N).fill(-1);
	const hop = new Array<number>(N).fill(0);
	const run = (src: number[], ok: (j: number) => boolean) => {
		const q = [...src];
		while (q.length) {
			q.sort((x, y) => t[x] - t[y]);
			const u = q.shift() as number;
			for (const {j, d} of adj[u]) {
				if (!ok(j)) continue;
				const nt = t[u] + (P.pulse.hop_frames * d) / P.edges.link + P.pulse.hop_pad;
				if (nt < t[j]) {
					t[j] = nt;
					parent[j] = u;
					hop[j] = hop[u] + 1;
					q.push(j);
				}
			}
		}
	};
	HUBS.forEach((_, c) => {
		t[c] = FIRE[c];
		// a bridge is one more hop than the deepest node of the cluster it leaves
		hop[c] = c === 0 ? 0 : 1 + Math.max(...nodes.map((n, i) => (t[i] < Infinity && n.c === c - 1 ? hop[i] : 0)));
		run([c], (j) => nodes[j].c === c && nodes[j].hub < 0);
	});
	const left = new Set(nodes.map((_, i) => i).filter((i) => t[i] === Infinity));
	run(
		nodes.map((_, i) => i).filter((i) => t[i] < Infinity),
		(j) => left.has(j),
	);
	const dust = Array.from({length: P.dust.count}, () => ({p: [range(P.dust.x), range(P.dust.y), range(P.dust.z)] as V3, px: range(P.dust.px), a: range(P.dust.alpha)}));
	return {nodes, edges, w, t, parent, hop, dust, N};
};
export const NET = buildNet();
const LIT_TOTAL = NET.t.filter((x) => x < Infinity).length;

/* ---------- camera, drift, focus ---------- */
const FOCAL = H / 2 / Math.tan(rad(P.camera.fov / 2));
const S0 = FOCAL / P.camera.z_start;
const camZ = (f: number) => P.camera.z_start - P.drift.z_per_frame * f;
const posAt = (n: PNode, f: number): V3 => {
	const a = P.drift.bob_amp;
	const k = (2 * Math.PI * f) / n.per;
	return [n.p[0] + a * Math.sin(k + n.ph[0]), n.p[1] + a * Math.sin(k * 1.13 + n.ph[1]), n.p[2] + a * Math.sin(k * 0.87 + n.ph[2])];
};
const proj = (p: V3, cz: number) => {
	const d = cz - p[2];
	const s = FOCAL / d;
	return {x: W / 2 + p[0] * s, y: H / 2 - p[1] * s, s, d};
};
export const hubAt = (i: number, f: number) => proj(posAt(NET.nodes[i], f), camZ(f));
const focusAt = (f: number) => {
	const dOf = (i: number) => camZ(f) - posAt(NET.nodes[i], f)[2];
	const k1 = seg(f, FIRE[1], FIRE[1] + P.focus.move_frames, 'focus');
	const k2 = seg(f, FIRE[2], FIRE[2] + P.focus.move_frames, 'focus');
	return dOf(0) * (1 - k1) + k1 * (dOf(1) * (1 - k2) + dOf(2) * k2);
};
const zoomAt = (c: number, f: number) => 1 + (P.hub_zoom.to - 1) * sp(f, FIRE[c], 'hub_zoom');
const fog = (d: number) => interpolate(d, [8, 12.5], [1, 0.5], clamp);
const ringR = (c: number, f: number, s: number) => P.hub_zoom.ring_mult * P.hubs.core_px * zoomAt(c, f) * (s / S0);
const lastFired = (f: number) => FIRE.reduce((m, x, i) => (f >= x ? i : m), -1);

type Pal = Record<'bg' | 'ink' | 'primary' | 'secondary' | 'highlight', RGB>;

const draw = (ctx: CanvasRenderingContext2D, f: number, C: Pal, bgHex: string) => {
	const cz = camZ(f);
	const fd = focusAt(f);
	const clusterCol = (c: number) => (c === 1 ? C.secondary : C.primary);
	ctx.globalCompositeOperation = 'source-over';
	ctx.fillStyle = bgHex;
	ctx.fillRect(0, 0, W, H);
	ctx.globalCompositeOperation = 'lighter';
	ctx.lineCap = 'round';
	const glow = (x: number, y: number, r: number, col: RGB, a: number) => {
		if (a < 0.003 || r <= 0) return;
		const g = ctx.createRadialGradient(x, y, 0, x, y, r);
		g.addColorStop(0, rgba(col, a));
		g.addColorStop(1, rgba(col, 0));
		ctx.fillStyle = g;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, 2 * Math.PI);
		ctx.fill();
	};
	const dot = (x: number, y: number, r: number, col: RGB, a: number) => {
		if (a < 0.003) return;
		ctx.fillStyle = rgba(col, a);
		ctx.beginPath();
		ctx.arc(x, y, r, 0, 2 * Math.PI);
		ctx.fill();
	};
	const line = (x0: number, y0: number, x1: number, y1: number, wpx: number, col: RGB | CanvasGradient, a = 1) => {
		ctx.strokeStyle = Array.isArray(col) ? rgba(col, a) : col;
		ctx.lineWidth = wpx;
		ctx.beginPath();
		ctx.moveTo(x0, y0);
		ctx.lineTo(x1, y1);
		ctx.stroke();
	};

	// dust: far points, no links
	const dIn = seg(f, 0, 20);
	for (const d of NET.dust) {
		const q = proj(d.p, cz);
		dot(q.x, q.y, (d.px * q.s) / S0, C.primary, d.a * 0.6 * dIn);
	}

	const Q = NET.nodes.map((n) => {
		const p = posAt(n, f);
		const q = proj(p, cz);
		return {p, q, coc: Math.abs(q.d - fd) * P.focus.coc_px_per_unit, ia: seg(f, n.delay, n.delay + M.enter_frames)};
	});

	// links: alpha from the live 3D distance, so they breathe and never pop
	for (const e of NET.edges) {
		const A = Q[e.a];
		const B = Q[e.b];
		const d = dist3(A.p, B.p);
		if (d >= e.lim) continue;
		let a = P.edges.max_alpha * Math.pow(1 - d / e.lim, P.edges.falloff_pow);
		const child = NET.parent[e.b] === e.a ? e.b : NET.parent[e.a] === e.b ? e.a : -1;
		if (child >= 0 && f >= NET.t[child]) a = Math.min(1, a * P.edges.lit_boost + P.edges.lit_floor);
		const coc = (A.coc + B.coc) / 2;
		const sm = (A.q.s + B.q.s) / 2 / S0;
		a *= (fog((A.q.d + B.q.d) / 2) * Math.min(A.ia, B.ia)) / (1 + coc * 0.15);
		if (a < 0.004) continue;
		const ca = NET.nodes[e.a].c;
		const col = clusterCol(ca === NET.nodes[e.b].c ? ca : 0);
		line(A.q.x, A.q.y, B.q.x, B.q.y, P.edges.halo_px * sm + coc, col, a * P.edges.halo_alpha);
		line(A.q.x, A.q.y, B.q.x, B.q.y, P.edges.core_px * sm + coc * 0.3, col, a);
	}

	// cause and effect bridges, hub to hub: dashed and flowing until the packet lands, then solid
	const bIn = seg(f, 10, 30);
	for (const [ha, hb, dep] of P.beats.bridges) {
		const A = Q[ha].q;
		const B = Q[hb].q;
		const lit = f >= dep + P.pulse.bridge_frames;
		ctx.setLineDash(lit ? [] : [10, 14]);
		ctx.lineDashOffset = -f * 1.2;
		line(A.x, A.y, B.x, B.y, 2 * (A.s / S0), C.primary, (lit ? 0.75 : 0.3) * bIn);
		ctx.setLineDash([]);
	}

	// packets: a bright head with a fading tail, moving along a link from parent to child
	const packet = (A: {x: number; y: number}, B: {x: number; y: number}, u: number, tail: number, px: number) => {
		const h = clamp01(u);
		const t0 = clamp01(u - tail);
		if (h <= t0) return;
		const x0 = A.x + (B.x - A.x) * t0;
		const y0 = A.y + (B.y - A.y) * t0;
		const x1 = A.x + (B.x - A.x) * h;
		const y1 = A.y + (B.y - A.y) * h;
		const g = ctx.createLinearGradient(x0, y0, x1, y1);
		g.addColorStop(0, rgba(C.highlight, 0));
		g.addColorStop(1, rgba(C.highlight, 0.95));
		line(x0, y0, x1, y1, px * 0.8, g);
		if (u <= 1) {
			glow(x1, y1, px * 4, C.highlight, 0.55);
			dot(x1, y1, px, C.highlight, 1);
		}
	};
	for (let v = 0; v < NET.N; v++) {
		const u = NET.parent[v];
		if (u < 0) continue;
		const tp = NET.t[u];
		const tv = NET.t[v];
		const span = tv - tp;
		if (f < tp || f > tv + span * P.pulse.tail) continue;
		packet(Q[u].q, Q[v].q, (f - tp) / span, P.pulse.tail, (P.pulse.packet_px * Q[v].q.s) / S0);
	}
	for (const [ha, hb, dep] of P.beats.bridges) {
		const span = P.pulse.bridge_frames;
		if (f < dep || f > dep + span * 1.25) continue;
		packet(Q[ha].q, Q[hb].q, (f - dep) / span, 0.25, (P.pulse.packet_px * 1.6 * Q[ha].q.s) / S0);
	}

	// nodes: size and glow from degree (hub weighting), defocused off the focus depth (RackFocus)
	NET.nodes.forEach((n, i) => {
		const {q, coc, ia} = Q[i];
		const sm = q.s / S0;
		const isHub = n.hub >= 0;
		const lit = f >= NET.t[i];
		const w = NET.w[i];
		const [lo, hi] = P.hubs.node_core_px;
		const r = (isHub ? P.hubs.core_px * zoomAt(n.hub, f) : lo + (hi - lo) * w) * sm;
		const rr = r + coc;
		const ka = Math.max(P.focus.min_alpha, Math.min(1, (r / rr) ** 2));
		const br = (lit ? 1 : isHub ? 0.7 : 0.4) * ka * ia * fog(q.d);
		const fl = lit ? Math.exp(-(f - NET.t[i]) / P.pulse.flash_frames) : 0;
		const col = mixRgb(clusterCol(n.c), C.highlight, fl);
		glow(q.x, q.y, rr * (isHub ? P.hubs.halo_mult : P.hubs.node_halo_mult), col, br * (0.18 + 0.22 * w));
		if (fl > 0.02) glow(q.x, q.y, rr * 6, C.highlight, 0.5 * fl * ia);
		dot(q.x, q.y, rr, col, br);
		if (isHub) dot(q.x, q.y, rr * 0.45, C.ink, br);
	});

	// OrbitRing around each fired hub: a tilted ellipse, 12 ticks turning 2 degrees a frame, one rider
	const last = lastFired(f);
	FIRE.forEach((fire, c) => {
		if (f < fire) return;
		const {q} = Q[c];
		const R = ringR(c, f, q.s);
		const ry = R * P.orbit.tilt;
		const al = (c === last ? P.orbit.alpha : P.orbit.older_alpha) * Math.min(1, sp(f, fire, 'hub_zoom') * 2);
		const col = clusterCol(c);
		ctx.strokeStyle = rgba(col, al * 0.6);
		ctx.lineWidth = 1.6;
		ctx.beginPath();
		ctx.ellipse(q.x, q.y, R, ry, 0, 0, 2 * Math.PI);
		ctx.stroke();
		for (let k = 0; k < P.orbit.ticks; k++) {
			const th = rad((k * 360) / P.orbit.ticks + (f - fire) * P.orbit.deg_per_frame);
			dot(q.x + R * Math.cos(th), q.y + ry * Math.sin(th), 2.4, col, al);
		}
		const th = rad((f - fire) * P.orbit.deg_per_frame * 3);
		glow(q.x + R * Math.cos(th), q.y + ry * Math.sin(th), 16, C.highlight, al * 0.6);
		dot(q.x + R * Math.cos(th), q.y + ry * Math.sin(th), 4, C.highlight, al);
	});
	ctx.globalCompositeOperation = 'source-over';
};

const Plexus: React.FC<{c: Roles; f: number}> = ({c, f}) => {
	const ref = useRef<HTMLCanvasElement>(null);
	const pal = useMemo<Pal>(() => ({bg: rgb(c.bg), ink: rgb(c.ink), primary: rgb(c.primary), secondary: rgb(c.secondary), highlight: rgb(c.highlight)}), [c]);
	useLayoutEffect(() => {
		const ctx = ref.current?.getContext('2d');
		if (ctx) draw(ctx, f, pal, c.bg);
	}, [f, pal, c.bg]);
	return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />;
};

/* ---------- HUD ---------- */
const TAGS: {box: Box; hub: number; start: number; n: string; label: string; value: string}[] = [
	{box: BOXES.t1, hub: 0, start: P.beats.tags[0], n: '01', label: 'SEED', value: 'ONE POST'},
	{box: BOXES.t2, hub: 1, start: P.beats.tags[1], n: '02', label: 'AMPLIFIER', value: '2M FOLLOWERS'},
	{box: BOXES.t3, hub: 2, start: P.beats.tags[2], n: '03', label: 'MAINSTREAM', value: 'NIGHTLY NEWS'},
];

const Scene: React.FC<{palette: string; pairing: string}> = ({palette, pairing}) => {
	const f = useCurrentFrame();
	const c = useMemo(() => rolesOf(palette), [palette]);
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	const text = {color: c.ink, margin: 0, fontVariantNumeric: 'tabular-nums'} as React.CSSProperties;
	const titleIn = (n: number) => seg(f, 6 + n * 5, 20 + n * 5);
	const bgA = (a: number) => rgba(rgb(c.bg), a);
	const plate = {background: c.surface, border: `${T.tag.border.width}px solid ${c.primary}`, borderRadius: T.tag.radius, boxSizing: 'border-box', paddingLeft: T.tag.pad, display: 'flex', flexDirection: 'column', justifyContent: 'center'} as React.CSSProperties;
	const scrim = {boxShadow: `0 0 ${T.tag.scrim_px}px ${T.tag.scrim_px / 2}px ${bgA(T.tag.scrim_alpha)}`};
	const lit = NET.t.filter((x) => x <= f).length;
	const hops = Math.max(0, ...NET.hop.filter((_, i) => NET.t[i] <= f));
	const readouts = [
		{box: BOXES.r1, label: 'REACH', value: ((lit * 0.016).toFixed(2) + 'M').padStart(5, '0')},
		{box: BOXES.r2, label: 'NODES LIT', value: String(lit).padStart(3, '0') + '/' + String(LIT_TOTAL).padStart(3, '0')},
		{box: BOXES.r3, label: 'HOPS', value: String(hops).padStart(2, '0')},
	];
	return (
		<AbsoluteFill style={{background: c.bg, overflow: 'hidden'}}>
			<Plexus c={c} f={f} />
			{/* vignette and a dark fade under the title, so type never sits on light */}
			<div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 95% 75% at 50% 50%, ${bgA(0)} 40%, ${bgA(T.vignette.alpha)} 100%)`}} />
			<div style={{position: 'absolute', left: 0, top: 0, width: W, height: (T.title_scrim.to_y / 100) * H, background: `linear-gradient(180deg, ${bgA(T.title_scrim.alpha)} 0%, ${bgA(T.title_scrim.alpha)} 60%, ${bgA(0)} 100%)`}} />

			{/* leaders: plate edge to the orbit ring of the projected hub */}
			<svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
				{TAGS.map((t, i) => {
					const k = seg(f, t.start + 4, t.start + 4 + T.leader.draw_frames, 'draw');
					if (k <= 0) return null;
					const h = hubAt(t.hub, f);
					const left = (t.box.x / 100) * W;
					const right = ((t.box.x + t.box.w) / 100) * W;
					const x0 = h.x < left ? left : right;
					const y0 = ((t.box.y + t.box.h / 2) / 100) * H;
					const len = Math.hypot(h.x - x0, h.y - y0);
					const R = ringR(t.hub, f, h.s);
					const e = Math.max(0, (len - R) / len);
					const x1 = x0 + (h.x - x0) * e * k;
					const y1 = y0 + (h.y - y0) * e * k;
					return (
						<g key={i}>
							<line x1={x0} y1={y0} x2={x1} y2={y1} stroke={c.primary} strokeWidth={T.leader.width} />
							<circle cx={x0} cy={y0} r={5} fill={c.primary} />
						</g>
					);
				})}
			</svg>

			{/* title block */}
			<div style={{...abs(BOXES.kicker), ...fontCss(pair.mono, 34), ...text, color: c.primary, whiteSpace: 'nowrap', opacity: titleIn(0)}}>CONTAGION MAP / CASE 20</div>
			<div style={{...abs(BOXES.title), ...fontCss(pair.display, 100), ...text}}>
				{['RUMOUR', 'CASCADE'].map((line, n) => (
					<div key={line} style={{whiteSpace: 'nowrap', opacity: titleIn(n + 1), transform: `translateY(${(1 - titleIn(n + 1)) * 30}px)`}}>
						{line}
					</div>
				))}
			</div>

			{/* hub plates: opaque surface, primary border, a bg scrim that knocks the links back */}
			{TAGS.map((t, i) => {
				const k = sp(f, t.start, 'tag');
				return (
					<div key={i} style={{...abs(t.box), ...plate, ...scrim, transform: `scale(${0.8 + 0.2 * k})`, transformOrigin: TAGS[i].hub === 1 ? 'right center' : 'left center', opacity: Math.min(1, k * 1.5)}}>
						<div style={{...fontCss(pair.mono, 34), ...text, color: c.primary, whiteSpace: 'nowrap'}}>
							{t.n} {t.label}
						</div>
						<div style={{...fontCss(pair.accent, 46), ...text, whiteSpace: 'nowrap', marginTop: 6}}>{t.value}</div>
					</div>
				);
			})}

			{/* live readouts: fixed-length values in tabular numerals */}
			{readouts.map((r, i) => (
				<div key={i} style={{...abs(r.box), ...plate, ...scrim, opacity: seg(f, 14 + i * M.stagger_frames, 26 + i * M.stagger_frames)}}>
					<div style={{...fontCss(pair.mono, 34), ...text, color: c.label, whiteSpace: 'nowrap'}}>{r.label}</div>
					<div style={{...fontCss(pair.accent, 46), ...text, whiteSpace: 'nowrap', marginTop: 6}}>{r.value}</div>
				</div>
			))}
		</AbsoluteFill>
	);
};

export const Preview: React.FC<PreviewProps> = ({palette = 'deep-mind', pairing = 'sora-manrope-dmmono'}) => {
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	return (
		<FontGate fonts={{...pair, name: pair.id}}>
			<Scene palette={palette} pairing={pairing} />
		</FontGate>
	);
};

/** Three beats side by side: hub 1 spreading, the bridge into hub 3, the final frame. */
export const PreviewSheet: React.FC<PreviewProps> = (props) => (
	<AbsoluteFill style={{flexDirection: 'row'}}>
		{SHEET_FRAMES.map((fr) => (
			<div key={fr} style={{position: 'relative', width: W, height: H, flex: 'none'}}>
				<Freeze frame={fr}>
					<Preview {...props} />
				</Freeze>
			</div>
		))}
	</AbsoluteFill>
);
