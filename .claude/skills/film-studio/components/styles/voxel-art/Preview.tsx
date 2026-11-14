import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, Freeze, interpolate, spring, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import ds from '../../../styles/voxel-art/design-system.json';
import {FontGate} from '../../engine/fonts';
import {fontCss} from '../../engine/tokens';
import type {Pairing} from '../../engine/types';

/**
 * voxel-art specimen: one 6 s scene, 1080 x 1920 at 30 fps. A floating 8 x 8 voxel island (cottage, tree, rocks, clouds) assembles
 * block by block (GravityDrop), then a hero voxel character drops in, lands with an ImpactFrame and a stepped spring squash, waves,
 * hops into a 360 degree flip and lands again. Every block is one InstancedMesh instance seen through a true isometric orthographic
 * camera. Faces are unlit: a shader picks top, left or right shade from the world normal. Stepped ambient shadows, grid-marched cast
 * shadows and a seeded 3-step grain are baked into the instance colours. All text is DOM.
 */
export type PreviewProps = {palette?: string; pairing?: string};
export const PREVIEW_FRAMES = 180;
export const SHEET_FRAMES = [30, 96, 170];
const W = 1080;
const H = 1920;
const FPS = 30;
export const SHEET_SIZE = {width: W * SHEET_FRAMES.length, height: H};
const VX = ds.voxel;
const M = ds.motion;
const T = ds.tokens;
const Z = VX.camera.zoom_px_per_unit;
const CX = VX.camera.centre_px.x;
const CY = VX.camera.centre_px.y;

/** Static text boxes in percent of the frame. Mirrored 1:1 by the storyboard that check-safezones reads. */
export const BOXES = {
	kicker: {x: 9, y: 6.5, w: 76, h: 2.4},
	title: {x: 9, y: 9.3, w: 76, h: 11.4},
	t1: {x: 9, y: 22, w: 40, h: 6.6},
	r1: {x: 9, y: 70, w: 36, h: 7.2},
	r2: {x: 49, y: 70, w: 36, h: 7.2},
};
type Box = {x: number; y: number; w: number; h: number};
const abs = (b: Box) => ({position: 'absolute', left: (b.x / 100) * W, top: (b.y / 100) * H, width: (b.w / 100) * W, height: (b.h / 100) * H}) as React.CSSProperties;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (n: keyof typeof M.easings) => Easing.bezier(...(M.easings[n] as [number, number, number, number]));
const seg = (f: number, a: number, b: number, e: keyof typeof M.easings = 'settle') => interpolate(f, [a, b], [0, 1], {...clamp, easing: ease(e)});
/** Stepped spring: sampled on twos, output snapped to 1/8. */
const stepSp = (f: number, start: number, cfg: keyof typeof M.springs) => {
	if (f < start) return 0;
	const g = Math.floor((f - start) / M.stepped.on) * M.stepped.on;
	const v = spring({frame: g, fps: FPS, config: M.springs[cfg]});
	return Math.round(v / M.stepped.quantum) * M.stepped.quantum;
};
const rad = (d: number) => (d * Math.PI) / 180;
const mixHex = (a: string, b: string, t: number) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
/** A THREE.Color with the hex bytes kept exactly, times a shade factor. */
const col = (h: string, k = 1) => new THREE.Color().setRGB((parseInt(h.slice(1, 3), 16) / 255) * k, (parseInt(h.slice(3, 5), 16) / 255) * k, (parseInt(h.slice(5, 7), 16) / 255) * k, THREE.LinearSRGBColorSpace);
type V3 = [number, number, number];
type Roles = Record<string, string>;

/** Focused palettes have 5 roles; the block materials they lack are derived from them. Text only ever uses ink. */
const rolesOf = (id: string): Roles => {
	const p = ds.palettes.find((x) => x.id === id) ?? ds.palettes[0];
	const r: Roles = {...(p.roles as Roles)};
	r.secondary ??= mixHex(r.ink, r.surface, 0.4); // a slate roof: never a shade of the hero colour
	r.earth ??= mixHex(r.primary, r.ink, 0.55);
	r.stone ??= mixHex(r.surface, r.ink, 0.3);
	r.wood ??= mixHex(r.highlight, r.ink, 0.6);
	r.leaf ??= mixHex(r.primary, r.ink, 0.28);
	return r;
};

/* ---------- seeded build ---------- */
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

type Cell = {x: number; y: number; z: number; role: string; k: number; cloud: boolean; start: number};
const S = VX.island.size;
/** Cell (x, y, z) has its centre at world (x - S/2 + 0.5, y + 0.5, z - S/2 + 0.5). Grass top is layer 0, so the ground is at y = 1. */
const cellPos = (c: {x: number; y: number; z: number}): V3 => [c.x - S / 2 + 0.5, c.y + 0.5, c.z - S / 2 + 0.5];

const buildWorld = () => {
	const rnd = mulberry32(fnv1a('voxel-art-21'));
	const map = new Map<string, Cell>();
	const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
	const put = (x: number, y: number, z: number, role: string, cloud = false) => map.set(key(x, y, z), {x, y, z, role, k: 1, cloud, start: 0});
	const box = (x0: number, y0: number, z0: number, w: number, h: number, d: number, role: string) => {
		for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + h; y++) for (let z = z0; z < z0 + d; z++) put(x, y, z, role);
	};
	const inMask = (x: number, z: number, i: number) => {
		const lo = i;
		const hi = S - 1 - i;
		if (x < lo || x > hi || z < lo || z > hi) return false;
		return !(VX.island.corner_cut && hi - lo > 1 && (x === lo || x === hi) && (z === lo || z === hi));
	};
	for (let x = 0; x < S; x++)
		for (let z = 0; z < S; z++) {
			if (inMask(x, z, 0)) {
				put(x, 0, z, 'primary');
				put(x, -1, z, 'earth');
			}
			for (let d = 1; d < VX.island.underside_layers; d++) if (inMask(x, z, d)) put(x, -1 - d, z, 'earth');
		}
	// cottage on the left: stone walls, a wood door facing the hero, a dark window, a stepped roof and a chimney
	box(0, 1, 3, 3, 2, 3, 'stone');
	put(2, 1, 4, 'wood');
	put(1, 2, 5, 'ink');
	box(0, 3, 3, 3, 1, 3, 'secondary');
	put(1, 4, 4, 'secondary');
	put(0, 4, 3, 'stone');
	// tree at the back right
	put(6, 1, 1, 'wood');
	put(6, 2, 1, 'wood');
	box(5, 3, 0, 3, 1, 3, 'leaf');
	for (const [x, z] of [[6, 0], [5, 1], [6, 1], [7, 1], [6, 2]]) put(x, 4, z, 'leaf');
	put(6, 5, 1, 'leaf');
	// rocks at the back left, bushes in front (no lone accent block: it would compete with the hero)
	for (const [x, y, z] of [[1, 1, 1], [2, 1, 1], [1, 1, 2], [1, 2, 1]]) put(x, y, z, 'stone');
	for (const [x, z] of [[1, 6], [2, 6], [3, 7], [5, 6]]) put(x, 1, z, 'leaf');
	// two clouds, off the island
	box(-3, 3, 6, 3, 1, 2, 'surface');
	box(-2, 4, 6, 1, 1, 2, 'surface');
	box(8, 2, 0, 3, 1, 2, 'surface');
	box(9, 3, 0, 1, 1, 2, 'surface');
	for (const k of [key(-3, 3, 6), key(-3, 3, 7), key(-2, 3, 6), key(-2, 3, 7), key(-1, 3, 6), key(-1, 3, 7), key(-2, 4, 6), key(-2, 4, 7), key(8, 2, 0), key(8, 2, 1), key(9, 2, 0), key(9, 2, 1), key(10, 2, 0), key(10, 2, 1), key(9, 3, 0), key(9, 3, 1)]) {
		const c = map.get(k);
		if (c) c.cloud = true;
	}
	const cells = [...map.values()];
	const solid = (x: number, y: number, z: number) => {
		const c = map.get(key(x, y, z));
		return !!c && !c.cloud;
	};
	for (const c of cells) {
		if (!c.cloud) {
			// stepped ambient shadow: one step per occupied side cell one layer up
			const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => solid(c.x + dx, c.y + 1, c.z + dz)).length;
			c.k *= VX.ao.steps[Math.min(3, n)];
			if (c.y < 0) c.k *= VX.ao.depth_steps[Math.min(3, -c.y - 1)];
			// grid-marched cast shadow, for blocks whose top is open
			if (!solid(c.x, c.y + 1, c.z)) {
				const [mx, my, mz] = VX.cast.march;
				for (let s = 1; s <= VX.cast.max_steps; s++)
					if (solid(c.x + mx * s, c.y + my * s, c.z + mz * s)) {
						c.k *= VX.cast.factor;
						break;
					}
			}
		}
		c.k *= VX.grain.levels[Math.floor(rnd() * VX.grain.levels.length)];
	}
	// drop order: lowest layer first, centre out, seeded jitter
	const order = cells
		.map((c) => ({c, r: (c.y + 10) * 100 + Math.hypot(c.x - S / 2 + 0.5, c.z - S / 2 + 0.5) * 6 + rnd() * 10}))
		.sort((a, b) => a.r - b.r)
		.map((o) => o.c);
	const [s0, s1] = VX.drop.spread;
	order.forEach((c, i) => (c.start = Math.round(s0 + ((s1 - s0) * i) / (order.length - 1))));
	return order;
};
export const WORLD = buildWorld();
const landAt = (c: Cell) => c.start + VX.drop.fall_frames;

/* ---------- the hero: half-voxel cubes in parts with pivots ---------- */
type HCell = {x: number; y: number; z: number; role: string};
type Part = {pivot: V3; cells: HCell[]};
const HU = VX.grid.hero_unit;
/** Hero cell (x, y, z) in half-voxels; local origin at the feet centre, on the cell boundary x = 3, z = 3. */
const hPos = (c: HCell): V3 => [(c.x + 0.5 - 3) * HU, (c.y + 0.5) * HU, (c.z + 0.5 - 3) * HU];
const hbox = (out: HCell[], x0: number, y0: number, z0: number, w: number, h: number, d: number, role: string) => {
	for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + h; y++) for (let z = z0; z < z0 + d; z++) {
		const i = out.findIndex((c) => c.x === x && c.y === y && c.z === z);
		if (i >= 0) out.splice(i, 1);
		out.push({x, y, z, role});
	}
	return out;
};
const HERO: Record<'legs' | 'torso' | 'armL' | 'armR' | 'head', Part> = {
	legs: {pivot: [0, 0, 0], cells: (() => {
		const o: HCell[] = [];
		hbox(o, 0, 1, 2, 2, 3, 2, 'suit');
		hbox(o, 4, 1, 2, 2, 3, 2, 'suit');
		hbox(o, 0, 0, 2, 2, 1, 2, 'boots');
		return hbox(o, 4, 0, 2, 2, 1, 2, 'boots');
	})()},
	torso: {pivot: [0, 0, 0], cells: (() => {
		const o: HCell[] = [];
		hbox(o, 0, 4, 1, 6, 3, 4, 'suit');
		hbox(o, 0, 7, 1, 6, 1, 4, 'scarf');
		return hbox(o, 4, 4, 0, 1, 3, 1, 'scarf');
	})()},
	armL: {pivot: [-4, 8, 0], cells: hbox(hbox([], -2, 5, 2, 2, 3, 2, 'suit'), -2, 4, 2, 2, 1, 2, 'face')},
	armR: {pivot: [4, 8, 0], cells: hbox(hbox([], 6, 5, 2, 2, 3, 2, 'suit'), 6, 4, 2, 2, 1, 2, 'face')},
	head: {pivot: [0, 8, 0], cells: (() => {
		const o: HCell[] = [];
		hbox(o, -1, 8, 0, 8, 5, 6, 'suit');
		hbox(o, 0, 8, 5, 6, 4, 1, 'face');
		hbox(o, -1, 13, 0, 8, 1, 6, 'cap');
		hbox(o, 0, 12, 6, 6, 1, 2, 'cap');
		return hbox(o, 5, 14, 1, 1, 1, 1, 'scarf');
	})()},
};
const HERO_ROLE: Record<string, string> = ds.hero.roles;
export const HERO_ROOT: V3 = [1.5, 1, 0.5];
const HERO_CENTRE = 7 * HU; // flip pivot height above the feet: the middle of the 14 cell body
const BLOCKS_TOTAL = WORLD.length;
const LAND1 = 52 + VX.drop.fall_frames;
const HOP = 124;
const LAND2 = HOP + VX.flip.frames;
const BLINKS = [100, 152];

/** Hero pose at a frame: root offset, squash, flip angle, arm and head angles, eye and mouth scales, state label. */
const poseAt = (f: number) => {
	const dropT = (f - 52) / VX.drop.fall_frames;
	let y = 0;
	if (f < 52) y = 40;
	else if (f < LAND1) y = VX.drop.height * (1 - dropT * dropT);
	let flip = 0;
	if (f >= HOP && f < LAND2) {
		const t = (f - HOP) / VX.flip.frames;
		y = VX.flip.hop * 4 * t * (1 - t);
		flip = VX.flip.turn_deg * ease('flip')(t);
	}
	const land = f >= LAND2 ? LAND2 : LAND1;
	const sq = f >= LAND1 && !(f >= HOP && f < LAND2) ? (1 - stepSp(f, land, 'bounce')) * 0.3 : 0;
	const crouch = f >= HOP - 6 && f < HOP ? 0.15 : 0;
	const s = sq + crouch;
	const up = f < 112 ? seg(f, 84, 90, 'snap') : 1 - seg(f, 112, 118, 'snap');
	const swing = f >= 90 && f < 112 ? 20 * Math.sin(((Math.floor(f / 2) * 2 - 90) / 6) * Math.PI) : 0;
	const blink = BLINKS.some((b) => f >= b && f < b + 3);
	const react = f >= LAND1 && f < LAND1 + 14;
	const idleBob = f > LAND1 + 14 && (f < HOP - 6 || f > LAND2 + 12) ? 0.125 * (Math.floor(f / 10) % 2) : 0;
	const state = f < 52 ? 'WAIT' : f < 84 ? (f < LAND1 ? 'DROP' : 'LAND') : f < 118 ? 'WAVE' : f < LAND2 + 6 && f >= HOP - 6 ? 'FLIP' : 'IDLE';
	return {y, flip, scaleY: 1 - s, scaleXZ: 1 + s * 0.6, armR: 150 * up + swing * up, eyeY: blink ? 0.2 : react ? 1.25 : 1, mouthY: react ? 2.2 : 1, browUp: react ? 0.4 : 0, bob: idleBob, state};
};
/** Brow height on the face, in hero cells above the neck. The right brow sits 0.3 cells higher. */
const BROW_Y = 3.44;
/** Head centre of the hero in world units at a frame (for the leader), before the island bob. */
const heroHead = (f: number): V3 => {
	const p = poseAt(f);
	const off = 10.5 * HU - HERO_CENTRE;
	const a = rad(p.flip);
	return [HERO_ROOT[0], HERO_ROOT[1] + p.y + HERO_CENTRE + off * Math.cos(a), HERO_ROOT[2] + off * Math.sin(a)];
};
const islandBob = (f: number) => {
	const g = Math.floor(f / 2) * 2;
	return Math.round(VX.float.amp * Math.sin((2 * Math.PI * g) / VX.float.period) * 32) / 32;
};
/** Isometric projection of a world point to frame pixels: right (1, 0, -1) / sqrt 2, up (-1, 2, -1) / sqrt 6. */
export const toPx = (p: V3, dy = 0) => ({x: CX + (Z * (p[0] - p[2])) / Math.SQRT2, y: CY + dy - (Z * (-p[0] + 2 * p[1] - p[2])) / Math.sqrt(6)});

/* ---------- three-shade material ---------- */
const VERT = `
varying vec3 vN;
varying vec3 vC;
void main() {
	mat4 m = modelMatrix;
	#ifdef USE_INSTANCING
	m = modelMatrix * instanceMatrix;
	#endif
	vN = normalize(mat3(m) * normal);
	vC = vec3(1.0);
	#ifdef USE_INSTANCING_COLOR
	vC = instanceColor;
	#endif
	gl_Position = projectionMatrix * viewMatrix * m * vec4(position, 1.0);
}`;
const FRAG = `
uniform vec4 uShade;
uniform vec3 uLeftDir;
uniform float uSil;
uniform vec3 uSilCol;
varying vec3 vN;
varying vec3 vC;
void main() {
	vec3 n = normalize(vN);
	float s = n.y > 0.5 ? uShade.x : (n.y < -0.5 ? uShade.w : (dot(n, uLeftDir) > 0.0 ? uShade.y : uShade.z));
	gl_FragColor = vec4(uSil > 0.5 ? uSilCol : vC * s, 1.0);
}`;
const makeMat = () =>
	new THREE.ShaderMaterial({
		vertexShader: VERT,
		fragmentShader: FRAG,
		uniforms: {
			uShade: {value: new THREE.Vector4(VX.shade.top, VX.shade.left, VX.shade.right, VX.shade.bottom)},
			uLeftDir: {value: new THREE.Vector3(-1, 0, 1).normalize()},
			uSil: {value: 0},
			uSilCol: {value: new THREE.Color()},
		},
	});
const GEO = new THREE.BoxGeometry(1, 1, 1);
const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const inst = (items: {p: V3; s: V3; color: THREE.Color}[], mat: THREE.Material) => {
	const m = new THREE.InstancedMesh(GEO, mat, items.length);
	m.frustumCulled = false;
	items.forEach((it, i) => {
		m.setMatrixAt(i, tmpM.compose(new THREE.Vector3(...it.p), tmpQ, new THREE.Vector3(...it.s)));
		m.setColorAt(i, it.color);
	});
	return m;
};

const build = (c: Roles) => {
	// two materials only so the ImpactFrame silhouette can split: the world in ink, the hero cut out in surface
	const mat = makeMat();
	mat.uniforms.uSilCol.value = col(c[VX.impact.silhouette.world]);
	const heroMat = makeMat();
	heroMat.uniforms.uSilCol.value = col(c[VX.impact.silhouette.hero]);
	const world = new THREE.Group();
	const island = inst(WORLD.map((w) => ({p: cellPos(w), s: [1, 1, 1] as V3, color: col(c[w.role], w.k)})), mat);
	world.add(island);
	// hero rig: root -> squash (at the feet) -> flip (at the centre) -> body -> parts
	const root = new THREE.Group();
	const squash = new THREE.Group();
	const flip = new THREE.Group();
	const body = new THREE.Group();
	flip.position.y = HERO_CENTRE;
	body.position.y = -HERO_CENTRE;
	root.add(squash);
	squash.add(flip);
	flip.add(body);
	const hrnd = mulberry32(fnv1a('voxel-art-21-hero'));
	const parts: Record<string, THREE.Group> = {};
	for (const [name, part] of Object.entries(HERO)) {
		const g = new THREE.Group();
		const pv: V3 = [part.pivot[0] * HU, part.pivot[1] * HU, part.pivot[2] * HU];
		g.position.set(...pv);
		g.add(
			inst(
				part.cells.map((h) => {
					const p = hPos(h);
					return {p: [p[0] - pv[0], p[1] - pv[1], p[2] - pv[2]] as V3, s: [HU, HU, HU] as V3, color: col(c[HERO_ROLE[h.role]], VX.grain.levels[Math.floor(hrnd() * 3)])};
				}),
				heroMat,
			),
		);
		parts[name] = g;
		body.add(g);
	}
	// face details, in hero cells: thin plates on the face, the only things off the grid
	const fz = (3 + 0.08) * HU;
	const plateBox = (s: V3) => inst([{p: [0, 0, 0], s: [s[0] * HU, s[1] * HU, s[2] * HU], color: col(c.ink)}], heroMat);
	const eyes = [-1.5, 1.5].map((x) => {
		const g = new THREE.Group();
		g.position.set(x * HU, 2 * HU, fz);
		g.add(plateBox([1, 2, 0.16]));
		parts.head.add(g);
		return g;
	});
	const brows = [-1.5, 1.5].map((x, i) => {
		const g = new THREE.Group();
		g.position.set(x * HU, BROW_Y * HU, fz);
		g.rotation.z = i === 1 ? rad(-8) : 0; // one brow raised and tilted up at the inner end: the asymmetry
		g.add(plateBox([1.24, 0.26, 0.16]));
		parts.head.add(g);
		return g;
	});
	const mouth = new THREE.Group();
	mouth.position.set(0.24 * HU, 0.6 * HU, fz);
	mouth.add(plateBox([1, 0.36, 0.16]));
	parts.head.add(mouth);
	root.position.set(...HERO_ROOT);
	world.add(root);
	// the hero's shadow: an opaque patch in the ground's cast-shadow shade
	const patch = inst([{p: [0, 0, 0], s: [1, 1, 1], color: col(c.primary, VX.hero_shadow.factor)}], mat);
	world.add(patch);
	return {mat, heroMat, world, island, root, squash, flip, parts, eyes, brows, mouth, patch};
};
type Built = ReturnType<typeof build>;

const Voxels: React.FC<{c: Roles; f: number; sil: boolean}> = ({c, f, sil}) => {
	const B: Built = useMemo(() => build(c), [c]);
	B.mat.uniforms.uSil.value = sil ? 1 : 0;
	B.heroMat.uniforms.uSil.value = sil ? 1 : 0;
	B.world.position.y = islandBob(f);
	// GravityDrop: fall drop.height units in drop.fall_frames (y = h * (1 - t^2)), then 2 frames of squash
	const pos = new THREE.Vector3();
	const scl = new THREE.Vector3();
	WORLD.forEach((w, i) => {
		const [x, y, z] = cellPos(w);
		const land = landAt(w);
		if (f < w.start) scl.set(0, 0, 0);
		else if (f < land) {
			const t = (f - w.start) / VX.drop.fall_frames;
			pos.set(x, y + VX.drop.height * (1 - t * t), z);
			scl.set(1, 1, 1);
		}
		if (f >= land && f < land + 2) {
			const q = VX.drop.squash;
			pos.set(x, y - (1 - q) / 2, z);
			scl.set(1.1, q, 1.1);
		} else if (f >= land) {
			pos.set(x, y, z);
			scl.set(1, 1, 1);
		}
		if (f < w.start) pos.set(x, y, z);
		B.island.setMatrixAt(i, tmpM.compose(pos, tmpQ, scl));
	});
	B.island.instanceMatrix.needsUpdate = true;
	// hero
	const p = poseAt(f);
	B.root.visible = f >= 52;
	B.root.position.set(HERO_ROOT[0], HERO_ROOT[1] + p.y, HERO_ROOT[2]);
	B.squash.scale.set(p.scaleXZ, p.scaleY, p.scaleXZ);
	B.flip.rotation.x = -rad(p.flip);
	B.parts.torso.position.y = p.bob;
	B.parts.armL.position.y = HERO.armL.pivot[1] * HU + p.bob;
	B.parts.armR.position.y = HERO.armR.pivot[1] * HU + p.bob;
	B.parts.head.position.y = HERO.head.pivot[1] * HU + p.bob;
	B.parts.armR.rotation.z = rad(p.armR);
	B.parts.head.rotation.z = rad(p.armR > 60 ? -6 : 0);
	B.eyes.forEach((e) => (e.scale.y = p.eyeY));
	B.brows.forEach((b, i) => (b.position.y = (BROW_Y + p.browUp + (i === 1 ? 0.3 : 0)) * HU));
	B.mouth.scale.y = p.mouthY;
	// shadow patch: shrinks in 3 steps with height, slides away from the light, stays on the island
	const hgt = p.y;
	const k = hgt < 0.5 ? VX.hero_shadow.sizes[0] : hgt < 3 ? VX.hero_shadow.sizes[1] : VX.hero_shadow.sizes[2];
	const off = Math.min(1, Math.round(hgt * 0.25 * 4) / 4) + 0.25;
	B.patch.visible = f >= 52;
	B.patch.setMatrixAt(0, tmpM.compose(new THREE.Vector3(HERO_ROOT[0] + off, 1.02, HERO_ROOT[2] - off), tmpQ, new THREE.Vector3(2 * k, 0.04, 1.25 * k)));
	B.patch.instanceMatrix.needsUpdate = true;
	return <primitive object={B.world} />;
};

/* ---------- HUD ---------- */
const IMPACTS = [LAND1, LAND2];

const Scene: React.FC<{palette: string; pairing: string}> = ({palette, pairing}) => {
	const f = useCurrentFrame();
	const c = useMemo(() => rolesOf(palette), [palette]);
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	const text = {color: c.ink, margin: 0, fontVariantNumeric: 'tabular-nums'} as React.CSSProperties;
	const titleIn = (n: number) => seg(f, 6 + n * 5, 20 + n * 5);
	const imp = IMPACTS.map((x) => f - x).find((d) => d >= 0 && d < VX.impact.shake_px.length) ?? -1;
	const sil = imp === 0;
	const shake = imp >= 0 ? VX.impact.shake_px[imp] : 0;
	const bob = islandBob(f);
	const hh = heroHead(f);
	const headPx = toPx([hh[0], hh[1] + bob, hh[2]]);
	const feet = toPx([HERO_ROOT[0], HERO_ROOT[1] + 0.6 + bob, HERO_ROOT[2]]);
	const pose = poseAt(f);
	const landed = WORLD.filter((w) => f >= landAt(w)).length;
	const plate = {background: c.surface, border: `${T.plate.border.width}px solid ${c.ink}`, borderRadius: T.plate.radius, boxShadow: `${T.plate.drop.x}px ${T.plate.drop.y}px 0 ${c.ink}`, boxSizing: 'border-box', paddingLeft: T.plate.pad, display: 'flex', flexDirection: 'column', justifyContent: 'center'} as React.CSSProperties;
	const pop = (start: number) => {
		const k = stepSp(f, start, 'plate');
		return {transform: `scale(${0.6 + 0.4 * k})`, opacity: k > 0 ? 1 : 0, transformOrigin: 'left center'} as React.CSSProperties;
	};
	const readouts = [
		{box: BOXES.r1, label: 'BLOCKS', value: String(landed).padStart(3, '0') + '/' + String(BLOCKS_TOTAL).padStart(3, '0'), start: 12},
		{box: BOXES.r2, label: 'HERO STATE', value: pose.state, start: 15},
	];
	const rays = VX.impact.rays;
	const t1 = BOXES.t1;
	const lx = ((t1.x + t1.w) / 100) * W;
	const ly = ((t1.y + t1.h / 2) / 100) * H;
	const leadK = seg(f, LAND1 + 12, LAND1 + 18, 'snap');
	return (
		<AbsoluteFill style={{background: sil ? c.highlight : c.bg, overflow: 'hidden'}}>
			{/* ImpactFrame rays, behind the world */}
			{imp >= 0 && imp < 2 ? (
				<svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
					{Array.from({length: rays}, (_, i) => {
						const a0 = (i / rays) * 2 * Math.PI;
						const a1 = a0 + (Math.PI / rays) * (i % 2 ? 0.55 : 0.85);
						const r0 = imp === 0 ? 120 : 220;
						const r1 = 1500;
						const pt = (a: number, r: number) => `${feet.x + r * Math.cos(a)},${feet.y + r * Math.sin(a)}`;
						return <polygon key={i} points={`${pt(a0, r0)} ${pt(a0, r1)} ${pt(a1, r1)} ${pt(a1, r0)}`} fill={imp === 0 ? c.surface : 'none'} stroke={imp === 1 ? c.ink : 'none'} strokeWidth={6} />;
					})}
				</svg>
			) : null}

			<div style={{position: 'absolute', left: shake, top: CY - H / 2 + shake * -0.5, width: W, height: H}}>
				<ThreeCanvas width={W} height={H} orthographic flat linear camera={{position: VX.camera.position as V3, zoom: Z, near: VX.camera.near, far: VX.camera.far}} gl={{antialias: true, alpha: true}}>
					<Voxels c={c} f={f} sil={sil} />
				</ThreeCanvas>
			</div>

			{/* title block */}
			<div style={{...abs(BOXES.kicker), ...fontCss(pair.mono, 32), ...text, whiteSpace: 'nowrap', opacity: titleIn(0)}}>LEVEL 01 / THE KEEPER</div>
			<div style={{...abs(BOXES.title), ...fontCss(pair.display, 104), ...text}}>
				{['BLOCK BY', 'BLOCK'].map((line, n) => (
					<div key={line} style={{whiteSpace: 'nowrap', opacity: titleIn(n + 1) > 0 ? 1 : 0, transform: `translateY(${Math.round((1 - titleIn(n + 1)) * 4) * -12}px)`}}>
						{line}
					</div>
				))}
			</div>

			{/* leader from the name plate to the hero's head */}
			{leadK > 0 ? (
				<svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
					<line x1={lx} y1={ly} x2={lx + (headPx.x - 80 - lx) * leadK} y2={ly + (headPx.y - ly) * leadK} stroke={c.ink} strokeWidth={T.leader.width} strokeLinecap="round" />
					<circle cx={lx} cy={ly} r={T.leader.dot} fill={c.ink} />
				</svg>
			) : null}

			{/* hero name plate */}
			<div style={{...abs(t1), ...plate, ...pop(LAND1 + 8)}}>
				<div style={{...fontCss(pair.mono, 32), ...text, whiteSpace: 'nowrap'}}>01 PIP</div>
				<div style={{...fontCss(pair.accent, 48), ...text, whiteSpace: 'nowrap', marginTop: 6}}>ISLAND KEEPER</div>
			</div>

			{/* counters */}
			{readouts.map((r, i) => (
				<div key={i} style={{...abs(r.box), ...plate, ...pop(r.start)}}>
					<div style={{...fontCss(pair.mono, 32), ...text, whiteSpace: 'nowrap'}}>{r.label}</div>
					<div style={{...fontCss(pair.accent, 48), ...text, whiteSpace: 'nowrap', marginTop: 6}}>{r.value}</div>
				</div>
			))}
		</AbsoluteFill>
	);
};

export const Preview: React.FC<PreviewProps> = ({palette = 'sunny-isle', pairing = 'lilita-nunito-spacemono'}) => {
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	return (
		<FontGate fonts={{...pair, name: pair.id}}>
			<Scene palette={palette} pairing={pairing} />
		</FontGate>
	);
};

/** Three beats side by side: the island assembling, the wave, the final frame. */
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
