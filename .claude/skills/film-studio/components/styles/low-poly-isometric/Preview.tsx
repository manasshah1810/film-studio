import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, Freeze, interpolate, spring, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import ds from '../../../styles/low-poly-isometric/design-system.json';
import {FontGate} from '../../engine/fonts';
import {fontCss} from '../../engine/tokens';
import type {Pairing} from '../../engine/types';

/**
 * low-poly-isometric specimen: one 6 s scene, 1080 x 1920 at 30 fps. A floating 6 x 6 tile harbour block drawn in @remotion/three.
 * True isometric: an orthographic camera on the (1, 1, 1) diagonal (pitch 35.264 degrees, yaw 45 degrees). Every material is flat shaded.
 * One key light casts the shadows, one rim light cools the back edges. Three 3D callout pins drop on the factory, the ship and the market.
 * All text is DOM on top of the canvas: a title, a numbered badge over each pin and three label plates. The town is fictional.
 */
export type PreviewProps = {palette?: string; pairing?: string};
export const PREVIEW_FRAMES = 180;
export const SHEET_FRAMES = [40, 100, 168];
const W = 1080;
const H = 1920;
const FPS = 30;
export const SHEET_SIZE = {width: W * SHEET_FRAMES.length, height: H};
const ISO = ds.iso;
const Z = ISO.camera.zoom_px_per_unit;
const CX = ISO.centre_px.x;
const CY = ISO.centre_px.y;
const M = ds.motion;

/** Static text boxes in percent of the frame. Mirrored 1:1 by the storyboard that check-safezones reads. */
export const BOXES = {
	kicker: {x: 9, y: 7.5, w: 76, h: 2.4},
	title: {x: 9, y: 10.5, w: 76, h: 11.5},
	p1: {x: 9, y: 69, w: 24, h: 8.4},
	p2: {x: 35, y: 69, w: 24, h: 8.4},
	p3: {x: 61, y: 69, w: 24, h: 8.4},
};
const BADGE = 64;
const BADGE_LIFT = 78;
const abs = (b: {x: number; y: number; w: number; h: number}) => ({position: 'absolute', left: (b.x / 100) * W, top: (b.y / 100) * H, width: (b.w / 100) * W, height: (b.h / 100) * H}) as React.CSSProperties;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (n: keyof typeof M.easings) => Easing.bezier(...(M.easings[n] as [number, number, number, number]));
const seg = (f: number, a: number, b: number, e: keyof typeof M.easings = 'settle') => interpolate(f, [a, b], [0, 1], {...clamp, easing: ease(e)});
const sp = (f: number, start: number, cfg: keyof typeof M.springs) => (f < start ? 0 : spring({frame: f - start, fps: FPS, config: M.springs[cfg]}));
const mix = (a: string, b: string, t: number) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
const hexA = (h: string, a: number) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
const rnd = (n: number) => {
	const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return s - Math.floor(s);
};
type Roles = Record<string, string>;
/** Relative luminance, to tell a dark sky from a light one. */
const lum = (h: string) => {
	const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
	return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
type V3 = [number, number, number];
const BLACK = mix(ISO.lights.key.tint, ISO.lights.key.tint, 0).replace(/[0-9a-f]/gi, '0');
const WHITE = BLACK.replace(/0/g, 'f');

/** Focused palettes have 5 roles: the model is one clay colour plus an accent. Expanded palettes carry all 10. */
const rolesOf = (id: string): Roles => {
	const p = ds.palettes.find((x) => x.id === id) ?? ds.palettes[0];
	const r: Roles = {...(p.roles as Roles)};
	const dark = lum(r.bg) < 0.1;
	if (!r.earth) {
		r.earth = dark ? mix(r.ground, WHITE, 0.2) : mix(r.ground, BLACK, 0.38);
		r.wall = mix(r.ground, WHITE, 0.62);
		r.roof = r.primary;
		r.foliage = dark ? mix(r.ground, WHITE, 0.3) : mix(r.ground, BLACK, 0.2);
		r.water = mix(r.ground, WHITE, 0.36);
	}
	r.rock = dark ? mix(r.earth, WHITE, 0.15) : mix(r.earth, BLACK, 0.12);
	r.road = mix(r.ground, BLACK, 0.34);
	r.dark = mix(r.earth, BLACK, 0.45);
	r.glass = mix(r.water, BLACK, 0.25);
	r.smoke = mix(r.wall, WHITE, 0.6);
	return r;
};

/** World state at a frame: turntable yaw (radians), pull-back scale, bob (px). */
const world = (f: number) => {
	const yaw = (-M.turntable.deg * Math.cos((Math.PI * f) / PREVIEW_FRAMES) * Math.PI) / 180;
	const pull = sp(f, M.pull_back.start, 'pull_back');
	const scale = M.pull_back.from + (M.pull_back.to - M.pull_back.from) * pull;
	const bob = Math.sin((f / M.bob.period_frames) * Math.PI * 2) * M.bob.px;
	return {yaw, scale, bob, shift: (scale - 1) * 260};
};
/** Isometric projection of a point in the diorama to frame pixels. Matches the canvas camera exactly. */
const project = (p: V3, f: number) => {
	const w = world(f);
	const x = p[0] * w.scale;
	const y = p[1] * w.scale;
	const z = p[2] * w.scale;
	const xr = x * Math.cos(w.yaw) + z * Math.sin(w.yaw);
	const zr = -x * Math.sin(w.yaw) + z * Math.cos(w.yaw);
	return {x: CX + (Z * (xr - zr)) / Math.SQRT2, y: CY + w.bob + w.shift - (Z * (-xr + 2 * y - zr)) / Math.sqrt(6)};
};

/* ---------- faceted parts ---------- */
const Mat: React.FC<{c: string}> = ({c}) => <meshLambertMaterial color={c} flatShading side={THREE.DoubleSide} />;
const Box: React.FC<{p: V3; s: V3; c: string; r?: V3}> = ({p, s, c, r}) => (
	<mesh position={p} rotation={r} castShadow receiveShadow>
		<boxGeometry args={s} />
		<Mat c={c} />
	</mesh>
);
const Cyl: React.FC<{p: V3; a: [number, number, number, number]; c: string; r?: V3}> = ({p, a, c, r}) => (
	<mesh position={p} rotation={r} castShadow receiveShadow>
		<cylinderGeometry args={a} />
		<Mat c={c} />
	</mesh>
);
const Ico: React.FC<{p: V3; s: number; c: string; r?: V3}> = ({p, s, c, r}) => (
	<mesh position={p} rotation={r} scale={s} castShadow receiveShadow>
		<icosahedronGeometry args={[1, 0]} />
		<Mat c={c} />
	</mesh>
);
/** A prism: a triangle in x and y (base w, height h, apex at x = ax) pushed d along z. A gable or a sawtooth roof. */
const prismGeo = (w: number, h: number, d: number, ax: number) => {
	const A: V3[] = [[-w / 2, 0, d / 2], [w / 2, 0, d / 2], [ax, h, d / 2]];
	const B: V3[] = A.map(([x, y]) => [x, y, -d / 2]);
	const t: V3[] = [A[0], A[1], A[2], B[1], B[0], B[2], A[0], A[2], B[2], A[0], B[2], B[0], A[1], B[1], B[2], A[1], B[2], A[2]];
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(t.flat(), 3));
	g.computeVertexNormals();
	return g;
};
const Prism: React.FC<{p: V3; w: number; h: number; d: number; ax?: number; c: string; ry?: number}> = ({p, w, h, d, ax = 0, c, ry = 0}) => {
	const g = useMemo(() => prismGeo(w, h, d, ax), [w, h, d, ax]);
	return (
		<mesh position={p} rotation={[0, ry, 0]} geometry={g} castShadow receiveShadow>
			<Mat c={c} />
		</mesh>
	);
};
/** The rock under the island: an upside-down 4 sided cone with its middle rings pushed about. */
const rockGeo = (half: number, depth: number) => {
	const g = new THREE.ConeGeometry(half * Math.SQRT2, depth, 4, 3);
	const pos = g.attributes.position;
	for (let i = 0; i < pos.count; i++) {
		const x = pos.getX(i);
		const y = pos.getY(i);
		const z = pos.getZ(i);
		const edge = Math.abs(y) > depth / 2 - 0.01;
		if (edge) continue;
		const k = Math.round(x * 10) * 3.1 + Math.round(y * 10) * 7.7 + Math.round(z * 10) * 1.3;
		const m = 0.82 + rnd(k) * 0.42;
		pos.setXYZ(i, x * m, y + (rnd(k + 5) - 0.5) * 0.5, z * m);
	}
	g.computeVertexNormals();
	return g;
};
/** Wraps a part that pops up from its base on a spring. */
const Pop: React.FC<{at: V3; k: number; children: React.ReactNode; ry?: number}> = ({at, k, children, ry = 0}) => (
	<group position={at} rotation={[0, ry, 0]} scale={Math.max(0.0001, k)} visible={k > 0.001}>
		{children}
	</group>
);

const Tree: React.FC<{c: Roles; s?: number}> = ({c, s = 1}) => (
	<group scale={s}>
		<Cyl p={[0, 0.14, 0]} a={[0.06, 0.08, 0.28, 5]} c={c.earth} />
		<mesh position={[0, 0.56, 0]} castShadow receiveShadow>
			<coneGeometry args={[0.34, 0.6, ISO.facets.cone_segments]} />
			<Mat c={c.foliage} />
		</mesh>
		<mesh position={[0, 0.92, 0]} castShadow receiveShadow>
			<coneGeometry args={[0.24, 0.48, ISO.facets.cone_segments]} />
			<Mat c={mix(c.foliage, WHITE, 0.12)} />
		</mesh>
	</group>
);
const House: React.FC<{c: Roles}> = ({c}) => (
	<>
		<Box p={[0, 0.24, 0]} s={[0.62, 0.48, 0.62]} c={c.wall} />
		<mesh position={[0, 0.68, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
			<coneGeometry args={[0.54, 0.42, 4]} />
			<Mat c={c.roof} />
		</mesh>
		<Box p={[0.1, 0.13, 0.315]} s={[0.14, 0.26, 0.02]} c={c.dark} />
	</>
);
const Stall: React.FC<{c: Roles; top: string}> = ({c, top}) => (
	<>
		<Box p={[0, 0.15, 0]} s={[0.62, 0.3, 0.36]} c={c.wall} />
		<Box p={[-0.28, 0.42, 0.14]} s={[0.05, 0.56, 0.05]} c={c.earth} />
		<Box p={[0.28, 0.42, 0.14]} s={[0.05, 0.56, 0.05]} c={c.earth} />
		<Box p={[0, 0.72, 0.05]} s={[0.76, 0.06, 0.62]} c={top} r={[0.34, 0, 0]} />
		<Box p={[-0.14, 0.36, 0]} s={[0.16, 0.12, 0.16]} c={c.primary} />
		<Box p={[0.12, 0.35, 0.02]} s={[0.14, 0.1, 0.14]} c={c.foliage} />
	</>
);

/** A Mode B faceted Story Actor: five parts, no face. States: idle (bob), react (hop), act (wave). */
const Actor: React.FC<{c: Roles; f: number}> = ({c, f}) => {
	const hop = f >= 142 && f < 154 ? Math.sin(((f - 142) / 12) * Math.PI) * 0.26 : 0;
	const act = seg(f, 152, 160);
	const arm = act * (2.5 + Math.sin(f * 0.55) * 0.35);
	const idle = Math.sin(f * 0.18) * 0.012;
	return (
		<group position={[0, hop + idle, 0]} scale={1.45}>
			<Box p={[0, 0.07, 0]} s={[0.16, 0.14, 0.1]} c={c.dark} />
			<Cyl p={[0, 0.29, 0]} a={[0.075, 0.13, 0.32, 6]} c={c.primary} />
			<Ico p={[0, 0.54, 0]} s={0.1} c={c.wall} />
			<mesh position={[0, 0.66, 0]} castShadow>
				<coneGeometry args={[0.15, 0.1, 6]} />
				<Mat c={c.roof} />
			</mesh>
			<group position={[0.12, 0.42, 0]} rotation={[0, 0, arm]}>
				<Box p={[0, -0.11, 0]} s={[0.05, 0.22, 0.05]} c={c.primary} />
			</group>
			<Box p={[-0.12, 0.31, 0]} s={[0.05, 0.22, 0.05]} c={c.primary} />
		</group>
	);
};

/** A 3D callout pin: a base ring, a thin stem and a faceted head that spins. Falls onto its target on a spring. */
const Pin: React.FC<{at: V3; c: Roles; f: number; start: number}> = ({at, c, f, start}) => {
	const k = sp(f, start, 'pin');
	const P = ISO.pin;
	return (
		<group position={[at[0], at[1] + (1 - k) * 3, at[2]]} visible={f >= start}>
			<Cyl p={[0, 0.02, 0]} a={[0.13, 0.13, 0.04, 6]} c={c.primary} />
			<Cyl p={[0, P.stem / 2, 0]} a={[P.stem_radius, P.stem_radius, P.stem, 5]} c={c.dark} />
			<Cyl p={[0, P.stem - 0.02, 0]} a={[P.collar_radius, P.collar_radius * 0.8, 0.08, 6]} c={c.surface} />
			<mesh position={[0, P.stem + P.head_radius * 0.7, 0]} rotation={[0, (f * P.spin_deg_per_frame * Math.PI) / 180, 0]} scale={[1, 1.25, 1]} castShadow>
				<octahedronGeometry args={[P.head_radius, 0]} />
				<Mat c={c.primary} />
			</mesh>
		</group>
	);
};
const PINS: {at: V3; start: number; n: string; word: string; sub: string}[] = [
	{at: [-1.75, 1.0, -2.05], start: 96, n: '1', word: 'MAKE', sub: 'FACTORY'},
	{at: [-0.95, 0.5, 2.5], start: 116, n: '2', word: 'MOVE', sub: 'HARBOUR'},
	{at: [1.85, 0.78, -0.5], start: 136, n: '3', word: 'SELL', sub: 'MARKET'},
];
const headOf = (at: V3): V3 => [at[0], at[1] + ISO.pin.stem + ISO.pin.head_radius * 0.7, at[2]];
/** Centre of the numbered badge over pin i at a frame, in frame pixels. */
export const badgeAt = (i: number, f: number) => {
	const h = project(headOf(PINS[i].at), f);
	return {x: h.x, y: h.y - BADGE_LIFT};
};

const Diorama: React.FC<{c: Roles; f: number}> = ({c, f}) => {
	const G = ISO.grid;
	const N = G.tiles;
	const half = N / 2;
	const rock = useMemo(() => rockGeo(half, G.rock_depth), [half, G.rock_depth]);
	const w = world(f);
	const L = ISO.lights;
	const b = (start: number) => sp(f, start, 'build');
	const tiles: React.ReactNode[] = [];
	for (let i = 0; i < N; i++)
		for (let j = 0; j < N; j++) {
			const x = i - half + 0.5;
			const z = j - half + 0.5;
			const k = sp(f, 8 + (i + j) * M.stagger_frames, 'tile');
			const water = j === N - 1;
			const road = i === 3 && !water;
			const top = water ? c.water : (i + j) % 2 ? c.ground : mix(c.ground, WHITE, 0.09);
			tiles.push(
				<group key={`${i}-${j}`} position={[x, (1 - k) * -1.2, z]} scale={Math.max(0.0001, k)} visible={k > 0.001}>
					<Box p={[0, -G.slab - G.earth / 2, 0]} s={[1, G.earth, 1]} c={c.earth} />
					{water ? <Box p={[0, -G.slab / 2 - 0.05, 0]} s={[0.96, G.slab - 0.1, 0.96]} c={top} /> : <Box p={[0, -G.slab / 2, 0]} s={[0.96, G.slab, 0.96]} c={top} />}
					{road && <Box p={[0, 0.012, 0]} s={[0.5, 0.024, 1]} c={c.road} />}
					{road && j % 2 === 0 && <Box p={[0, 0.03, 0]} s={[0.05, 0.012, 0.3]} c={c.wall} />}
				</group>,
			);
		}
	const smokeOn = f > 52;
	const truckZ = -2.6 + 3.8 * seg(f, 98, 172, 'drift');
	return (
		<>
			<ambientLight intensity={L.ambient.intensity} />
			<directionalLight position={L.key.direction.map((v) => v * 20) as V3} intensity={L.key.intensity} color={L.key.tint} castShadow shadow-mapSize={[ISO.shadow.map, ISO.shadow.map]} shadow-bias={ISO.shadow.bias} shadow-normalBias={ISO.shadow.normal_bias}>
				<orthographicCamera attach="shadow-camera" args={[-ISO.shadow.bounds, ISO.shadow.bounds, ISO.shadow.bounds, -ISO.shadow.bounds, 1, 60]} />
			</directionalLight>
			<directionalLight position={L.rim.direction.map((v) => v * 20) as V3} intensity={L.rim.intensity} color={L.rim.tint} />
			<group rotation={[0, w.yaw, 0]} scale={w.scale}>
				{/* rock */}
				<group position={[0, -G.slab - G.earth, 0]} scale={Math.max(0.0001, sp(f, 0, 'build'))}>
					<mesh geometry={rock} position={[0, -G.rock_depth / 2, 0]} rotation={[Math.PI, Math.PI / 4, 0]} castShadow>
						<Mat c={c.rock} />
					</mesh>
				</group>
				{tiles}

				{/* factory: sawtooth roof, chimney, smoke */}
				<Pop at={[-1.9, 0, -1.9]} k={b(30)}>
					<Box p={[0, 0.5, 0]} s={[1.7, 1.0, 1.5]} c={c.wall} />
					{[-0.56, 0, 0.56].map((x) => (
						<Prism key={x} p={[x, 1.0, 0]} w={0.56} h={0.32} d={1.5} ax={-0.28} c={c.roof} />
					))}
					<Box p={[0.3, 0.26, 0.76]} s={[0.4, 0.52, 0.03]} c={c.dark} />
					{[-0.5, -0.1].map((x) => (
						<Box key={x} p={[x, 0.62, 0.76]} s={[0.26, 0.2, 0.03]} c={c.glass} />
					))}
					{[-0.4, 0.2].map((z) => (
						<Box key={z} p={[0.86, 0.62, z]} s={[0.03, 0.2, 0.3]} c={c.glass} />
					))}
					<Cyl p={[0.55, 1.2, -0.55]} a={[0.15, 0.2, 2.2, ISO.facets.cylinder_segments]} c={c.wall} />
					<Cyl p={[0.55, 2.24, -0.55]} a={[0.19, 0.19, 0.16, ISO.facets.cylinder_segments]} c={c.primary} />
					{smokeOn &&
						[0, 1, 2].map((n) => {
							const t = ((f + n * 20) % 60) / 60;
							return <Ico key={n} p={[0.55 + t * 0.35, 2.4 + t * 1.25, -0.55 - t * 0.2]} s={0.08 + Math.sin(t * Math.PI) * 0.2} c={c.smoke} r={[t * 2, t * 3, 0]} />;
						})}
				</Pop>

				{/* warehouse */}
				<Pop at={[-1.85, 0, 0.5]} k={b(36)}>
					<Box p={[0, 0.3, 0]} s={[1.5, 0.6, 0.86]} c={c.wall} />
					<Prism p={[0, 0.6, 0]} w={0.94} h={0.34} d={1.58} c={c.roof} ry={Math.PI / 2} />
					<Box p={[0.2, 0.2, 0.44]} s={[0.44, 0.4, 0.03]} c={c.dark} />
				</Pop>

				{/* crane on the quay */}
				<Pop at={[-2.5, 0, 1.55]} k={b(42)}>
					<Box p={[0, 0.08, 0]} s={[0.4, 0.16, 0.4]} c={c.dark} />
					<Box p={[0, 0.9, 0]} s={[0.13, 1.6, 0.13]} c={c.primary} />
					<Box p={[0, 1.68, 0.4]} s={[0.11, 0.11, 1.5]} c={c.primary} />
					<Box p={[0, 1.3 + Math.sin(f * 0.09) * 0.08, 0.95]} s={[0.02, 0.7, 0.02]} c={c.dark} />
					<Box p={[0, 0.88 + Math.sin(f * 0.09) * 0.16, 0.95]} s={[0.24, 0.2, 0.34]} c={c.roof} />
				</Pop>

				{/* ship in the harbour */}
				<Pop at={[-1.5, -0.12 + Math.sin(f * 0.11) * 0.025, 2.5]} k={b(46)}>
					<Box p={[0, 0.12, 0]} s={[1.3, 0.26, 0.5]} c={c.roof} />
					<Box p={[0.72, 0.14, 0]} s={[0.3, 0.2, 0.3]} c={c.roof} r={[0, Math.PI / 4, 0]} />
					<Box p={[-0.46, 0.46, 0]} s={[0.26, 0.42, 0.4]} c={c.wall} />
					<Box p={[-0.32, 0.52, 0]} s={[0.02, 0.12, 0.32]} c={c.glass} />
					<Box p={[-0.06, 0.36, 0]} s={[0.3, 0.22, 0.38]} c={c.primary} />
					<Box p={[0.28, 0.36, 0]} s={[0.3, 0.22, 0.38]} c={c.foliage} />
					<Box p={[0.1, 0.58, 0]} s={[0.3, 0.22, 0.38]} c={c.wall} />
				</Pop>
				{/* pier */}
				<Pop at={[0.5, 0, 2.5]} k={b(44)}>
					<Box p={[0, -0.04, -0.1]} s={[0.56, 0.1, 0.8]} c={c.wall} />
					<Box p={[-0.2, -0.16, 0.2]} s={[0.08, 0.3, 0.08]} c={c.earth} />
					<Box p={[0.2, -0.16, 0.2]} s={[0.08, 0.3, 0.08]} c={c.earth} />
				</Pop>

				{/* office tower on the right corner */}
				<Pop at={[2.45, 0, -2.45]} k={b(34)}>
					<Box p={[0, 0.7, 0]} s={[0.84, 1.4, 0.84]} c={c.wall} />
					<Box p={[0, 1.9, 0]} s={[0.6, 1.0, 0.6]} c={c.wall} />
					<Box p={[0, 2.45, 0]} s={[0.68, 0.1, 0.68]} c={c.roof} />
					<Box p={[0, 2.8, 0]} s={[0.04, 0.6, 0.04]} c={c.dark} />
					{[0.3, 0.6, 0.9, 1.2].map((y) => (
						<React.Fragment key={y}>
							<Box p={[0, y, 0.425]} s={[0.62, 0.1, 0.02]} c={c.glass} />
							<Box p={[0.425, y, 0]} s={[0.02, 0.1, 0.62]} c={c.glass} />
						</React.Fragment>
					))}
					{[1.6, 1.9, 2.2].map((y) => (
						<React.Fragment key={y}>
							<Box p={[0, y, 0.305]} s={[0.42, 0.1, 0.02]} c={c.glass} />
							<Box p={[0.305, y, 0]} s={[0.02, 0.1, 0.42]} c={c.glass} />
						</React.Fragment>
					))}
				</Pop>

				{/* houses */}
				<Pop at={[1.5, 0, -2.45]} k={b(38)}>
					<House c={c} />
				</Pop>
				<Pop at={[2.45, 0, -1.45]} k={b(41)}>
					<House c={c} />
				</Pop>

				{/* market: two stalls and the Story Actor */}
				<Pop at={[1.45, 0, -0.5]} k={b(48)}>
					<Stall c={c} top={c.primary} />
				</Pop>
				<Pop at={[2.35, 0, -0.45]} k={b(52)}>
					<Stall c={c} top={c.roof} />
				</Pop>
				<Pop at={[1.9, 0, 0.35]} k={b(58)} ry={0.5}>
					<Actor c={c} f={f} />
				</Pop>

				{/* trees */}
				{(
					[
						[-0.5, -2.5, 1.1],
						[-0.45, -1.45, 0.9],
						[-0.55, -0.5, 1.0],
						[-0.5, 1.5, 0.85],
						[1.5, 1.45, 1.05],
						[2.5, 1.5, 0.9],
						[2.45, 0.55, 1.15],
						[-2.5, -0.55, 0.8],
						[1.45, -1.5, 0.8],
					] as V3[]
				).map(([x, z, s], n) => (
					<Pop key={n} at={[x, 0, z]} k={b(32 + n * 3)} ry={n * 0.7}>
						<Tree c={c} s={s} />
					</Pop>
				))}

				{/* truck on the road */}
				<Pop at={[0.5, 0.03, truckZ]} k={b(94)}>
					<Box p={[0, 0.2, -0.08]} s={[0.26, 0.28, 0.42]} c={c.wall} />
					<Box p={[0, 0.16, 0.22]} s={[0.26, 0.2, 0.16]} c={c.primary} />
					<Box p={[0, 0.05, 0]} s={[0.3, 0.08, 0.5]} c={c.dark} />
				</Pop>

				{PINS.map((p, n) => (
					<Pin key={n} at={p.at} c={c} f={f} start={p.start} />
				))}
			</group>
		</>
	);
};

const Scene: React.FC<{palette: string; pairing: string}> = ({palette, pairing}) => {
	const f = useCurrentFrame();
	const c = rolesOf(palette);
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	const w = world(f);
	const T = ds.tokens;
	const text = {color: c.ink, margin: 0} as React.CSSProperties;
	const titleIn = (n: number) => seg(f, 6 + n * 5, 20 + n * 5);
	const plate = {background: c.surface, border: `${T.card.border.width}px solid ${c.ink}`, borderRadius: T.card.radius, boxShadow: `0 ${T.card.drop.y}px 0 ${hexA(c.ink, T.card.drop.alpha)}`, boxSizing: 'border-box'} as React.CSSProperties;
	const chip = {width: BADGE, height: BADGE, borderRadius: BADGE / 2, background: c.surface, border: `${T.card.border.width}px solid ${c.ink}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', ...fontCss(pair.mono, 38), letterSpacing: 0, lineHeight: 1, color: c.ink} as React.CSSProperties;
	const shadowK = 1 - w.bob / 60;
	return (
		<AbsoluteFill style={{background: c.bg, overflow: 'hidden'}}>
			{/* soft blob far below the island: it floats */}
			<div style={{position: 'absolute', left: CX - 210 * shadowK, top: 1288, width: 420 * shadowK, height: 36, borderRadius: '50%', background: mix(c.bg, BLACK, ISO.shadow.blob_alpha), opacity: seg(f, 4, 24, 'fade') * (w.scale > 1.2 ? 0 : 1)}} />

			<div style={{position: 'absolute', left: 0, top: CY - H / 2 + w.bob + w.shift, width: W, height: H}}>
				<ThreeCanvas width={W} height={H} orthographic flat linear legacy shadows camera={{position: ISO.camera.position as V3, zoom: Z, near: ISO.camera.near, far: ISO.camera.far}} gl={{antialias: true, alpha: true}}>
					<Diorama c={c} f={f} />
				</ThreeCanvas>
			</div>

			{/* title block */}
			<div style={{...abs(BOXES.kicker), ...fontCss(pair.mono, 34), ...text, whiteSpace: 'nowrap', opacity: titleIn(0)}}>DIORAMA 01 / SUPPLY CHAIN</div>
			<div style={{...abs(BOXES.title), ...fontCss(pair.display, 104), ...text}}>
				{['ONE BLOCK,', 'THREE JOBS'].map((line, n) => (
					<div key={line} style={{whiteSpace: 'nowrap', opacity: titleIn(n + 1), transform: `translateY(${(1 - titleIn(n + 1)) * 36}px)`}}>
						{line}
					</div>
				))}
			</div>
			<div style={{position: 'absolute', left: (BOXES.title.x / 100) * W, top: ((BOXES.title.y + BOXES.title.h) / 100) * H + 8, width: T.title_bar.w * titleIn(3), height: T.title_bar.h, background: c.primary, borderRadius: T.title_bar.h / 2}} />

			{/* numbered badges ride over the pin heads; plates sit in a fixed row */}
			{PINS.map((p, n) => {
				const at = badgeAt(n, f);
				const k = sp(f, p.start + 8, 'plate');
				const lead = (BADGE_LIFT - BADGE / 2 - 22) * Math.min(1, k);
				return (
					<React.Fragment key={`b${n}`}>
						<div style={{position: 'absolute', left: at.x - T.leader.width / 2, top: at.y + BADGE / 2 - 2, width: T.leader.width, height: Math.max(0, lead), background: c.ink, borderRadius: 2}} />
						<div style={{position: 'absolute', left: at.x - BADGE / 2, top: at.y - BADGE / 2, transform: `scale(${k})`, ...chip}}>{p.n}</div>
					</React.Fragment>
				);
			})}
			{PINS.map((p, n) => {
				const box = [BOXES.p1, BOXES.p2, BOXES.p3][n];
				const k = sp(f, p.start + 10, 'plate');
				return (
					<div key={`p${n}`} style={{...abs(box), ...plate, transform: `translateY(${(1 - k) * 40}px) scale(${0.6 + 0.4 * k})`, opacity: Math.min(1, k * 1.6), display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: T.card.pad, paddingTop: 14}}>
						<div style={{position: 'absolute', left: T.card.pad - 6, top: -BADGE / 2, ...chip}}>{p.n}</div>
						<div style={{...fontCss(pair.accent, 60), ...text, whiteSpace: 'nowrap'}}>{p.word}</div>
						<div style={{...fontCss(pair.mono, 34), ...text, whiteSpace: 'nowrap', marginTop: 4}}>{p.sub}</div>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

export const Preview: React.FC<PreviewProps> = ({palette = 'harbour-town', pairing = 'fredoka-nunito-dmmono'}) => {
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	return (
		<FontGate fonts={{...pair, name: pair.id}}>
			<Scene palette={palette} pairing={pairing} />
		</FontGate>
	);
};

/** Three beats side by side: tiles and buildings popping in close, the pull-back with pin 1, the final frame. */
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
