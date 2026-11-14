import React from 'react';
import {AbsoluteFill, Easing, Freeze, interpolate, spring, useCurrentFrame} from 'remotion';
import ds from '../../../styles/scifi-hud/design-system.json';
import {FontGate} from '../../engine/fonts';
import {fontCss} from '../../engine/tokens';
import type {Pairing} from '../../engine/types';

/**
 * scifi-hud specimen: one 6 s scene, 1080 x 1920 at 30 fps. Mode C, UI and data first.
 * A six ring targeting reticle (tick rings, segmented arcs, a gauge, fine dashes, a lens), corner registration
 * brackets, a lock box that shrinks onto a wire target, live signal bars, scanlines and four telemetry readouts that
 * scramble and decode. A short RGB chromatic glitch marks the lock. Text sits on opaque plates only.
 */
export type PreviewProps = {palette?: string; pairing?: string};
export const PREVIEW_FRAMES = 180;
export const SHEET_FRAMES = [40, 100, 150];
const W = 1080;
const H = 1920;
const FPS = 30;
const CX = 540;
const CY = 800;
const LOCK_F = 96;
const GLITCH = [LOCK_F, LOCK_F + ds.tokens.glitch.frames];
export const SHEET_SIZE = {width: W * SHEET_FRAMES.length, height: H};

/** Text boxes in percent of the frame. Mirrored 1:1 by the storyboard that check-safezones reads. */
export const BOXES = {
	title: {x: 8, y: 8, w: 62, h: 9.5},
	state: {x: 8, y: 19, w: 36, h: 3.8},
	clock: {x: 47, y: 19, w: 38, h: 3.8},
	r1: {x: 8, y: 66, w: 37, h: 6.6},
	r2: {x: 48, y: 66, w: 37, h: 6.6},
	r3: {x: 8, y: 73.2, w: 37, h: 6.6},
	r4: {x: 48, y: 73.2, w: 37, h: 6.6},
};
const WAVE = {x: 8, y: 60, w: 77, h: 5};
const px = (b: {x: number; y: number; w: number; h: number}) => ({left: (b.x / 100) * W, top: (b.y / 100) * H, width: (b.w / 100) * W, height: (b.h / 100) * H});

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (n: keyof typeof ds.motion.easings) => Easing.bezier(...(ds.motion.easings[n] as [number, number, number, number]));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (u: number) => {
	const t = Math.min(1, Math.max(0, u));
	return t * t * (3 - 2 * t);
};
const hexA = (h: string, a: number) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
const blend = (a: string, b: string, t: number) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * t + parseInt(b.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('');
type Roles = Record<string, string>;

/** Focused palettes have 5 roles; the rest are derived. Expanded palettes carry all 10. */
const rolesOf = (id: string): Roles => {
	const p = ds.palettes.find((x) => x.id === id) ?? ds.palettes[0];
	const r: Roles = {...(p.roles as Roles)};
	if (!r.dim) {
		r.dim = blend(r.ink, r.bg, 0.66);
		r.alert = r.highlight;
		r.ok = r.primary;
		r.grid = blend(r.primary, r.bg, 0.14);
		r.glow = r.primary;
	}
	return r;
};

/** Ring geometry: N dashes that fit the circumference exactly, with a gap fraction. */
const ringDash = (r: number, n: number, gap: number) => {
	const seg = (2 * Math.PI * r) / n;
	return `${seg * (1 - gap)} ${seg * gap}`;
};
const tickDash = (r: number, n: number, tick: number) => `${tick} ${(2 * Math.PI * r) / n - tick}`;

/** Text scramble decode: locked characters from the left, random glyphs from a fixed charset on the right. */
const CHARS = ds.hud.readout.scramble.charset;
const rnd = (n: number) => {
	const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return s - Math.floor(s);
};
const scramble = (live: string, f: number, start: number, dur: number, seed: number) => {
	const p = (f - start) / dur;
	if (p < 0) return live.replace(/./g, ' ');
	return live
		.split('')
		.map((ch, i) => {
			if (ch === ' ' || p * live.length >= i + 1) return ch;
			return CHARS[Math.floor(rnd(Math.floor(f / 2) * 31 + i * 7 + seed) * CHARS.length)];
		})
		.join('');
};

/** Live telemetry strings. Fixed length so the plate never reflows while the value ticks. */
const READ = [
	{label: 'ALT', val: (f: number) => (12000 + Math.round(f * 6.4)).toLocaleString('en-US') + ' M'},
	{label: 'VEL', val: (f: number) => (3 + f * 0.0012).toFixed(2) + ' KM/S'},
	{label: 'HDG', val: (f: number) => (270 + f * 0.05).toFixed(1) + ' DEG'},
	{label: 'LINK', val: (f: number) => Math.min(98.6, 40 + f * 0.6).toFixed(1) + ' %'},
];
const stateAt = (f: number) => (f < 56 ? {s: 'ACQUIRE ', t: 6} : f < LOCK_F ? {s: 'TRACKING', t: 56} : {s: 'LOCKED  ', t: LOCK_F});
const clockStr = (f: number) => {
	const t = f / FPS;
	return `T+ 00:${String(Math.floor(t)).padStart(2, '0')}.${Math.floor((t % 1) * 10)}`;
};

/** Target position: a small lissajous so the lock box has something to chase. */
const tgt = (f: number) => ({x: 38 * Math.sin(f * 0.05), y: 24 * Math.sin(f * 0.07 + 1)});

const drawIn = (f: number, start: number, dur: number) => interpolate(f, [start, start + dur], [0, 1], {...clamp, easing: ease('draw')});

const Corner: React.FC<{x: number; y: number; sx: number; sy: number; arm: number; p: number; stroke: string; w: number}> = ({x, y, sx, sy, arm, p, stroke, w}) => (
	<path d={`M ${x} ${y + sy * arm} L ${x} ${y} L ${x + sx * arm} ${y}`} fill="none" stroke={stroke} strokeWidth={w} strokeLinecap="square" strokeDasharray={arm * 2} strokeDashoffset={(1 - p) * arm * 2} />
);

/** The reticle. `mono` paints every stroke one colour, used for the glitch ghosts. */
const Reticle: React.FC<{f: number; c: Roles; mono?: string}> = ({f, c, mono}) => {
	const col = (k: string) => mono ?? c[k];
	const ring = (i: number) => {
		const p = drawIn(f, 6 + i * 6, 14);
		return {opacity: p, transform: `scale(${1.1 - 0.1 * p})`, transformOrigin: `${CX}px ${CY}px`} as React.CSSProperties;
	};
	const R = ds.hud.rings;
	const g = (id: string) => R.find((x) => x.id === id)!;
	const lockW = spring({frame: f - 62, fps: FPS, config: ds.motion.springs.lock});
	const box = lerp(640, 250, Math.min(1.08, Math.max(0, lockW)));
	const t = tgt(f);
	const follow = tgt(f - 5);
	const bx = CX + follow.x * lockW;
	const by = CY + follow.y * lockW;
	const locked = f >= LOCK_F;
	const boxCol = locked ? col('highlight') : col('primary');
	const orbit = (f * 2.2 * Math.PI) / 180;
	const gauge = smooth((f - 40) / 60) * 0.986;
	const g262 = 2 * Math.PI * 262;
	const wing = Math.max(0.22, Math.abs(Math.cos(f * 0.04)));
	const arm = 62;
	const bl = box / 2;
	const k = 34;
	return (
		<g>
			<g style={ring(0)}>
				<g transform={`rotate(${-f * 0.15} ${CX} ${CY})`}>
					<circle cx={CX} cy={CY} r={330} fill="none" stroke={col('primary')} strokeOpacity={0.55} strokeWidth={12} strokeDasharray={tickDash(330, 120, 2.5)} />
					<circle cx={CX} cy={CY} r={330} fill="none" stroke={col('primary')} strokeWidth={24} strokeDasharray={tickDash(330, 24, 4)} />
				</g>
			</g>
			<g style={ring(1)}>
				<circle cx={CX} cy={CY} r={296} fill="none" stroke={col('primary')} strokeWidth={6} strokeDasharray={ringDash(296, 6, g('outer-arcs').gap!)} transform={`rotate(${f * 0.5} ${CX} ${CY})`} />
			</g>
			<g style={ring(2)}>
				<circle cx={CX} cy={CY} r={262} fill="none" stroke={col('grid')} strokeWidth={14} />
				<circle cx={CX} cy={CY} r={262} fill="none" stroke={col('ok')} strokeWidth={14} strokeDasharray={`${g262 * gauge} ${g262}`} transform={`rotate(-90 ${CX} ${CY})`} />
				<circle cx={CX + 262 * Math.cos(orbit)} cy={CY + 262 * Math.sin(orbit)} r={10} fill={col('highlight')} />
				<circle cx={CX} cy={CY} r={262} fill="none" stroke={col('highlight')} strokeWidth={4} strokeLinecap="round" strokeDasharray={`90 ${g262}`} transform={`rotate(${(orbit * 180) / Math.PI - 5.2} ${CX} ${CY})`} />
			</g>
			<g style={ring(3)}>
				<circle cx={CX} cy={CY} r={228} fill="none" stroke={col('primary')} strokeWidth={3} strokeDasharray={ringDash(228, 36, g('fine').gap!)} transform={`rotate(${-f * 0.9} ${CX} ${CY})`} />
			</g>
			<g style={ring(4)}>
				<circle cx={CX} cy={CY} r={190} fill="none" stroke={col('primary')} strokeWidth={2} strokeDasharray={ringDash(190, 4, g('inner-arcs').gap!)} transform={`rotate(${f * 1.6} ${CX} ${CY})`} />
			</g>
			<g style={ring(5)}>
				{!mono && <circle cx={CX} cy={CY} r={150} fill="url(#lens)" />}
				<circle cx={CX} cy={CY} r={150} fill="none" stroke={col('primary')} strokeOpacity={0.8} strokeWidth={2} />
				{[0, 90, 180, 270].map((a) => (
					<line key={a} x1={CX + 64 * Math.cos((a * Math.PI) / 180)} y1={CY + 64 * Math.sin((a * Math.PI) / 180)} x2={CX + 176 * Math.cos((a * Math.PI) / 180)} y2={CY + 176 * Math.sin((a * Math.PI) / 180)} stroke={col('primary')} strokeWidth={2} />
				))}
			</g>
			<g transform={`translate(${CX + t.x} ${CY + t.y})`} fill="none" stroke={col('ink')} strokeWidth={3} strokeLinejoin="round" style={{opacity: drawIn(f, 36, 16)}}>
				<polygon points={[0, 1, 2, 3, 4, 5].map((i) => `${k * Math.cos((i * Math.PI) / 3)},${k * Math.sin((i * Math.PI) / 3)}`).join(' ')} fill={hexA(c.bg, 0.7)} />
				<g transform={`scale(${wing} 1)`}>
					<rect x={k + 6} y={-20} width={70} height={40} />
					<rect x={-k - 76} y={-20} width={70} height={40} />
					<line x1={k + 29} y1={-20} x2={k + 29} y2={20} strokeWidth={2} />
					<line x1={k + 52} y1={-20} x2={k + 52} y2={20} strokeWidth={2} />
					<line x1={-k - 29} y1={-20} x2={-k - 29} y2={20} strokeWidth={2} />
					<line x1={-k - 52} y1={-20} x2={-k - 52} y2={20} strokeWidth={2} />
				</g>
				<line x1={0} y1={-k} x2={0} y2={-k - 34} />
				<circle cx={0} cy={-k - 40} r={6} fill={col('ink')} />
				<circle cx={0} cy={0} r={8} fill={col('alert')} stroke="none" />
			</g>
			<g style={{opacity: drawIn(f, 56, 10)}}>
				{locked && f < LOCK_F + 5 && <rect x={bx - bl} y={by - bl} width={box} height={box} fill={col('highlight')} fillOpacity={0.22} />}
				{[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => (
					<path key={`${sx}${sy}`} d={`M ${bx + sx * bl} ${by + sy * (bl - arm)} L ${bx + sx * bl} ${by + sy * bl} L ${bx + sx * (bl - arm)} ${by + sy * bl}`} fill="none" stroke={boxCol} strokeWidth={6} strokeLinecap="square" />
				))}
			</g>
		</g>
	);
};

const Scene: React.FC<{palette: string; pairing: string}> = ({palette, pairing}) => {
	const f = useCurrentFrame();
	const c = rolesOf(palette);
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	const B = ds.hud.brackets;
	const bp = drawIn(f, 0, 12);
	const inA = (start: number) => interpolate(f, [start, start + 10], [0, 1], {...clamp, easing: ease('fade')});
	const glitching = f >= GLITCH[0] && f < GLITCH[1];
	const gv = glitching ? 1 - (f - GLITCH[0]) / ds.tokens.glitch.frames : 0;
	const off = ds.tokens.glitch.offset_px * gv;
	const tnum: React.CSSProperties = {fontVariantNumeric: 'tabular-nums'};
	const label: React.CSSProperties = {...fontCss(pair.mono, 34), color: c.dim, whiteSpace: 'nowrap', lineHeight: 1.1, ...tnum};
	const plate: React.CSSProperties = {position: 'absolute', boxSizing: 'border-box', background: c.surface, border: `${ds.tokens.card.border.width}px solid ${hexA(c.primary, ds.tokens.card.border.alpha)}`, borderRadius: ds.tokens.plate.radius, overflow: 'hidden'};
	const st = stateAt(f);
	const bars = Array.from({length: ds.hud.waveform.bars}, (_, i) => {
		const a = Math.abs(Math.sin(f * 0.21 + i * 0.7) * Math.sin(f * 0.13 + i * 0.31));
		return 0.14 + 0.86 * a * smooth(f / 30);
	});
	const peak = bars.indexOf(Math.max(...bars));
	const wp = px(WAVE);
	const bandY = ((f * 9) % (H + 440)) - 220;
	const slices = [[0, 34, -16], [34, 66, 10], [66, 100, -7]];
	return (
		<AbsoluteFill style={{background: c.bg, overflow: 'hidden'}}>
			<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
				<defs>
					<radialGradient id="glow" cx="50%" cy="50%" r="50%">
						<stop offset="0%" stopColor={c.glow} stopOpacity={ds.tokens.glow.alpha} />
						<stop offset="100%" stopColor={c.glow} stopOpacity={0} />
					</radialGradient>
					<radialGradient id="lens" cx="50%" cy="50%" r="50%">
						<stop offset="55%" stopColor={c.primary} stopOpacity={0} />
						<stop offset="100%" stopColor={c.primary} stopOpacity={0.14} />
					</radialGradient>
					<radialGradient id="fade" cx="50%" cy={`${(CY / H) * 100}%`} r="62%">
						<stop offset="40%" stopColor={c.bg} stopOpacity={0} />
						<stop offset="100%" stopColor={c.bg} stopOpacity={0.92} />
					</radialGradient>
					<pattern id="grid" width={ds.tokens.grid.pitch} height={ds.tokens.grid.pitch} patternUnits="userSpaceOnUse">
						<path d={`M ${ds.tokens.grid.pitch} 0 L 0 0 L 0 ${ds.tokens.grid.pitch}`} fill="none" stroke={c.grid} strokeWidth={2} strokeOpacity={ds.tokens.grid.alpha} />
					</pattern>
				</defs>
				<rect width={W} height={H} fill="url(#grid)" />
				<rect width={W} height={H} fill="url(#fade)" />
				<circle cx={CX} cy={CY} r={420} fill="url(#glow)" />
				<line x1={22} y1={300} x2={22} y2={1500} stroke={c.primary} strokeOpacity={0.5} strokeWidth={14} strokeDasharray="2 38" strokeDashoffset={-f * 1.5} />
				<line x1={1058} y1={300} x2={1058} y2={1500} stroke={c.primary} strokeOpacity={0.5} strokeWidth={14} strokeDasharray="2 38" strokeDashoffset={f * 1.5} />
				<Corner x={B.inset} y={B.inset} sx={1} sy={1} arm={B.arm} p={bp} stroke={c.primary} w={B.stroke} />
				<Corner x={W - B.inset} y={B.inset} sx={-1} sy={1} arm={B.arm} p={bp} stroke={c.primary} w={B.stroke} />
				<Corner x={B.inset} y={H - B.inset} sx={1} sy={-1} arm={B.arm} p={bp} stroke={c.primary} w={B.stroke} />
				<Corner x={W - B.inset} y={H - B.inset} sx={-1} sy={-1} arm={B.arm} p={bp} stroke={c.primary} w={B.stroke} />
				{[[CX, B.inset], [CX, H - B.inset], [B.inset, 960], [W - B.inset, 960]].map(([x, y], i) => (
					<path key={i} d={`M ${x - 14} ${y} L ${x + 14} ${y} M ${x} ${y - 14} L ${x} ${y + 14}`} stroke={c.dim} strokeWidth={2} opacity={bp} />
				))}
			</svg>
			{/* reticle: one copy, or three shifted slices plus two colour ghosts during the glitch */}
			{!glitching && (
				<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
					<Reticle f={f} c={c} />
				</svg>
			)}
			{glitching && (
				<>
					<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, transform: `translateX(${-off}px)`, mixBlendMode: 'screen', opacity: 0.85}}>
						<Reticle f={f} c={c} mono={c.alert} />
					</svg>
					<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, transform: `translateX(${off}px)`, mixBlendMode: 'screen', opacity: 0.85}}>
						<Reticle f={f} c={c} mono={c.primary} />
					</svg>
					{slices.map(([a, b, dx]) => (
						<svg key={a} width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, clipPath: `inset(${a}% 0 ${100 - b}% 0)`, transform: `translateX(${dx * gv}px)`}}>
							<Reticle f={f} c={c} />
						</svg>
					))}
				</>
			)}
			{/* scanlines: above the reticle, under every plate */}
			<div style={{position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,${ds.hud.scanlines.alpha}) 0px, rgba(0,0,0,${ds.hud.scanlines.alpha}) ${ds.hud.scanlines.line}px, rgba(0,0,0,0) ${ds.hud.scanlines.line}px, rgba(0,0,0,0) ${ds.hud.scanlines.pitch}px)`, pointerEvents: 'none'}} />
			<div style={{position: 'absolute', left: 0, width: W, top: bandY, height: ds.hud.scanlines.band_h, background: `linear-gradient(180deg, rgba(0,0,0,0), ${hexA(c.primary, ds.hud.scanlines.band_alpha)}, rgba(0,0,0,0))`, pointerEvents: 'none'}} />

			{/* title and status plates */}
			<div style={{...plate, ...px(BOXES.title), padding: '8px 26px', display: 'flex', alignItems: 'center', opacity: inA(2), transform: `translateY(${(1 - inA(2)) * 24}px)`}}>
				<div style={{...fontCss(pair.display, 108), color: c.ink, whiteSpace: 'nowrap', transform: `translateX(${glitching ? (f % 2 ? 7 : -7) * gv : 0}px)`}}>{scramble('LOCK ON', f, 4, 14, 3)}</div>
			</div>
			<div style={{...plate, ...px(BOXES.state), padding: '0 20px', display: 'flex', alignItems: 'center', gap: 14, opacity: inA(8)}}>
				<span style={label}>STATE</span>
				<span style={{...label, color: f >= LOCK_F ? c.highlight : c.ink}}>{scramble(st.s, f, st.t, 12, 5)}</span>
			</div>
			<div style={{...plate, ...px(BOXES.clock), padding: '0 20px', display: 'flex', alignItems: 'center', opacity: inA(12)}}>
				<span style={{...label, color: c.ink}}>{clockStr(f)}</span>
			</div>

			{/* live signal bars */}
			<div style={{...plate, left: wp.left, top: wp.top, width: wp.width, height: wp.height, padding: '14px 22px', display: 'flex', alignItems: 'flex-end', gap: ds.hud.waveform.gap, opacity: inA(14)}}>
				{bars.map((h, i) => (
					<div key={i} style={{flex: 1, height: `${h * 100}%`, background: i === peak ? c.highlight : c.primary, opacity: i === peak ? 1 : 0.85}} />
				))}
			</div>

			{/* telemetry readouts, decoded */}
			{READ.map((r, i) => {
				const b = BOXES[`r${i + 1}` as 'r1'];
				const start = 28 + i * ds.hud.readout.scramble.stagger;
				return (
					<div key={r.label} style={{...plate, ...px(b), padding: '8px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: inA(start - 6)}}>
						<span style={label}>{r.label}</span>
						<span style={{...fontCss(pair.mono, 44), color: i === 3 && f >= LOCK_F ? c.ok : c.ink, whiteSpace: 'nowrap', lineHeight: 1.1, ...tnum}}>{scramble(r.val(f), f, start, ds.hud.readout.scramble.frames, i * 11)}</span>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

export const Preview: React.FC<PreviewProps> = ({palette = 'cyan-ops', pairing = 'orbitron-chakra-sharetech'}) => {
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	return (
		<FontGate fonts={{...pair, name: pair.id}}>
			<Scene palette={palette} pairing={pairing} />
		</FontGate>
	);
};

/** Three beats side by side: rings drawing and readouts decoding, tracking, locked after the glitch. */
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
