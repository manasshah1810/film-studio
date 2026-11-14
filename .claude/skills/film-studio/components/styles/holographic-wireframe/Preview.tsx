import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, Freeze, interpolate, spring, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import ds from '../../../styles/holographic-wireframe/design-system.json';
import {FontGate} from '../../engine/fonts';
import {fontCss} from '../../engine/tokens';
import type {Pairing} from '../../engine/types';

/**
 * holographic-wireframe specimen: one 6 s scene, 1080 x 1920 at 30 fps. A fictional servo actuator drawn as a hologram in @remotion/three.
 * Every part renders twice: a translucent fresnel face pass, then a glowing edge pass (EdgesGeometry into fat LineSegments2: a thin core and a
 * wide faint halo), all additive with no depth writes. A highlight scan band sweeps down the object in world y; the first sweep prints it.
 * The object turns on y, tilts on x and explodes into 6 layers over a perspective floor grid. Three tags with leaders follow 3D anchors.
 * An SVG filter splits the red and blue channels for the RGB glitch. All text is DOM.
 */
export type PreviewProps = {palette?: string; pairing?: string};
export const PREVIEW_FRAMES = 180;
export const SHEET_FRAMES = [36, 110, 170];
const W = 1080;
const H = 1920;
const FPS = 30;
export const SHEET_SIZE = {width: W * SHEET_FRAMES.length, height: H};
const HO = ds.holo;
const M = ds.motion;
const R = M.rotation;

/** Static text boxes in percent of the frame. Mirrored 1:1 by the storyboard that check-safezones reads. */
export const BOXES = {
	kicker: {x: 9, y: 6.5, w: 76, h: 2.4},
	title: {x: 9, y: 9.3, w: 76, h: 11},
	t1: {x: 9, y: 25, w: 31, h: 6.4},
	t2: {x: 9, y: 37, w: 31, h: 6.4},
	t3: {x: 9, y: 49, w: 31, h: 6.4},
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
const mix = (a: string, b: string, t: number) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
const hexA = (h: string, a: number) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
const rad = (d: number) => (d * Math.PI) / 180;
/** A THREE.Color with the hex bytes kept exactly (no sRGB conversion), so a lit edge shows the palette colour. */
const col = (h: string) => new THREE.Color().setRGB(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255, THREE.LinearSRGBColorSpace);
type Roles = Record<string, string>;
type V3 = [number, number, number];

/** Focused palettes have 5 roles; secondary, dim and grid are derived. Expanded palettes carry them. */
const rolesOf = (id: string): Roles => {
	const p = ds.palettes.find((x) => x.id === id) ?? ds.palettes[0];
	const r: Roles = {...(p.roles as Roles)};
	r.secondary ??= mix(r.primary, r.ink, 0.45);
	r.dim ??= mix(r.ink, r.bg, 0.35);
	r.grid ??= mix(r.primary, r.bg, 0.72);
	return r;
};

/* ---------- geometry: a fictional servo actuator, 6 layers ---------- */
const roundRect = (w: number, d: number, r: number) => {
	const s = new THREE.Shape();
	const x0 = -w / 2;
	const y0 = -d / 2;
	s.moveTo(x0 + r, y0);
	s.lineTo(x0 + w - r, y0);
	s.absarc(x0 + w - r, y0 + r, r, -Math.PI / 2, 0, false);
	s.lineTo(x0 + w, y0 + d - r);
	s.absarc(x0 + w - r, y0 + d - r, r, 0, Math.PI / 2, false);
	s.lineTo(x0 + r, y0 + d);
	s.absarc(x0 + r, y0 + d - r, r, Math.PI / 2, Math.PI, false);
	s.lineTo(x0, y0 + r);
	s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
	return s;
};
const hole = (x: number, y: number, r: number) => {
	const p = new THREE.Path();
	p.absarc(x, y, r, 0, Math.PI * 2, true);
	return p;
};
/** A flat shape pushed up along y, from y 0 to y depth. */
const slab = (shape: THREE.Shape, depth: number) => {
	const g = new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled: false, curveSegments: 8});
	g.rotateX(-Math.PI / 2);
	return g;
};
const gearShape = (n: number, r0: number, r1: number, bore: number) => {
	const s = new THREE.Shape();
	const st = (Math.PI * 2) / n;
	for (let k = 0; k < n; k++) {
		const a = k * st;
		(
			[
				[r0, a],
				[r1, a + st * 0.18],
				[r1, a + st * 0.45],
				[r0, a + st * 0.63],
			] as [number, number][]
		).forEach(([r, t], i) => (k === 0 && i === 0 ? s.moveTo(r * Math.cos(t), r * Math.sin(t)) : s.lineTo(r * Math.cos(t), r * Math.sin(t))));
	}
	s.closePath();
	s.holes.push(hole(0, 0, bore));
	return s;
};
const hornShape = () => {
	const w = 0.08;
	const l = 0.55;
	const s = new THREE.Shape();
	const pts: [number, number][] = [[w, l], [-w, l], [-w, w], [-l, w], [-l, -w], [-w, -w], [-w, -l], [w, -l], [w, -w], [l, -w], [l, w], [w, w]];
	pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
	s.closePath();
	for (const [x, y] of [[0, 0.44], [0, -0.44], [0.44, 0], [-0.44, 0], [0, 0.3], [0.3, 0]] as [number, number][]) s.holes.push(hole(x, y, 0.03));
	return s;
};
const cyl = (rt: number, rb: number, h: number, n = 28) => new THREE.CylinderGeometry(rt, rb, h, n);
const box = (x: number, y: number, z: number) => new THREE.BoxGeometry(x, y, z);

type Part = {geo: THREE.BufferGeometry; at: V3; rot?: V3; layer: number; role: 'primary' | 'secondary'; spin?: number; outline?: [THREE.Shape, number]};
const G1X = -0.62;
const G3X = 0.685;
/** Speeds from tooth counts: 8 drives 16, 16 drives 10. All three sit side by side in one plane, meshed by pitch radius. */
const W2 = -8 / 16;
const W3 = (8 / 16) * (16 / 10);
const GEAR1 = gearShape(8, 0.13, 0.2, 0.035);
const GEAR2 = gearShape(16, 0.38, 0.47, 0.03);
const GEAR3 = gearShape(10, 0.22, 0.3, 0.06);
const HORN = hornShape();
const PARTS: Part[] = [
	// layer -1: the motor drops out of the bottom
	{geo: cyl(0.3, 0.3, 0.5), at: [G1X, 0.35, 0], layer: -1, role: 'secondary'},
	{geo: cyl(0.24, 0.3, 0.08), at: [G1X, 0.06, 0], layer: -1, role: 'secondary'},
	{geo: cyl(0.035, 0.035, 0.3, 10), at: [G1X, 0.75, 0], layer: -1, role: 'secondary'},
	{geo: box(0.06, 0.1, 0.06), at: [G1X - 0.1, -0.03, 0.12], layer: -1, role: 'secondary'},
	{geo: box(0.06, 0.1, 0.06), at: [G1X + 0.1, -0.03, 0.12], layer: -1, role: 'secondary'},
	// layer 0: housing, a flange with 4 bolt holes and hollow walls
	{geo: slab(Object.assign(roundRect(2.7, 1.4, 0.14), {holes: [hole(1.17, 0.5, 0.08), hole(-1.17, 0.5, 0.08), hole(1.17, -0.5, 0.08), hole(-1.17, -0.5, 0.08)]}), 0.08), at: [0, 0, 0], layer: 0, role: 'primary'},
	{geo: slab(Object.assign(roundRect(2.1, 1.3, 0.12), {holes: [roundRect(1.9, 1.1, 0.06)]}), 0.55), at: [0, 0.08, 0], layer: 0, role: 'primary'},
	{geo: cyl(0.09, 0.09, 0.22, 12), at: [-1.15, 0.32, 0.36], rot: [0, 0, Math.PI / 2], layer: 0, role: 'primary'},
	// layer 1: control board
	{geo: box(1.86, 0.05, 1.06), at: [0, 0.66, 0], layer: 1, role: 'secondary'},
	{geo: box(0.36, 0.06, 0.36), at: [0.3, 0.715, -0.2], layer: 1, role: 'secondary'},
	{geo: box(0.22, 0.05, 0.16), at: [-0.1, 0.71, 0.27], layer: 1, role: 'secondary'},
	{geo: box(0.5, 0.08, 0.12), at: [0.55, 0.725, 0.36], layer: 1, role: 'secondary'},
	// layer 2: gear train, three gears in one plane
	{geo: slab(GEAR1, 0.14), outline: [GEAR1, 0.14], at: [G1X, 0.74, 0], layer: 2, role: 'primary', spin: 1},
	{geo: slab(GEAR2, 0.14), outline: [GEAR2, 0.14], at: [0, 0.76, 0], layer: 2, role: 'primary', spin: W2},
	{geo: slab(GEAR3, 0.14), outline: [GEAR3, 0.14], at: [G3X, 0.76, 0], layer: 2, role: 'primary', spin: W3},
	{geo: cyl(0.03, 0.03, 0.36, 10), at: [0, 0.85, 0], layer: 2, role: 'primary'},
	{geo: cyl(0.06, 0.06, 0.34, 12), at: [G3X, 1.0, 0], layer: 2, role: 'primary'},
	// layer 3: top cap with the output boss and 4 screws
	{geo: slab(roundRect(2.1, 1.3, 0.12), 0.26), at: [0, 1.04, 0], layer: 3, role: 'primary'},
	{geo: cyl(0.3, 0.3, 0.14), at: [G3X, 1.37, 0], layer: 3, role: 'primary'},
	...([[0.92, 0.52], [-0.92, 0.52], [0.92, -0.52], [-0.92, -0.52]] as [number, number][]).map(([x, z]): Part => ({geo: cyl(0.06, 0.06, 0.04, 12), at: [x, 1.32, z], layer: 3, role: 'primary'})),
	// layer 4: the output horn
	{geo: slab(HORN, 0.07), outline: [HORN, 0.07], at: [G3X, 1.46, 0], layer: 4, role: 'primary', spin: W3},
	{geo: cyl(0.14, 0.14, 0.1, 20), at: [G3X, 1.48, 0], layer: 4, role: 'primary'},
];
const BOT = 0.02;
const TOP = 1.53;
/** Wire for a flat extruded profile: its outline and holes at the bottom and the top only, no stub at every tooth corner. */
const outlineWire = (shape: THREE.Shape, depth: number) => {
	const pos: number[] = [];
	const loops = [shape.getPoints(8), ...shape.holes.map((h) => h.getPoints(8))];
	for (const y of [0, depth])
		for (const pts of loops)
			pts.forEach((a, i) => {
				const b = pts[(i + 1) % pts.length];
				pos.push(a.x, y, -a.y, b.x, y, -b.y);
			});
	return new LineSegmentsGeometry().setPositions(pos);
};
const EDGES = PARTS.map((p) => (p.outline ? outlineWire(...p.outline) : new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(p.geo, HO.edges.threshold_deg))));

/* ---------- motion state ---------- */
const O = HO.object;
const GAP = HO.explode.gap;
const stateAt = (f: number) => {
	const e = sp(f, M.explode_start, 'explode');
	const tk = sp(f, R.tilt_start, 'tilt');
	const bot = BOT - GAP * e;
	const top = TOP + 4 * GAP * e;
	const S = O.scale_assembled + (O.scale_exploded - O.scale_assembled) * e;
	return {e, tilt: rad(R.tilt_from_deg + (R.tilt_to_deg - R.tilt_from_deg) * tk), yaw: rad(R.yaw_start_deg + f * R.yaw_deg_per_frame), S, x: O.shift_x_exploded * e, centre: (bot + top) / 2, half: ((top - bot) / 2) * S};
};
/** The scan band: where it is in world y, whether it is on, and whether this sweep is the reveal. */
const SC = HO.scan;
const sweepAt = (f: number) => {
	const s = stateAt(f);
	const yTop = O.centre_y + s.half + 0.15;
	const yBot = O.centre_y - s.half - 0.15;
	for (const st of SC.sweeps) {
		const t = (f - st) / SC.period_frames;
		if (t >= 0 && t <= 1) return {on: true, ys: yTop + (yBot - yTop) * ease('sweep')(t), reveal: st === SC.sweeps[0], t, yTop};
	}
	return {on: false, ys: yBot, reveal: false, t: f < SC.sweeps[0] ? 0 : 1, yTop};
};

/** Projects a point on a layer of the object to frame pixels, through the same transforms as the canvas. */
const CAM = (() => {
	const c = new THREE.PerspectiveCamera(HO.camera.fov, W / H, HO.camera.near, HO.camera.far);
	c.position.set(...(HO.camera.position as V3));
	c.lookAt(...(HO.camera.look_at as V3));
	c.updateMatrixWorld();
	return c;
})();
const project = (p: V3, layer: number, f: number) => {
	const s = stateAt(f);
	const v = new THREE.Vector3(p[0], p[1] + layer * GAP * s.e - s.centre, p[2]).multiplyScalar(s.S).applyEuler(new THREE.Euler(s.tilt, s.yaw, 0));
	v.x += s.x;
	v.y += O.centre_y;
	v.project(CAM);
	return {x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H};
};

/* ---------- materials: pass 1 fresnel faces, pass 2 core and halo edges, plus the scan copy ---------- */
const VERT = `
#include <clipping_planes_pars_vertex>
varying vec3 vN; varying vec3 vV; varying float vY;
void main() {
	vec4 wp = modelMatrix * vec4(position, 1.0);
	vY = wp.y;
	vec4 mvPosition = viewMatrix * wp;
	vN = normalize(normalMatrix * normal);
	vV = -mvPosition.xyz;
	gl_Position = projectionMatrix * mvPosition;
	#include <clipping_planes_vertex>
}`;
const FRAG = `
#include <clipping_planes_pars_fragment>
uniform vec3 uColor; uniform vec3 uScan; uniform float uBase; uniform float uRim; uniform float uPow;
uniform float uScanY; uniform float uBand; uniform float uTrail; uniform float uOn; uniform float uBoost;
varying vec3 vN; varying vec3 vV; varying float vY;
void main() {
	#include <clipping_planes_fragment>
	float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPow);
	float d = vY - uScanY;
	float band = 1.0 - smoothstep(0.0, uBand, abs(d));
	float trail = d > 0.0 ? exp(-d / uTrail) : 0.0;
	gl_FragColor = vec4(uColor * (uBase + uRim * fr) + uScan * uOn * (band * uBoost + trail * 0.12), 1.0);
}`;
const faceMat = (c: string, scan: string, planes: THREE.Plane[]) =>
	new THREE.ShaderMaterial({
		uniforms: {uColor: {value: col(c)}, uScan: {value: col(scan)}, uBase: {value: HO.faces.base}, uRim: {value: HO.faces.rim}, uPow: {value: HO.faces.fresnel_power}, uScanY: {value: 0}, uBand: {value: SC.band}, uTrail: {value: SC.trail}, uOn: {value: 0}, uBoost: {value: SC.band_boost}},
		vertexShader: VERT,
		fragmentShader: FRAG,
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		side: THREE.DoubleSide,
		clipping: true,
		clippingPlanes: planes,
	});
const lineMat = (c: string, px: number, opacity: number, planes: THREE.Plane[] = [], vertexColors = false) => {
	const m = new LineMaterial({color: vertexColors ? 0xffffff : col(c).getHex(THREE.LinearSRGBColorSpace), linewidth: px, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, clippingPlanes: planes, vertexColors});
	m.resolution.set(W, H);
	return m;
};

/** Builds one hologram scene for a palette. Each Preview instance owns its own, so the 3 sheet frames never share state. */
const build = (c: Roles) => {
	const up = new THREE.Vector3(0, 1, 0);
	const reveal = new THREE.Plane(up.clone(), 100);
	const lo = new THREE.Plane(up.clone(), 0);
	const hi = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
	const E = HO.edges;
	const faces = {primary: faceMat(c.primary, c.highlight, [reveal]), secondary: faceMat(c.secondary, c.highlight, [reveal])};
	const core = {primary: lineMat(c.primary, E.core_px, 1, [reveal]), secondary: lineMat(c.secondary, E.core_px, 1, [reveal])};
	const halo = {primary: lineMat(c.primary, E.halo_px, E.halo_opacity, [reveal]), secondary: lineMat(c.secondary, E.halo_px, E.halo_opacity, [reveal])};
	const scan = lineMat(c.highlight, E.scan_px, 1, [reveal, lo, hi]);
	const world = new THREE.Group();
	const root = new THREE.Group();
	const inner = new THREE.Group();
	root.add(inner);
	world.add(root);
	const layers = new Map<number, THREE.Group>();
	const spinners: {o: THREE.Object3D; k: number}[] = [];
	PARTS.forEach((p, i) => {
		let lg = layers.get(p.layer);
		if (!lg) {
			lg = new THREE.Group();
			layers.set(p.layer, lg);
			inner.add(lg);
		}
		const g = new THREE.Group();
		g.position.set(...p.at);
		if (p.rot) g.rotation.set(...p.rot);
		g.add(new THREE.Mesh(p.geo, faces[p.role]), new LineSegments2(EDGES[i], core[p.role]), new LineSegments2(EDGES[i], halo[p.role]), new LineSegments2(EDGES[i], scan));
		lg.add(g);
		if (p.spin) spinners.push({o: g, k: p.spin});
	});
	// perspective floor grid: short segments so the colour can fade with distance
	const GR = HO.grid;
	const pos: number[] = [];
	const cols: number[] = [];
	const gc = col(c.grid);
	const fade = (x: number, z: number) => Math.max(0, 1 - Math.hypot(x, z) / GR.fade_radius) ** 1.5;
	const push = (a: [number, number], b: [number, number]) => {
		pos.push(a[0], GR.y, a[1], b[0], GR.y, b[1]);
		for (const [x, z] of [a, b]) cols.push(gc.r * fade(x, z), gc.g * fade(x, z), gc.b * fade(x, z));
	};
	for (let u = -GR.extent; u <= GR.extent + 1e-6; u += GR.step)
		for (let v = -GR.extent; v < GR.extent - 1e-6; v += GR.step) {
			push([u, v], [u, v + GR.step]);
			push([v, u], [v + GR.step, u]);
		}
	const gg = new LineSegmentsGeometry().setPositions(pos).setColors(cols);
	const gridMat = lineMat(c.grid, GR.px, 1, [], true);
	world.add(new LineSegments2(gg, gridMat));
	// turntable ring with ticks under the object
	const TT = HO.turntable;
	const rp: number[] = [];
	for (let k = 0; k < 96; k++) {
		const a0 = (k / 96) * Math.PI * 2;
		const a1 = ((k + 1) / 96) * Math.PI * 2;
		rp.push(TT.radius * Math.cos(a0), 0, TT.radius * Math.sin(a0), TT.radius * Math.cos(a1), 0, TT.radius * Math.sin(a1));
	}
	for (let k = 0; k < TT.ticks; k++) {
		const a = (k / TT.ticks) * Math.PI * 2;
		const l = k % 4 === 0 ? 0.24 : 0.1;
		rp.push(TT.radius * Math.cos(a), 0, TT.radius * Math.sin(a), (TT.radius + l) * Math.cos(a), 0, (TT.radius + l) * Math.sin(a));
	}
	const ringMat = lineMat(c.primary, 1.8, 0.55);
	const ring = new LineSegments2(new LineSegmentsGeometry().setPositions(rp), ringMat);
	ring.position.y = GR.y + 0.01;
	world.add(ring);
	// the scan plane: four corner marks in highlight that ride the band, fixed to the world, not the object
	const SF = SC.frame;
	const fp: number[] = [];
	for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
		const x = sx * SF.half;
		const z = sz * SF.half;
		fp.push(x, 0, z, x - sx * SF.mark, 0, z, x, 0, z, x, 0, z - sz * SF.mark);
	}
	const fg = new LineSegmentsGeometry().setPositions(fp);
	const scanFrame = new THREE.Group();
	scanFrame.add(new LineSegments2(fg, lineMat(c.highlight, E.core_px, SF.opacity)), new LineSegments2(fg, lineMat(c.highlight, E.halo_px, E.halo_opacity)));
	world.add(scanFrame);
	return {world, root, inner, layers, spinners, reveal, lo, hi, faces, scan, gridMat, ringMat, ring, scanFrame};
};

const Hologram: React.FC<{c: Roles; f: number}> = ({c, f}) => {
	const B = useMemo(() => build(c), [c]);
	const s = stateAt(f);
	const sw = sweepAt(f);
	B.root.position.set(s.x, O.centre_y, 0);
	B.root.rotation.set(s.tilt, s.yaw, 0);
	B.root.scale.setScalar(s.S);
	B.inner.position.y = -s.centre;
	B.layers.forEach((g, li) => (g.position.y = li * GAP * s.e));
	B.spinners.forEach(({o, k}) => (o.rotation.y = rad(f * M.gears.deg_per_frame * k)));
	B.reveal.constant = f < SC.sweeps[0] ? -(sw.yTop + 1) : sw.reveal ? -sw.ys : 100;
	B.lo.constant = -(sw.ys - SC.band);
	B.hi.constant = sw.ys + SC.band;
	B.scan.visible = sw.on;
	for (const m of Object.values(B.faces)) {
		m.uniforms.uScanY.value = sw.ys;
		m.uniforms.uOn.value = sw.on ? 1 : 0;
	}
	B.gridMat.opacity = seg(f, 0, 20, 'draw');
	B.ringMat.opacity = 0.55 * seg(f, 6, 24, 'draw');
	B.ring.rotation.y = s.yaw;
	B.ring.position.x = s.x;
	B.scanFrame.position.x = s.x;
	B.scanFrame.visible = sw.on;
	B.scanFrame.position.y = sw.ys;
	return (
		<>
			<color attach="background" args={[col(c.bg)]} />
			<primitive object={B.world} />
		</>
	);
};

/* ---------- HUD ---------- */
const TAGS: {box: Box; at: V3; layer: number; start: number; n: string; label: string; value: string}[] = [
	{box: BOXES.t1, at: [G3X, TOP, 0], layer: 4, start: 96, n: '01', label: 'OUTPUT', value: 'SPLINE HORN'},
	{box: BOXES.t2, at: [0, 0.9, 0], layer: 2, start: 108, n: '02', label: 'REDUCTION', value: '3 GEARS'},
	{box: BOXES.t3, at: [G1X, 0.35, 0.3], layer: -1, start: 120, n: '03', label: 'DRIVE', value: 'DC MOTOR'},
];
/** Anchor of tag i at a frame, in frame pixels. */
export const anchorAt = (i: number, f: number) => project(TAGS[i].at, TAGS[i].layer, f);
const GLITCH = [58, 150];
const glitchAt = (f: number) => GLITCH.some((g) => f >= g && f < g + HO.glitch.frames);

const Scene: React.FC<{palette: string; pairing: string}> = ({palette, pairing}) => {
	const f = useCurrentFrame();
	const c = useMemo(() => rolesOf(palette), [palette]);
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	const T = ds.tokens;
	const s = stateAt(f);
	const sw = sweepAt(f);
	const glitch = glitchAt(f);
	const d = HO.glitch.offset_px * (f % 2 ? 1 : -1);
	const fid = `rgb-split-${f}`;
	const fx = glitch ? {filter: `url(#${fid})`} : {};
	const text = {color: c.ink, margin: 0, fontVariantNumeric: 'tabular-nums'} as React.CSSProperties;
	const titleIn = (n: number) => seg(f, 6 + n * 5, 20 + n * 5);
	const BLACK = c.bg.replace(/[0-9a-f]/gi, '0');
	const tag = {background: c.surface, border: `${T.tag.border.width}px solid ${c.primary}`, borderRadius: T.tag.radius, boxSizing: 'border-box', paddingLeft: T.tag.pad, display: 'flex', flexDirection: 'column', justifyContent: 'center'} as React.CSSProperties;
	const yawDeg = ((((R.yaw_start_deg + f * R.yaw_deg_per_frame) % 360) + 360) % 360).toFixed(1).padStart(5, '0');
	const scanPct = sw.on ? String(Math.round(sw.t * 100)).padStart(3, '0') + '%' : f < SC.sweeps[0] ? 'WAIT' : 'IDLE';
	const layersOut = String(1 + Math.round(s.e * 5)).padStart(2, '0') + '/06';
	const readouts = [
		{box: BOXES.r1, label: 'AXIS Y', value: yawDeg + '°'},
		{box: BOXES.r2, label: 'SCAN', value: scanPct},
		{box: BOXES.r3, label: 'LAYERS', value: layersOut},
	];
	const bk = T.bracket;
	return (
		<AbsoluteFill style={{background: c.bg, overflow: 'hidden'}}>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<defs>
					<filter id={fid} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
						<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
						<feOffset in="r" dx={-d} dy={0} result="ro" />
						<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
						<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
						<feOffset in="b" dx={d} dy={0} result="bo" />
						<feBlend in="ro" in2="g" mode="screen" result="rg" />
						<feBlend in="rg" in2="bo" mode="screen" />
					</filter>
				</defs>
			</svg>

			<div style={{position: 'absolute', inset: 0, ...fx, transform: glitch ? `translateX(${d / 2}px)` : undefined}}>
				<ThreeCanvas width={W} height={H} flat linear camera={{fov: HO.camera.fov, position: HO.camera.position as V3, near: HO.camera.near, far: HO.camera.far}} gl={{antialias: true}}>
					<Hologram c={c} f={f} />
				</ThreeCanvas>
			</div>

			{/* scanlines over the hologram, under the text */}
			<div style={{position: 'absolute', inset: 0, background: `repeating-linear-gradient(0deg, transparent 0px, transparent ${T.scanlines.gap - T.scanlines.line}px, ${hexA(BLACK, T.scanlines.alpha)} ${T.scanlines.gap - T.scanlines.line}px, ${hexA(BLACK, T.scanlines.alpha)} ${T.scanlines.gap}px)`}} />

			<svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
				{/* corner brackets */}
				{(
					[
						[bk.inset, bk.inset, 1, 1],
						[W - bk.inset, bk.inset, -1, 1],
						[bk.inset, H - bk.inset, 1, -1],
						[W - bk.inset, H - bk.inset, -1, -1],
					] as [number, number, number, number][]
				).map(([x, y, sx, sy], k) => {
					const a = bk.arm * seg(f, 2, 16);
					return <path key={k} d={`M ${x} ${y + sy * a} L ${x} ${y} L ${x + sx * a} ${y}`} stroke={c.primary} strokeWidth={bk.stroke} fill="none" />;
				})}
				{/* leaders: 40 px out of the tag, then a diagonal to the anchor, ending in a ring */}
				{TAGS.map((t, i) => {
					const k = seg(f, t.start + 4, t.start + 4 + T.leader.draw_frames, 'draw');
					if (k <= 0) return null;
					const a = anchorAt(i, f);
					const x0 = ((t.box.x + t.box.w) / 100) * W;
					const y0 = ((t.box.y + t.box.h / 2) / 100) * H;
					return (
						<g key={i}>
							<polyline points={`${x0},${y0} ${x0 + T.leader.elbow},${y0} ${a.x},${a.y}`} stroke={c.primary} strokeWidth={T.leader.width} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
							<circle cx={a.x} cy={a.y} r={T.leader.ring * k} stroke={c.primary} strokeWidth={T.leader.width} fill={hexA(c.bg, 0.6)} />
							<circle cx={a.x} cy={a.y} r={4 * k} fill={c.highlight} />
						</g>
					);
				})}
			</svg>

			{/* title block */}
			<div style={fx}>
				<div style={{...abs(BOXES.kicker), ...fontCss(pair.mono, 34), ...text, color: c.primary, whiteSpace: 'nowrap', opacity: titleIn(0)}}>TEARDOWN 07 / SX-4 ACTUATOR</div>
				<div style={{...abs(BOXES.title), ...fontCss(pair.display, 100), ...text}}>
					{['INSIDE A', 'SERVO'].map((line, n) => (
						<div key={line} style={{whiteSpace: 'nowrap', opacity: titleIn(n + 1), transform: `translateX(${(1 - titleIn(n + 1)) * -40}px)`}}>
							{line}
						</div>
					))}
				</div>
			</div>

			{/* callout tags */}
			{TAGS.map((t, i) => {
				const k = sp(f, t.start, 'tag');
				return (
					<div key={i} style={{...abs(t.box), ...tag, transform: `scale(${0.7 + 0.3 * k})`, transformOrigin: 'left center', opacity: Math.min(1, k * 1.5)}}>
						<div style={{...fontCss(pair.mono, 34), ...text, color: c.primary, whiteSpace: 'nowrap'}}>
							{t.n} {t.label}
						</div>
						<div style={{...fontCss(pair.accent, 46), ...text, whiteSpace: 'nowrap', marginTop: 6}}>{t.value}</div>
					</div>
				);
			})}

			{/* live readouts: fixed-length values in tabular numerals */}
			{readouts.map((r, i) => (
				<div key={i} style={{...abs(r.box), ...tag, opacity: seg(f, 14 + i * M.stagger_frames, 26 + i * M.stagger_frames)}}>
					<div style={{...fontCss(pair.mono, 34), ...text, color: c.dim, whiteSpace: 'nowrap'}}>{r.label}</div>
					<div style={{...fontCss(pair.accent, 52), ...text, whiteSpace: 'nowrap', marginTop: 6}}>{r.value}</div>
				</div>
			))}
		</AbsoluteFill>
	);
};

export const Preview: React.FC<PreviewProps> = ({palette = 'deep-lab', pairing = 'unbounded-plexsans-plexmono'}) => {
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	return (
		<FontGate fonts={{...pair, name: pair.id}}>
			<Scene palette={palette} pairing={pairing} />
		</FontGate>
	);
};

/** Three beats side by side: the reveal sweep, the exploded turn with the first tag, the final frame. */
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
