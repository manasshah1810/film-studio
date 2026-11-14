import React from 'react';
import {AbsoluteFill, Easing, Freeze, interpolate, random, spring, useCurrentFrame} from 'remotion';
import ds from '../../../styles/hormozi-kinetic/design-system.json';
import {FontGate} from '../../engine/fonts';
import {fontCss} from '../../engine/tokens';
import type {Pairing} from '../../engine/types';

/**
 * hormozi-kinetic specimen: one 5 s creator Reel hook, 1080 x 1920 at 30 fps.
 * Giant uppercase captions pop word by word, the spoken word is knocked out of a colour block,
 * power words punch the camera in, a Mode A Narrator bust reacts, a CommentDrop lands at the end.
 * Everything drawn is a palette role of the chosen palette. Boxes below are percent of the frame
 * and must stay inside x 8 to 83, y 10 to 78 so a 4% punch-in still clears the platform UI.
 */
export type PreviewProps = {palette?: string; pairing?: string};
export const PREVIEW_FRAMES = 150;
export const SHEET_FRAMES = [20, 52, 120];
const W = 1080;
const H = 1920;
const FPS = 30;
const px = (pct: number, of: number) => (pct / 100) * of;

/** Layout in percent of the frame. Mirrored 1:1 by the storyboard that check-safezones reads. */
export const BOXES = {
	headline: {x: 8, y: 10, w: 75, h: 38},
	bust: {x: 8, y: 52, w: 38, h: 26},
	comment: {x: 48, y: 55, w: 35, h: 21},
};

type Words = {t: string; s: number; power?: boolean; say: string; line: number};
// s = frame the word is spoken. Copy is the hook; power words get the highlight colour block.
const WORDS: Words[] = [
	{t: 'NOKIA', s: 4, say: 'nokia', line: 0},
	{t: 'OWNED', s: 10, say: 'owned', line: 0},
	{t: '50%', s: 16, power: true, say: 'fifty percent', line: 1},
	{t: 'OF', s: 23, say: 'of', line: 1},
	{t: 'THE', s: 27, say: 'the', line: 1},
	{t: 'PLANET', s: 31, say: 'planet', line: 2},
	{t: '—', s: 38, say: '', line: 2},
	{t: 'AND', s: 42, say: 'and', line: 3},
	{t: 'LOST', s: 48, power: true, say: 'lost', line: 3},
	{t: 'IT', s: 55, say: 'it', line: 3},
	{t: 'IN', s: 60, say: 'in', line: 4},
	{t: '4', s: 64, power: true, say: 'four', line: 4},
	{t: 'YEARS', s: 69, power: true, say: 'years', line: 4},
];
const IMPACT = 48; // LOST
const END_SPEECH = 80;
const COMMENT_AT = 86;

const sp = (f: number, cfg: {damping: number; stiffness: number; mass: number}) => spring({frame: f, fps: FPS, config: cfg});
const SPR = ds.motion.springs;
const ease = (n: keyof typeof ds.motion.easings) => Easing.bezier(...(ds.motion.easings[n] as [number, number, number, number]));

type Viseme = 'MBP' | 'AA' | 'OH' | 'EE' | 'FV';
const VIS: Record<string, Viseme> = {a: 'AA', o: 'OH', u: 'OH', e: 'EE', i: 'EE', f: 'FV', v: 'FV', b: 'MBP', m: 'MBP', p: 'MBP'};
const seqOf = (say: string): Viseme[] => [...say.toLowerCase()].map((c) => VIS[c]).filter(Boolean) as Viseme[];

const visemeAt = (f: number): Viseme => {
	for (let i = WORDS.length - 1; i >= 0; i--) {
		const w = WORDS[i];
		if (f < w.s) continue;
		const q = seqOf(w.say);
		const k = Math.floor((f - w.s) / 2);
		if (!q.length || k >= q.length + 1 || f > END_SPEECH) return 'MBP';
		return q[Math.min(k, q.length - 1)];
	}
	return 'MBP';
};

/** Narrator bust, Mode A. Layers back to front: shadow, hair-back, torso, neck, arm, head, face, hair-front. */
const Bust: React.FC<{c: Record<string, string>; f: number}> = ({c, f}) => {
	const lastPower = [...WORDS].filter((w) => w.power && w.s <= f).pop();
	const raise = lastPower ? interpolate(f - lastPower.s, [0, 5, 18], [1, 1, 0.25], {extrapolateRight: 'clamp'}) * Math.min(1, (f - lastPower.s) / 4) : 0;
	const sway = Math.sin((f / 90) * Math.PI * 2) * 1.2;
	const bob = Math.sin((f / 45) * Math.PI * 2) * 0.8;
	const blinkAt = [34, 128];
	const b = blinkAt.map((s) => f - s).find((d) => d >= 0 && d < 6);
	const eye = b === undefined ? 1 : b < 2 || b >= 4 ? 0.5 : 0.08;
	const brow = lastPower && f - lastPower.s < 14 ? (lastPower.t === 'LOST' ? 'furrowed' : 'raised') : 'neutral';
	const bY = brow === 'raised' ? -3 : brow === 'furrowed' ? 1 : 0;
	const bR = brow === 'raised' ? 8 : brow === 'furrowed' ? -14 : 0;
	const v = visemeAt(f);
	const E = {x: 92, y: 106};
	const Hd = {x: interpolate(raise, [0, 1], [78, 94]), y: interpolate(raise, [0, 1], [114, 80])};
	const limb = (a: {x: number; y: number}, z: {x: number; y: number}, wa: number, wz: number) => {
		const dx = z.x - a.x;
		const dy = z.y - a.y;
		const n = Math.hypot(dx, dy) || 1;
		const px_ = -dy / n;
		const py_ = dx / n;
		return `${a.x + (px_ * wa) / 2},${a.y + (py_ * wa) / 2} ${z.x + (px_ * wz) / 2},${z.y + (py_ * wz) / 2} ${z.x - (px_ * wz) / 2},${z.y - (py_ * wz) / 2} ${a.x - (px_ * wa) / 2},${a.y - (py_ * wa) / 2}`;
	};
	const shade = {fill: c.bg, opacity: 0.22};
	return (
		<svg viewBox="0 0 100 122" width="100%" height="100%" style={{overflow: 'visible'}}>
			<g transform={`translate(0 ${bob}) rotate(${sway} 50 122)`}>
				<ellipse cx={50} cy={120} rx={42} ry={3} fill={c.ink} opacity={0.25} />
				<polygon points="30,40 34,20 50,12 66,20 70,40 73,66 27,66" fill={c.highlight} />
				<polygon points="8,122 12,88 30,78 50,74 70,78 88,88 92,122" fill={c.primary} />
				<polygon points="50,74 70,78 88,88 92,122 60,122" {...shade} />
				<polygon points="42,58 58,58 60,78 50,86 40,78" fill={c.ink} />
				<polygon points="50,58 58,58 60,78 50,86" {...shade} />
				<polygon points={limb({x: 78, y: 86}, E, 11, 9)} fill={c.primary} />
				<polygon points={limb(E, Hd, 9, 7)} fill={c.primary} />
				<ellipse cx={Hd.x} cy={Hd.y} rx={5.6} ry={6.4} fill={c.ink} />
				<ellipse cx={Hd.x + 2} cy={Hd.y + 0.8} rx={2.8} ry={5} fill={c.bg} opacity={0.2} />
				<ellipse cx={33} cy={44} rx={3} ry={4.5} fill={c.ink} />
				<ellipse cx={67} cy={44} rx={3} ry={4.5} fill={c.ink} />
				<ellipse cx={50} cy={42} rx={17} ry={20} fill={c.ink} />
				<polygon points="58,24 67,40 62,56 50,62 57,42" {...shade} />
				<polygon points="50,44 53,50 50,51" fill={c.bg} opacity={0.25} />
				<g transform={`translate(0 ${bY})`}>
					<rect x={38} y={29.5} width={9} height={2.2} rx={1} fill={c.bg} transform={`rotate(${-bR} 42.5 30.6)`} />
					<rect x={53} y={29.5} width={9} height={2.2} rx={1} fill={c.bg} transform={`rotate(${bR} 57.5 30.6)`} />
				</g>
				<ellipse cx={43} cy={40} rx={2.4} ry={3.2 * eye} fill={c.bg} />
				<ellipse cx={57} cy={40} rx={2.4} ry={3.2 * eye} fill={c.bg} />
				<rect x={36} y={34} width={14} height={12} rx={3.5} fill="none" stroke={c.primary} strokeWidth={1.7} />
				<rect x={50} y={34} width={14} height={12} rx={3.5} fill="none" stroke={c.primary} strokeWidth={1.7} />
				<rect x={49.5} y={38} width={1} height={1.6} fill={c.primary} />
				{v === 'MBP' && <rect x={44} y={51.5} width={12} height={1.8} rx={0.9} fill={c.bg} />}
				{v === 'AA' && <ellipse cx={50} cy={53} rx={4.6} ry={4.4} fill={c.bg} />}
				{v === 'OH' && <ellipse cx={50} cy={53} rx={3.1} ry={3.7} fill={c.bg} />}
				{v === 'EE' && <rect x={42} y={51} width={16} height={3.4} rx={1.7} fill={c.bg} />}
				{v === 'FV' && (
					<>
						<rect x={44} y={50.5} width={12} height={4} rx={1.6} fill={c.bg} />
						<rect x={45} y={50.5} width={10} height={1.7} fill={c.ink} />
					</>
				)}
				<polygon points="32,36 34,24 46,15 62,18 69,30 66,34 58,26 46,28 38,34" fill={c.highlight} />
			</g>
		</svg>
	);
};

const CommentDrop: React.FC<{c: Record<string, string>; f: number; pair: Pairing}> = ({c, f, pair}) => {
	const t = f - COMMENT_AT;
	if (t < 0) return null;
	const p = sp(t, SPR.slam);
	const likes = Math.round(interpolate(t, [4, 24], [0, 4200], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease('punch')}));
	const label = likes >= 1000 ? `${(likes / 1000).toFixed(1)}K` : String(likes);
	const pad = px(1.8, W);
	return (
		<div
			style={{
				position: 'absolute',
				left: `${BOXES.comment.x}%`,
				top: `${BOXES.comment.y}%`,
				width: `${BOXES.comment.w}%`,
				height: `${BOXES.comment.h}%`,
				background: c.ink,
				borderRadius: 26,
				padding: pad,
				boxSizing: 'border-box',
				transform: `translateY(${(1 - p) * 220}px) rotate(${2 - (p - 1) * 6}deg) scale(${0.9 + 0.1 * p})`,
				opacity: Math.min(1, t / 3),
				boxShadow: `12px 12px 0 ${c.primary}`,
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
			}}
		>
			<div style={{display: 'flex', alignItems: 'center', gap: 14}}>
				<div style={{width: 62, height: 62, borderRadius: 31, background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', ...fontCss(pair.accent, 40), color: c.bg}}>M</div>
				<div style={{...fontCss(pair.body, 34), color: c.bg}}>@marcus_builds</div>
			</div>
			<div style={{...fontCss(pair.body, 38), color: c.bg, lineHeight: 1.12}}>Nokia had the whole market and still missed it.</div>
			<div style={{display: 'flex', alignItems: 'center', gap: 10, ...fontCss(pair.mono, 36), color: c.bg}}>
				<svg width={40} height={36} viewBox="0 0 24 22">
					<path d="M12 21 C3 14 1 9 1 6.5 C1 3.4 3.4 1.5 6.2 1.5 C8.6 1.5 10.7 3 12 5 C13.3 3 15.4 1.5 17.8 1.5 C20.6 1.5 23 3.4 23 6.5 C23 9 21 14 12 21 Z" fill={c.highlight} transform={`scale(${1 + 0.12 * Math.sin(t / 3)}) `} style={{transformOrigin: '12px 11px'}} />
				</svg>
				{label}
			</div>
		</div>
	);
};

const Scene: React.FC<{palette: string; pairing: string}> = ({palette, pairing}) => {
	const f = useCurrentFrame();
	const pal = ds.palettes.find((p) => p.id === palette) ?? ds.palettes[0];
	const c = pal.roles as Record<string, string>;
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing & {display: {size: number}};
	const size = pair.display.size;

	// camera: punch-in on every power word, settle with the settle spring
	const last = [...WORDS].filter((w) => w.power && w.s <= f).pop();
	const k = last ? interpolate(f - last.s, [0, 3, 17], [0, 1, 0], {extrapolateRight: 'clamp', easing: ease('settle')}) : 0;
	const zoom = 1 + 0.04 * k + 0.008 * Math.sin((f / 90) * Math.PI * 2);

	const shake = f >= IMPACT && f < IMPACT + 6 ? (6 - (f - IMPACT)) * 2 : 0;
	const sx = shake * (random(`sx${f}`) - 0.5) * 2;
	const sy = shake * (random(`sy${f}`) - 0.5) * 2;
	const flash = f >= IMPACT && f < IMPACT + 3 ? 0.85 * (1 - (f - IMPACT) / 3) : 0;

	const bgScale = 1 + 0.15 * (1 - sp(f, SPR.pullback));
	const drift = f * 0.9;
	const lines = [0, 1, 2, 3, 4].map((ln) => WORDS.filter((w) => w.line === ln));
	const ruleP = interpolate(f, [70, 84], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease('punch')});

	return (
		<AbsoluteFill style={{background: c.bg, overflow: 'hidden'}}>
			<AbsoluteFill style={{transform: `scale(${bgScale})`}}>
				<div
					style={{
						position: 'absolute',
						left: -400,
						top: -400,
						width: W + 800,
						height: H + 800,
						backgroundImage: `repeating-linear-gradient(115deg, ${c.shadow} 0 70px, transparent 70px 210px)`,
						transform: `translate(${(drift % 210) * 0.5}px, ${drift * 0.3 % 120}px)`,
					}}
				/>
			</AbsoluteFill>
			<AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${zoom})`}}>
				<div style={{position: 'absolute', left: `${BOXES.headline.x}%`, top: `${BOXES.headline.y}%`, width: `${BOXES.headline.w}%`, height: `${BOXES.headline.h}%`, display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
					{lines.map((ws, li) => (
						<div key={li} style={{display: 'flex', alignItems: 'center', height: size * pair.display.lineHeight * 1.02, whiteSpace: 'nowrap'}}>
							{ws.map((w) => {
								const i = WORDS.indexOf(w);
								const next = WORDS[i + 1]?.s ?? 9999;
								const active = f >= w.s && f < next && f <= END_SPEECH + 4;
								const p = f >= w.s ? sp(f - w.s, SPR.pop) : 0;
								const grow = active ? (w.power ? 1.1 : 1.06) : 1;
								const block = active && w.say !== '' ? (w.power ? c.highlight : c.primary) : 'transparent';
								const colour = active && w.say !== '' ? c.bg : w.power && f >= w.s ? c.primary : c.ink;
								return (
									<span
										key={i}
										style={{
											...fontCss(pair.display, size),
											display: 'inline-block',
											padding: '0 0.09em',
											marginRight: '0.04em',
											background: block,
											color: colour,
											opacity: f >= w.s ? Math.min(1, (f - w.s) / 2 + 0.2) : 0,
											transform: `scale(${(0.6 + 0.4 * p) * grow}) rotate(${active ? (w.power ? -2 : 1.5) : 0}deg)`,
											transformOrigin: '50% 70%',
										}}
									>
										{w.t}
									</span>
								);
							})}
						</div>
					))}
				</div>
				<div style={{position: 'absolute', left: `${BOXES.headline.x}%`, top: '50%', width: `${BOXES.headline.w * ruleP}%`, height: 14, background: c.primary}} />
				<div style={{position: 'absolute', left: `${BOXES.bust.x}%`, top: `${BOXES.bust.y}%`, width: `${BOXES.bust.w}%`, height: `${BOXES.bust.h}%`}}>
					<Bust c={c} f={f} />
				</div>
				<CommentDrop c={c} f={f} pair={pair} />
			</AbsoluteFill>
			<AbsoluteFill style={{background: c.ink, opacity: flash, pointerEvents: 'none'}} />
		</AbsoluteFill>
	);
};

export const Preview: React.FC<PreviewProps> = ({palette = 'blackout-gold', pairing = 'anton-inter'}) => {
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	return (
		<FontGate fonts={{...pair, name: pair.id}}>
			<Scene palette={palette} pairing={pairing} />
		</FontGate>
	);
};

/** Three beats side by side: first power word, the impact frame, the finished frame. */
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
