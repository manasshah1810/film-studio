import React from 'react';
import {AbsoluteFill, Easing, Freeze, interpolate, spring, useCurrentFrame} from 'remotion';
import ds from '../../../styles/2-5d-parallax-depth/design-system.json';
import {FontGate} from '../../engine/fonts';
import {fontCss} from '../../engine/tokens';
import type {Pairing} from '../../engine/types';

/**
 * 2-5d-parallax-depth specimen: one 6 s scene, 1080 x 1920 at 30 fps. Mode B, a layered Story Actor.
 * Four planes in real CSS perspective (Z0 backdrop, Z1 midground tower and town, Z2 the courier actor, Z3 a soft
 * foreground frame). One continuous Z-push, a directional whip pan to the tower, a rack focus to the tower and
 * a rack focus back to the actor. The actor has three states (idle, react, act). Text sits on opaque plates only.
 */
export type PreviewProps = {palette?: string; pairing?: string};
export const PREVIEW_FRAMES = 180;
export const SHEET_FRAMES = [30, 118, 172];
const W = 1080;
const H = 1920;
const FPS = 30;
const PZ = ds.camera.perspective;
const PUSH = ds.camera.push_px;
const SPR = ds.motion.springs;
const PL = Object.fromEntries(ds.depth_planes.map((p) => [p.id, p])) as Record<string, (typeof ds.depth_planes)[number]>;
const PLANE_W = ds.tokens.plane.bleed.w;
const PLANE_H = ds.tokens.plane.bleed.h;

/** Text boxes in percent of the frame. Mirrored 1:1 by the storyboard that check-safezones reads. */
export const BOXES = {
	title: {x: 8, y: 8, w: 62, h: 12},
	push: {x: 8, y: 22.5, w: 30, h: 3.8},
	focus: {x: 40, y: 22.5, w: 30, h: 3.8},
	z0: {x: 8, y: 72, w: 18.5, h: 8},
	z1: {x: 27.5, y: 72, w: 18.5, h: 8},
	z2: {x: 47, y: 72, w: 18.5, h: 8},
	z3: {x: 66.5, y: 72, w: 18.5, h: 8},
};
const px = (b: {x: number; y: number; w: number; h: number}) => ({left: (b.x / 100) * W, top: (b.y / 100) * H, width: (b.w / 100) * W, height: (b.h / 100) * H});

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (n: keyof typeof ds.motion.easings) => Easing.bezier(...(ds.motion.easings[n] as [number, number, number, number]));
const smooth = (u: number) => {
	const t = Math.min(1, Math.max(0, u));
	return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sp = (f: number, cfg: {damping: number; stiffness: number; mass: number}) => spring({frame: f, fps: FPS, config: cfg});
const hexA = (h: string, a: number) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
const blend = (a: string, b: string, t: number) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * t + parseInt(b.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('');
type Roles = Record<string, string>;

/** Camera. cz is the Z-push in px. cx is the lateral camera: a slow drift, a whip pan to the tower, a settle, a pan back. */
const WHIP = [90, 100];
const BACK = [136, 160];
const cz = (f: number) => PUSH * ease('push')(Math.min(1, f / PREVIEW_FRAMES));
const cx = (f: number) => {
	if (f < WHIP[0]) return lerp(-40, 0, ease('push')(f / WHIP[0]));
	const whip = interpolate(f, WHIP, [0, 260], {...clamp, easing: ease('whip')});
	const settled = f < WHIP[1] ? whip : 260 - 60 * sp(f - WHIP[1], SPR.settle);
	const back = interpolate(f, BACK, [0, 1], {...clamp, easing: ease('rack')});
	return f < BACK[0] ? settled : lerp(260 - 60 * sp(f - WHIP[1], SPR.settle), 40, back);
};
/** Focus weight on Z1: 0 means the actor plane is sharp, 1 means the tower plane is sharp. */
const focusW = (f: number) => interpolate(f, [96, 120], [0, 1], {...clamp, easing: ease('rack')}) - interpolate(f, [140, 164], [0, 1], {...clamp, easing: ease('rack')});
const BLUR_A: Record<string, number> = {Z3: 7, Z2: 0, Z1: 2, Z0: 3};
const BLUR_B: Record<string, number> = {Z3: 8, Z2: 4, Z1: 0, Z0: 4};
const blurOf = (id: string, f: number) => lerp(BLUR_A[id], BLUR_B[id], focusW(f));

const ORDER = ['Z0', 'Z1', 'Z2', 'Z3'];
const par = (id: string) => PZ / (PZ - PL[id].z);

/** The actor's three states, as 0 to 1 weights. react looks at the tower; act raises the lantern. */
const actorAt = (f: number) => {
	const act = smooth((f - 138) / 26);
	const react = smooth((f - 58) / 26) * (1 - act);
	return {act, react};
};

const limb = (a: {x: number; y: number}, b: {x: number; y: number}, wa: number, wb: number) => {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const l = Math.hypot(dx, dy) || 1;
	const nx = -dy / l;
	const ny = dx / l;
	return `${a.x + (nx * wa) / 2},${a.y + (ny * wa) / 2} ${b.x + (nx * wb) / 2},${b.y + (ny * wb) / 2} ${b.x - (nx * wb) / 2},${b.y - (ny * wb) / 2} ${a.x - (nx * wa) / 2},${a.y - (ny * wa) / 2}`;
};
const arm = (ox: number, oy: number, a1: number, a2: number) => {
	const r1 = (a1 * Math.PI) / 180;
	const r2 = ((a1 + a2) * Math.PI) / 180;
	const e = {x: ox + Math.sin(r1) * 130, y: oy + Math.cos(r1) * 130};
	const h = {x: e.x + Math.sin(r2) * 120, y: e.y + Math.cos(r2) * 120};
	return {s: {x: ox, y: oy}, e, h};
};

const Scene: React.FC<{palette: string; pairing: string}> = ({palette, pairing}) => {
	const f = useCurrentFrame();
	const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
	const pal = ds.palettes.find((p) => p.id === palette) ?? ds.palettes[0];
	const c = pal.roles as Roles;
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	const tnum: React.CSSProperties = {fontVariantNumeric: 'tabular-nums'};

	// atmosphere: far planes lean to the haze colour, near planes lean to bg darkened
	const sky = c.sky ?? c.bg;
	const haze = c.haze ?? blend(c.primary, c.bg, 0.32);
	const hills = blend(haze, sky, 0.5);
	const mid = c.mid ?? blend(c.surface, c.bg, 0.62);
	const fore = c.fore ?? blend('#000000', c.bg, 0.6);
	const coat = c.coat ?? c.primary;
	const coatShade = blend(c.bg, coat, 0.4);
	const trousers = blend(c.bg, coat, 0.55);
	const skin = blend(c.ink, c.highlight, 0.7);
	const pier = blend(c.surface, c.bg, 0.55);

	const z = cz(f);
	const x = cx(f);
	const speed = Math.abs(cx(f) - cx(f - 1));
	const whipPx = Math.min(ds.tokens.whip.blur_px, speed * 0.4);
	const lamp = smooth((f - 98) / 14);
	const flick = 1 + Math.sin(f * 0.9) * 0.04;
	const { act, react } = actorAt(f);
	const glowAmt = Math.min(1, 0.55 + 0.45 * react + 0.45 * act);

	const planeStyle = (id: string): React.CSSProperties => {
		const p = PL[id];
		const comp = (PZ - p.z) / PZ;
		return {
			position: 'absolute',
			left: W / 2 - PLANE_W / 2,
			top: H / 2 - PLANE_H / 2,
			width: PLANE_W,
			height: PLANE_H,
			transform: `translate3d(${-x}px, 0px, ${p.z + z}px) scale(${comp})`,
		};
	};
	const svgStyle = (id: string): React.CSSProperties => {
		const b = blurOf(id, f);
		const wb = whipPx * par(id);
		const parts = [wb > 0.5 ? `url(#whip${id}${uid})` : '', b > 0.05 ? `blur(${b.toFixed(2)}px)` : ''].filter(Boolean);
		return {display: 'block', filter: parts.length ? parts.join(' ') : undefined};
	};
	const VB = `${-(PLANE_W - W) / 2} ${-(PLANE_H - H) / 2} ${PLANE_W} ${PLANE_H}`;
	const L = -(PLANE_W - W) / 2; // left bleed edge in screen coordinates
	const Rt = W - L;
	const wf = (id: string) => (
		<filter id={`whip${id}${uid}`} x="-5%" y="0%" width="110%" height="100%">
			<feGaussianBlur stdDeviation={`${(whipPx * par(id)).toFixed(2)} 0`} />
		</filter>
	);

	/* ---------------- Z0: sky, moon, far hills, sea ---------------- */
	const stars = Array.from({length: 34}, (_, i) => ({x: ((i * 397) % 1700) - 300, y: ((i * 211) % 820) - 60, r: 1.4 + (i % 3) * 0.7, t: 0.35 + 0.65 * Math.abs(Math.sin(f / 22 + i))}));
	const HY = 1180;
	const Z0 = (
		<svg width={PLANE_W} height={PLANE_H} viewBox={VB} style={svgStyle('Z0')}>
			<defs>
				{wf('Z0')}
				<linearGradient id={`sky${uid}`} x1="0" y1="-140" x2="0" y2={HY} gradientUnits="userSpaceOnUse">
					<stop offset="0" stopColor={sky} />
					<stop offset="1" stopColor={haze} />
				</linearGradient>
				<linearGradient id={`sea${uid}`} x1="0" y1={HY} x2="0" y2="2060" gradientUnits="userSpaceOnUse">
					<stop offset="0" stopColor={blend(haze, c.bg, 0.8)} />
					<stop offset="1" stopColor={c.bg} />
				</linearGradient>
				<radialGradient id={`moon${uid}`}>
					<stop offset="0" stopColor={hexA(c.ink, 0.38)} />
					<stop offset="1" stopColor={hexA(c.ink, 0)} />
				</radialGradient>
			</defs>
			<rect x={L} y={-140} width={PLANE_W} height={HY + 140} fill={`url(#sky${uid})`} />
			{stars.map((s, i) => (
				<circle key={i} cx={s.x} cy={s.y} r={s.r} fill={c.ink} opacity={s.t * 0.7} />
			))}
			<circle cx={830} cy={640} r={260} fill={`url(#moon${uid})`} />
			<circle cx={830} cy={640} r={104} fill={blend(c.ink, haze, 0.85)} />
			<circle cx={868} cy={618} r={104} fill={hexA(sky, 0.18)} />
			{[0, 1].map((k) => (
				<ellipse key={k} cx={200 + k * 760 + f * 0.35} cy={420 + k * 190} rx={330} ry={26} fill={hexA(c.ink, 0.07)} />
			))}
			<path d={`M${L} ${HY} L${L} 1040 Q-120 1000 20 1042 T330 1020 T620 1050 T900 1010 T1180 1044 T${Rt} 1020 L${Rt} ${HY} Z`} fill={hills} />
			<rect x={L} y={HY} width={PLANE_W} height={900} fill={`url(#sea${uid})`} />
			<rect x={800} y={HY} width={60} height={560} fill={hexA(c.ink, 0.07)} />
		</svg>
	);

	/* ---------------- Z1: town, tower, lamp posts ---------------- */
	const houses = [
		{x: -410, w: 190, h: 300}, {x: -220, w: 150, h: 380}, {x: -70, w: 170, h: 250}, {x: 100, w: 140, h: 330}, {x: 240, w: 180, h: 240},
		{x: 1010, w: 150, h: 310}, {x: 1160, w: 190, h: 400}, {x: 1350, w: 140, h: 260},
	];
	const Z1 = (
		<svg width={PLANE_W} height={PLANE_H} viewBox={VB} style={svgStyle('Z1')}>
			<defs>
				{wf('Z1')}
				<radialGradient id={`lamp${uid}`}>
					<stop offset="0" stopColor={hexA(c.highlight, 0.85)} />
					<stop offset="1" stopColor={hexA(c.highlight, 0)} />
				</radialGradient>
				<linearGradient id={`beam${uid}`} x1="1" y1="0" x2="0" y2="0">
					<stop offset="0" stopColor={hexA(c.highlight, 0.5)} />
					<stop offset="1" stopColor={hexA(c.highlight, 0)} />
				</linearGradient>
			</defs>
			<rect x={L} y={1170} width={PLANE_W} height={140} fill={mid} />
			{houses.map((h, i) => (
				<g key={i}>
					<path d={`M${h.x} 1180 V${1180 - h.h} L${h.x + h.w / 2} ${1180 - h.h - 50} L${h.x + h.w} ${1180 - h.h} V1180 Z`} fill={mid} />
					{[0, 1, 2].map((r) => (
						<rect key={r} x={h.x + 30 + (r % 2) * 56} y={1180 - h.h + 50 + r * 70} width={26} height={34} rx={4} fill={c.highlight} opacity={(i + r) % 3 === 0 ? 0.85 : 0.0} />
					))}
				</g>
			))}
			{[360, 1000].map((px0) => (
				<g key={px0}>
					<rect x={px0 - 5} y={1010} width={10} height={170} fill={mid} />
					<circle cx={px0} cy={1000} r={46} fill={`url(#lamp${uid})`} opacity={0.55} />
					<circle cx={px0} cy={1000} r={11} fill={c.highlight} />
				</g>
			))}
			{/* tower: tapered shaft, gallery, lamp room, roof; the beam is the story beat */}
			<polygon points="740,1180 860,1180 836,820 764,820" fill={mid} />
			<rect x={744} y={806} width={112} height={16} fill={mid} />
			<rect x={766} y={736} width={68} height={70} fill={mid} />
			<polygon points="758,736 842,736 800,684" fill={mid} />
			<rect x={778} y={750} width={44} height={44} fill={c.highlight} opacity={0.18 + 0.82 * lamp} />
			<circle cx={800} cy={772} r={150 * lamp * flick} fill={`url(#lamp${uid})`} opacity={0.75 * lamp} />
			<polygon points={`800,772 ${L + 200},${640} ${L + 200},${930}`} fill={`url(#beam${uid})`} opacity={lamp * flick} />
		</svg>
	);

	/* ---------------- Z2: pier and the Story Actor ---------------- */
	const HX = 540;
	const HYF = 1340;
	const bob = Math.sin(f / 13) * 3;
	const lean = -act * 3;
	const blink = Math.max(0, 1 - Math.abs(f - 41) / 3, 1 - Math.abs(f - 152) / 3);
	const lookX = 14 * react + 8 * act;
	const faceUp = -6 * act;
	const sw = Math.sin(f / 8) * 5 * (1 - act);
	const step = act * 30;
	const fa = arm(78, -452, lerp(lerp(8, 56, react), 128, act), lerp(lerp(6, 34, react), 14, act));
	const ba = arm(-78, -452, lerp(-8, -14, react) - 17 * act, 8);
	const sc = (t: number) => ({x: lerp(-40, -250, t), y: -470 + 60 * t + Math.sin(f / 5 - t * 6) * 16 * t});
	const scarfPts = [0, 0.2, 0.4, 0.6, 0.8, 1].map(sc);
	const scarfTop = scarfPts.map((p, i) => `${p.x},${p.y - lerp(22, 8, i / 5)}`).join(' ');
	const scarfBot = [...scarfPts].reverse().map((p, i) => `${p.x},${p.y + lerp(8, 22, i / 5)}`).join(' ');
	const lan = {x: fa.h.x, y: fa.h.y};
	const glowR = 110 + 150 * glowAmt;
	const Z2 = (
		<svg width={PLANE_W} height={PLANE_H} viewBox={VB} style={svgStyle('Z2')}>
			<defs>
				{wf('Z2')}
				<radialGradient id={`glow${uid}`}>
					<stop offset="0" stopColor={hexA(c.highlight, 0.7)} />
					<stop offset="0.5" stopColor={hexA(c.highlight, 0.22)} />
					<stop offset="1" stopColor={hexA(c.highlight, 0)} />
				</radialGradient>
			</defs>
			<rect x={L} y={HYF - 8} width={PLANE_W} height={900} fill={pier} />
			<rect x={L} y={HYF - 8} width={PLANE_W} height={6} fill={hexA(c.ink, 0.16)} />
			{Array.from({length: 24}, (_, i) => (
				<rect key={i} x={L + i * 82} y={HYF + 2 + (i % 2) * 6} width={4} height={900} fill={hexA(c.bg, 0.5)} />
			))}
			{[0, 1, 2, 3].map((r) => (
				<rect key={r} x={L} y={HYF + 36 + r * 62} width={PLANE_W} height={3} fill={hexA(c.bg, 0.5)} />
			))}
			<ellipse cx={HX + 90 + lan.x * 0.3} cy={HYF + 54} rx={260 * glowAmt} ry={34 * glowAmt} fill={hexA(c.highlight, 0.3 * glowAmt)} />
			<g transform={`translate(${HX} ${HYF})`}>
				<ellipse cx={0} cy={8} rx={128} ry={16} fill="#000" opacity={0.42} />
				<g transform={`rotate(${lean})`}>
					{/* layer: back arm */}
					<g>
						<polygon points={limb(ba.s, ba.e, 40, 32)} fill={coatShade} />
						<polygon points={limb(ba.e, ba.h, 32, 26)} fill={coatShade} />
						<circle cx={ba.h.x} cy={ba.h.y} r={17} fill={skin} />
					</g>
					{/* layer: legs and boots */}
					<polygon points={limb({x: -34, y: -200}, {x: -44 - step * 0.6, y: -26}, 56, 42)} fill={trousers} />
					<polygon points={limb({x: 36, y: -200}, {x: 46 + step, y: -26}, 56, 42)} fill={trousers} />
					<rect x={-82 - step * 0.6} y={-30} width={84} height={30} rx={13} fill={blend(c.bg, coat, 0.8)} />
					<rect x={8 + step} y={-30} width={84} height={30} rx={13} fill={blend(c.bg, coat, 0.8)} />
					<g transform={`translate(0 ${bob})`}>
						{/* layer: coat with a shade half and a lantern rim */}
						<path d="M-90 -462 Q-98 -300 -112 -168 L112 -168 Q98 -300 90 -462 Q42 -494 0 -488 Q-42 -494 -90 -462 Z" fill={coat} />
						<path d="M-90 -462 Q-98 -300 -112 -168 L-8 -168 Q-4 -330 -8 -488 Q-42 -494 -90 -462 Z" fill={coatShade} opacity={0.55} />
						<path d="M90 -462 Q98 -300 112 -168" fill="none" stroke={c.highlight} strokeWidth={6} opacity={0.5 * glowAmt} />
						<rect x={-112} y={-182} width={224} height={14} fill={hexA(c.bg, 0.45)} />
						{/* layer: scarf */}
						<ellipse cx={0} cy={-476} rx={64} ry={22} fill={c.highlight} />
						<polygon points={`${scarfTop} ${scarfBot}`} fill={c.highlight} />
						<polygon points={`${scarfTop} ${scarfBot}`} fill={hexA(c.bg, 0.18)} />
						{/* layer: head, cap and face */}
						<g transform={`translate(0 ${-546}) rotate(${faceUp + react * 3})`}>
							<rect x={-20} y={30} width={40} height={30} fill={blend(skin, c.bg, 0.8)} />
							<circle cx={0} cy={0} r={55} fill={skin} />
							<path d="M-3 -52 A55 55 0 0 1 3 52 Q-30 20 -3 -52 Z" fill={blend(c.bg, skin, 0.3)} opacity={0.55} transform="translate(-30 0)" />
							<path d="M-60 -6 Q-62 -78 0 -84 Q64 -78 60 -6 L60 -8 L-60 -8 Z" fill={blend(c.bg, coat, 0.45)} />
							<rect x={-6} y={-12} width={96} height={14} rx={7} fill={blend(c.bg, coat, 0.45)} />
							<g transform={`translate(${lookX} 0)`}>
								<ellipse cx={14} cy={12} rx={5} ry={Math.max(0.6, 6 * (1 - blink))} fill={c.bg} />
								<ellipse cx={38} cy={12} rx={5} ry={Math.max(0.6, 6 * (1 - blink))} fill={c.bg} />
								<rect x={9} y={-2 - react * 4} width={14} height={3} rx={1.5} fill={c.bg} opacity={0.8} />
								<rect x={32} y={-2 - react * 4} width={14} height={3} rx={1.5} fill={c.bg} opacity={0.8} />
								<polygon points="52,16 62,30 50,32" fill={blend(c.bg, skin, 0.25)} />
							</g>
						</g>
						{/* layer: front arm and lantern */}
						<polygon points={limb(fa.s, fa.e, 42, 34)} fill={coat} />
						<polygon points={limb(fa.e, fa.h, 34, 28)} fill={coat} />
						<circle cx={fa.e.x} cy={fa.e.y} r={17} fill={coat} />
						<circle cx={fa.h.x} cy={fa.h.y} r={18} fill={skin} />
					</g>
					<g transform={`translate(${lan.x} ${lan.y + bob}) rotate(${sw})`}>
						<circle cx={0} cy={58} r={glowR} fill={`url(#glow${uid})`} />
						<path d="M-14 6 Q0 -30 14 6" fill="none" stroke={c.ink} strokeWidth={4} opacity={0.8} />
						<rect x={-24} y={6} width={48} height={72} rx={8} fill={c.highlight} />
						<rect x={-24} y={6} width={48} height={8} fill={c.bg} opacity={0.6} />
						<rect x={-24} y={70} width={48} height={8} fill={c.bg} opacity={0.6} />
						<rect x={-9} y={20} width={18} height={44} rx={9} fill={c.ink} opacity={0.9} />
					</g>
				</g>
			</g>
		</svg>
	);

	/* ---------------- Z3: soft foreground frame ---------------- */
	const blades = Array.from({length: 40}, (_, i) => {
		const bx = L + 20 + i * 52 + ((i * 37) % 22);
		const h = 150 + ((i * 53) % 150);
		const sway = Math.sin(f / 16 + i * 0.8) * 16;
		return `M${bx} 2060 Q${bx + sway * 0.4} ${2060 - h * 0.6} ${bx + 18 + sway} ${2060 - h} Q${bx + 14 + sway * 0.4} ${2060 - h * 0.55} ${bx + 20} 2060 Z`;
	});
	const Z3 = (
		<svg width={PLANE_W} height={PLANE_H} viewBox={VB} style={svgStyle('Z3')}>
			<defs>{wf('Z3')}</defs>
			<rect x={L} y={1980} width={PLANE_W} height={80} fill={fore} />
			{blades.map((d, i) => (
				<path key={i} d={d} fill={fore} />
			))}
			{[40, 1040].map((bx) => (
				<g key={bx}>
					<rect x={bx - 52} y={1280} width={104} height={720} rx={20} fill={fore} />
					<rect x={bx - 70} y={1256} width={140} height={46} rx={20} fill={fore} />
					<path d={`M${bx + (bx < 0 ? 52 : -52)} 1380 Q${bx + (bx < 0 ? 260 : -260)} 1470 ${bx + (bx < 0 ? 520 : -520)} 1420`} fill="none" stroke={fore} strokeWidth={14} />
				</g>
			))}
			<path d="M1100 -140 Q1000 -60 800 90 Q700 130 640 120 Q760 40 880 -20 Q960 -90 960 -140 Z" fill={fore} />
			{[[820, 80, 54, 26, -30], [900, 20, 50, 24, -50], [720, 112, 46, 22, -10], [980, -30, 44, 22, -70]].map(([lx, ly, rx, ry, ro], i) => (
				<ellipse key={i} cx={lx} cy={ly + Math.sin(f / 18 + i) * 4} rx={rx} ry={ry} transform={`rotate(${ro} ${lx} ${ly})`} fill={fore} />
			))}
		</svg>
	);

	// legend (what each plane does right now)
	const planes = ['Z0', 'Z1', 'Z2', 'Z3'];
	const names: Record<string, string> = {Z0: 'BACK', Z1: 'MID', Z2: 'HERO', Z3: 'FRAME'};
	const tints: Record<string, string> = {Z0: haze, Z1: mid, Z2: coat, Z3: fore};
	const w1 = focusW(f);
	const label: React.CSSProperties = {...fontCss(pair.mono, 34), color: c.ink, whiteSpace: 'nowrap', lineHeight: 1.1, ...tnum};
	const inA = (s: number) => interpolate(f, [s, s + 10], [0, 1], {...clamp, easing: ease('settle')});
	const BX = BOXES as Record<string, {x: number; y: number; w: number; h: number}>;

	return (
		<AbsoluteFill style={{background: c.bg, overflow: 'hidden'}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, perspective: PZ, perspectiveOrigin: '50% 55%', overflow: 'hidden'}}>
				{ORDER.map((id) => (
					<div key={id} style={planeStyle(id)}>
						{id === 'Z0' ? Z0 : id === 'Z1' ? Z1 : id === 'Z2' ? Z2 : Z3}
					</div>
				))}
			</div>
			<div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, background: `radial-gradient(ellipse at 50% 52%, ${hexA(c.bg, 0)} 52%, ${hexA(c.bg, ds.tokens.vignette.alpha)} 100%)`}} />

			<div style={{position: 'absolute', ...px(BOXES.title), boxSizing: 'border-box', background: c.surface, border: `${ds.tokens.card.border.width}px solid ${hexA(c.ink, 0.3)}`, borderRadius: ds.tokens.card.radius, padding: '10px 28px', ...fontCss(pair.display, 108), color: c.ink, opacity: inA(2), transform: `translateY(${(1 - inA(2)) * 30}px)`}}>
				<div>Four planes.</div>
				<div style={{color: c.primary}}>One push.</div>
			</div>
			<div style={{position: 'absolute', ...px(BOXES.push), boxSizing: 'border-box', background: c.surface, border: `2px solid ${hexA(c.ink, 0.3)}`, borderRadius: 14, padding: '0 16px', display: 'flex', alignItems: 'center', ...label, opacity: inA(6)}}>
				PUSH {String(Math.round(z)).padStart(3, '0')} PX
			</div>
			<div style={{position: 'absolute', ...px(BOXES.focus), boxSizing: 'border-box', background: c.surface, border: `2px solid ${hexA(c.primary, 0.8)}`, borderRadius: 14, padding: '0 16px', display: 'flex', alignItems: 'center', ...label, opacity: inA(8)}}>
				FOCUS {w1 > 0.5 ? 'Z1 MID' : 'Z2 HERO'}
			</div>
			{planes.map((id, i) => {
				const foc = (id === 'Z2' && w1 < 0.5) || (id === 'Z1' && w1 >= 0.5);
				const b = BX[id.toLowerCase()];
				const a = inA(10 + i * 4);
				return (
					<div key={id} style={{position: 'absolute', ...px(b), boxSizing: 'border-box', background: c.surface, border: `3px solid ${foc ? c.primary : hexA(c.ink, 0.25)}`, borderRadius: 14, padding: '6px 12px 6px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: a, transform: `translateY(${(1 - a) * 24}px)`}}>
						<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: tints[id], borderRadius: '11px 0 0 11px'}} />
						<div style={label}>{id} {names[id]}</div>
						<div style={{...label, color: foc ? c.primary : c.ink}}>{par(id).toFixed(2)}X B{Math.round(blurOf(id, f))}</div>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

export const Preview: React.FC<PreviewProps> = ({palette = 'dusk-harbour', pairing = 'anton-dmsans-dmserif'}) => {
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	return (
		<FontGate fonts={{...pair, name: pair.id}}>
			<Scene palette={palette} pairing={pairing} />
		</FontGate>
	);
};

/** Three beats side by side: the actor in focus, the whip pan and rack focus to the tower, the rack back and the act. */
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
export const SHEET_SIZE = {width: W * SHEET_FRAMES.length, height: H};
