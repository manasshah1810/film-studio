import React from 'react';
import {AbsoluteFill, Easing, Freeze, interpolate, spring, useCurrentFrame} from 'remotion';
import ds from '../../../styles/neo-brutalist-ui/design-system.json';
import {FontGate} from '../../engine/fonts';
import {fontCss} from '../../engine/tokens';
import type {Pairing} from '../../engine/types';

/**
 * neo-brutalist-ui specimen: one 5 s creator workspace, 1080 x 1920 at 30 fps.
 * A window gravity-drops in, a named LiveCursor types a prompt and clicks Generate, the draft card
 * flips on its Y axis to a finished reel with an NLE timeline, then two frosted glass metric cards
 * drop onto a dotted ground and a primary band. Every fill is a role of the chosen palette.
 * Tokens (3 design px border, 5 design px hard shadow, 12 design px blur) are multiplied by frame_scale.
 */
export type PreviewProps = {palette?: string; pairing?: string};
export const PREVIEW_FRAMES = 150;
export const SHEET_FRAMES = [48, 62, 128];
const W = 1080;
const H = 1920;
const FPS = 30;
const T = ds.tokens;
const U = T.frame_scale;
const BW = T.border.width * U;
const SH = T.offset_shadow.x * U;
const BLUR = T.backdrop_blur.radius * U;

/** Layout in percent of the frame. Mirrored 1:1 by the storyboard that check-safezones reads. */
export const BOXES = {
	title: {x: 8, y: 9, w: 75, h: 13},
	window: {x: 8, y: 25, w: 75, h: 36},
	sticker: {x: 60, y: 21, w: 24, h: 6},
	glassA: {x: 8, y: 63, w: 36, h: 15},
	glassB: {x: 47, y: 65, w: 36, h: 15},
};
const WIN = {x: (BOXES.window.x / 100) * W, y: (BOXES.window.y / 100) * H, w: (BOXES.window.w / 100) * W, h: (BOXES.window.h / 100) * H};
const pct = (b: {x: number; y: number; w: number; h: number}) => ({left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`});
const centre = (b: {x: number; y: number; w: number; h: number}) => ({x: ((b.x + b.w / 2) / 100) * W, y: ((b.y + b.h / 2) / 100) * H});

const PROMPT = 'Cut my notes into a 20 second reel';
const TYPE_FROM = 12;
const CLICK = 50;
const FLIP_AT = 52;
const DROP_A = 74;
const DROP_B = 82;

const SPR = ds.motion.springs;
const sp = (f: number, cfg: {damping: number; stiffness: number; mass: number}) => spring({frame: f, fps: FPS, config: cfg});
const ease = (n: keyof typeof ds.motion.easings) => Easing.bezier(...(ds.motion.easings[n] as [number, number, number, number]));
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const lin = (h: string) => {
	const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
	return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a: string, b: string) => (Math.max(lin(a), lin(b)) + 0.05) / (Math.min(lin(a), lin(b)) + 0.05);
const hexA = (h: string, a: number) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;

type Roles = Record<string, string>;
/** Text on a coloured fill is ink or bg, whichever reads better. */
const onFill = (c: Roles, fill: string) => (contrast(c.ink, fill) >= contrast(c.bg, fill) ? c.ink : c.bg);

/** Gravity drop: falls from above, lands, rebounds a little, squashes on contact. */
const drop = (f: number, start: number, dist: number) => {
	if (f < start) return {y: -dist, sx: 1, sy: 1, on: false};
	const p = sp(f - start, SPR.gravity);
	const y = p < 1 ? -(1 - p) * dist : -(p - 1) * 70;
	const sq = p > 0.9 ? Math.max(0, 1 - Math.abs(p - 1) / 0.1) : 0;
	return {y, sx: 1 + 0.03 * sq, sy: 1 - 0.06 * sq, on: true};
};

const card = (c: Roles, extra: React.CSSProperties = {}, lift = 0): React.CSSProperties => ({
	boxSizing: 'border-box',
	border: `${BW}px solid ${c.ink}`,
	borderRadius: T.border.radius.card * U,
	boxShadow: `${SH + lift * 9}px ${SH + lift * 9}px 0 ${c.ink}`,
	...extra,
});

const Chip: React.FC<{c: Roles; pair: Pairing; fill: string; children: React.ReactNode; size?: number}> = ({c, pair, fill, children, size = 34}) => (
	<div style={{...fontCss(pair.mono, size), display: 'inline-flex', alignItems: 'center', height: 52, padding: '0 18px', background: fill, color: onFill(c, fill), border: `${BW * 0.6}px solid ${c.ink}`, borderRadius: T.border.radius.sticker * U, letterSpacing: 0.5}}>
		{children}
	</div>
);

const Keycap: React.FC<{c: Roles; pair: Pairing; label: string; press: number}> = ({c, pair, label, press}) => (
	<div style={{...fontCss(pair.mono, 38), width: 66, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: press > 0.5 ? c.primary : c.surface, color: onFill(c, press > 0.5 ? c.primary : c.surface), border: `${BW * 0.6}px solid ${c.ink}`, borderRadius: 12, boxShadow: `${9 * (1 - press) + 3}px ${9 * (1 - press) + 3}px 0 ${c.ink}`, transform: `translate(${press * 6}px, ${press * 6}px)`}}>{label}</div>
);

const Timeline: React.FC<{c: Roles; f: number; w: number}> = ({c, f, w}) => {
	const rows = [
		{fill: c.primary, segs: [[0, 0.3], [0.33, 0.62], [0.66, 1]]},
		{fill: c.highlight, segs: [[0.08, 0.2], [0.26, 0.5], [0.56, 0.9]]},
		{fill: c.surface, segs: [[0, 0.46], [0.5, 1]]},
	];
	const head = interpolate(f, [FLIP_AT + 22, PREVIEW_FRAMES - 4], [0.02, 0.98], clamp);
	return (
		<div style={{position: 'relative', width: w, height: 106}}>
			{rows.map((r, ri) => (
				<div key={ri} style={{position: 'absolute', left: 0, top: ri * 38, width: w, height: 30}}>
					{r.segs.map((s, si) => {
						const p = interpolate(f, [FLIP_AT + 16 + ri * 4 + si * 3, FLIP_AT + 24 + ri * 4 + si * 3], [0, 1], {...clamp, easing: ease('settle')});
						return <div key={si} style={{position: 'absolute', left: s[0] * w, width: (s[1] - s[0]) * w * p - 6, top: 0, height: 30, background: r.fill, border: `${BW * 0.5}px solid ${c.ink}`, borderRadius: 6, boxSizing: 'border-box', opacity: p > 0 ? 1 : 0}} />;
					})}
				</div>
			))}
			<div style={{position: 'absolute', left: head * w - 3, top: -12, width: 6, height: 128, background: c.ink}} />
			<div style={{position: 'absolute', left: head * w - 14, top: -22, width: 28, height: 18, background: c.ink, clipPath: 'polygon(0 0, 100% 0, 50% 100%)'}} />
		</div>
	);
};

const Cursor: React.FC<{c: Roles; pair: Pairing; f: number; press: number}> = ({c, pair, f, press}) => {
	const bt = centre({x: 53.2, y: 32.2, w: 23.9, h: 5.7});
	const a = centre(BOXES.glassA);
	const b = centre(BOXES.glassB);
	const K = [
		{f: 4, x: 1180, y: 640},
		{f: 18, x: 470, y: 700},
		{f: 40, x: 470, y: 700},
		{f: 48, x: bt.x + 108, y: bt.y + 40},
		{f: 56, x: bt.x + 108, y: bt.y + 40},
		{f: 70, x: 900, y: 880},
		{f: 94, x: a.x + 110, y: a.y - 112},
		{f: 114, x: a.x + 110, y: a.y - 112},
		{f: 126, x: b.x + 130, y: b.y - 112},
		{f: 150, x: b.x + 130, y: b.y - 112},
	];
	let i = 0;
	while (i < K.length - 2 && f > K[i + 1].f) i++;
	const s = K[i];
	const e = K[i + 1];
	const t = interpolate(f, [s.f, e.f], [0, 1], {...clamp, easing: ease('snap')});
	const x = s.x + (e.x - s.x) * t;
	const y = s.y + (e.y - s.y) * t - 46 * Math.sin(Math.PI * t) * (s.x === e.x && s.y === e.y ? 0 : 1);
	return (
		<div style={{position: 'absolute', left: x, top: y, transform: `scale(${1 - 0.2 * press})`, transformOrigin: '0 0', pointerEvents: 'none'}}>
			<svg width={62} height={84} viewBox="0 0 31 42" style={{overflow: 'visible'}}>
				<polygon points="2,2 2,32 10,25 16,39 22,36 16,23 27,23" fill={c.ink} stroke={c.bg} strokeWidth={2.4} strokeLinejoin="round" />
			</svg>
			<div style={{...fontCss(pair.mono, 34), position: 'absolute', left: 40, top: 62, padding: '2px 16px', background: c.highlight, color: onFill(c, c.highlight), border: `${BW * 0.6}px solid ${c.ink}`, borderRadius: 999, whiteSpace: 'nowrap'}}>Priya</div>
		</div>
	);
};

const Metric: React.FC<{c: Roles; pair: Pairing; f: number; start: number; box: typeof BOXES.glassA; label: string; unit: string; target: number; delta: string; hover: number; tilt: number}> = ({c, pair, f, start, box, label, unit, target, delta, hover, tilt}) => {
	const d = drop(f, start, box.y * 19.2 + 420);
	if (!d.on) return null;
	const n = Math.round(interpolate(f, [start + 8, start + 32], [0, target], {...clamp, easing: ease('settle')}));
	const txt = unit === 'K' ? String(n) : n.toLocaleString('en-US');
	return (
		<div
			style={{
				position: 'absolute',
				...pct(box),
				transform: `translate(${-9 * hover}px, ${d.y - 9 * hover}px) rotate(${tilt}deg) scale(${d.sx}, ${d.sy})`,
				transformOrigin: '50% 100%',
				background: hexA(c.surface, T.backdrop_blur.fill_alpha),
				backdropFilter: `blur(${BLUR}px) saturate(${T.backdrop_blur.saturate})`,
				WebkitBackdropFilter: `blur(${BLUR}px) saturate(${T.backdrop_blur.saturate})`,
				...card(c, {}, hover),
				padding: '22px 28px',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
			}}
		>
			<div style={{...fontCss(pair.mono, 34), color: c.ink, textTransform: 'uppercase', letterSpacing: 1}}>{label}</div>
			<div style={{...fontCss(pair.display, 108), color: c.ink, lineHeight: 1, whiteSpace: 'nowrap'}}>
				{txt}
				<span style={{...fontCss(pair.accent, 64), marginLeft: 6}}>{unit === 'K' ? 'K' : ''}</span>
			</div>
			<div><Chip c={c} pair={pair} fill={c.primary}>{delta}</Chip></div>
		</div>
	);
};

const Scene: React.FC<{palette: string; pairing: string}> = ({palette, pairing}) => {
	const f = useCurrentFrame();
	const pal = ds.palettes.find((p) => p.id === palette) ?? ds.palettes[0];
	const c = pal.roles as Roles;
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;

	const typed = PROMPT.slice(0, Math.max(0, Math.min(PROMPT.length, Math.floor((f - TYPE_FROM) * 1.4))));
	const caret = Math.floor(f / 8) % 2 === 0;
	const press = interpolate(f, [CLICK - 2, CLICK, CLICK + 5], [0, 1, 0], clamp);
	const flipP = interpolate(f, [FLIP_AT, FLIP_AT + 18], [0, 1], {...clamp, easing: ease('flip')});
	const win = drop(f, 3, 1000);
	const drift = f * 0.6;
	const hoverA = interpolate(f, [94, 99, 112, 116], [0, 1, 1, 0], clamp);
	const hoverB = interpolate(f, [124, 129], [0, 1], clamp);
	const stamp = f >= 14 ? sp(f - 14, SPR.overshoot) : 0;
	const titleP = (s: number) => (f >= s ? sp(f - s, SPR.overshoot) : 0);
	const push = 1 + 0.03 * interpolate(f, [FLIP_AT, FLIP_AT + 12, FLIP_AT + 34], [0, 1, 0], {...clamp, easing: ease('settle')});

	const wp = {pad: 24, titlebar: 84};
	return (
		<AbsoluteFill style={{background: c.bg, overflow: 'hidden'}}>
			{/* textured ground: dot grid, a primary band and a highlight disc for the glass to blur */}
			<div style={{position: 'absolute', inset: -100, backgroundImage: `radial-gradient(circle, ${hexA(c.ink, T.ground.dot_opacity * 1.6)} ${T.ground.dot_size * U}px, transparent ${T.ground.dot_size * U + 0.6}px)`, backgroundSize: `${T.ground.dot_pitch * U}px ${T.ground.dot_pitch * U}px`, transform: `translate(${drift % 42}px, ${(drift * 0.5) % 42}px)`}} />
			<div style={{position: 'absolute', left: -160, top: '61%', width: W + 320, height: '23%', background: c.primary, borderTop: `${BW}px solid ${c.ink}`, borderBottom: `${BW}px solid ${c.ink}`, transform: `rotate(${T.ground.band_rotate}deg)`}} />
			<div style={{position: 'absolute', left: '37%', top: '64%', width: 300, height: 300, borderRadius: 150, background: c.highlight, border: `${BW}px solid ${c.ink}`}} />
			<div style={{position: 'absolute', left: '80%', top: '60%', width: 120, height: 120, background: c.surface, border: `${BW}px solid ${c.ink}`, transform: 'rotate(14deg)', boxShadow: `${SH}px ${SH}px 0 ${c.ink}`}} />

			{/* headline */}
			<div style={{position: 'absolute', ...pct(BOXES.title), display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
				{['Prompt in.', 'Reel out.'].map((t, i) => {
					const p = titleP(i * 6);
					const hl = i === 1;
					return (
						<div
							key={t}
							style={{
								...fontCss(pair.display, 108),
								lineHeight: 1.02,
								padding: hl ? '0 22px' : '0',
								marginLeft: hl ? -22 : 0,
								background: hl ? c.highlight : 'transparent',
								color: hl ? onFill(c, c.highlight) : c.ink,
								border: hl ? `${BW}px solid ${c.ink}` : 'none',
								boxShadow: hl ? `${SH}px ${SH}px 0 ${c.ink}` : 'none',
								transform: `translateY(${(1 - p) * 70}px) rotate(${hl ? -1.5 : 0}deg) scale(${0.92 + 0.08 * p})`,
								opacity: Math.min(1, p * 3),
								transformOrigin: '0 100%',
								whiteSpace: 'nowrap',
							}}
						>
							{t}
						</div>
					);
				})}
			</div>

			{/* workspace window */}
			<div style={{position: 'absolute', ...pct(BOXES.window), transform: `translateY(${win.y}px) scale(${win.sx * push}, ${win.sy * push})`, transformOrigin: '50% 100%', opacity: win.on ? 1 : 0}}>
				<div style={{...card(c, {position: 'absolute', inset: 0, background: c.surface})}} />
				<div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: wp.titlebar, borderBottom: `${BW}px solid ${c.ink}`, background: c.primary, borderRadius: `${T.border.radius.card * U - 4}px ${T.border.radius.card * U - 4}px 0 0`, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, boxSizing: 'border-box'}}>
					{[c.surface, c.highlight, c.bg].map((fill, i) => (
						<div key={i} style={{width: 28, height: 28, borderRadius: 14, background: fill, border: `${BW * 0.6}px solid ${c.ink}`}} />
					))}
					<div style={{...fontCss(pair.mono, 34), color: onFill(c, c.primary), marginLeft: 10}}>launch-week.reel</div>
				</div>

				{/* PromptBar */}
				<div style={{...card(c, {position: 'absolute', left: wp.pad, top: 108, width: WIN.w - wp.pad * 2, height: 170, background: c.bg})}}>
					<div style={{position: 'absolute', left: 24, top: 12, width: 422, height: 146, display: 'flex', alignItems: 'center'}}>
						<div style={{...fontCss(pair.mono, 34), color: c.ink, lineHeight: 1.25, whiteSpace: 'pre-wrap'}}>
							{typed}
							<span style={{display: 'inline-block', width: 16, height: 34, marginLeft: 2, background: caret ? c.ink : 'transparent', verticalAlign: 'text-bottom'}} />
						</div>
					</div>
					<div
						style={{
							...fontCss(pair.body, 44), whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.5,
							position: 'absolute', left: 488 - wp.pad, top: 26, width: 258, height: 110,
							display: 'flex', alignItems: 'center', justifyContent: 'center',
							background: c.primary, color: onFill(c, c.primary),
							border: `${BW}px solid ${c.ink}`, borderRadius: T.border.radius.button * U, boxSizing: 'border-box',
							boxShadow: `${SH * (1 - 0.8 * press)}px ${SH * (1 - 0.8 * press)}px 0 ${c.ink}`,
							transform: `translate(${press * 12}px, ${press * 12}px)`,
						}}
					>
						Generate
					</div>
				</div>

				{/* flip card: draft front, finished back */}
				<div style={{position: 'absolute', left: wp.pad, top: 302, width: WIN.w - wp.pad * 2, height: 365, perspective: 1400}}>
					<div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateY(${180 * flipP}deg)`}}>
						<div style={{...card(c, {position: 'absolute', inset: 0, background: c.bg, backfaceVisibility: 'hidden', padding: '20px 26px'})}}>
							<Chip c={c} pair={pair} fill={c.highlight}>DRAFT</Chip>
							<div style={{...fontCss(pair.display, 64), color: c.ink, marginTop: 16, lineHeight: 1.05}}>No clips yet.</div>
							<div style={{...fontCss(pair.body, 44), color: c.ink, marginTop: 8}}>14 note lines ready to cut</div>
							<div style={{position: 'absolute', left: 26, bottom: 24, display: 'flex', alignItems: 'center', gap: 14}}>
								<Keycap c={c} pair={pair} label="⌘" press={press} />
								<Keycap c={c} pair={pair} label="↵" press={press} />
								<div style={{...fontCss(pair.mono, 34), color: c.ink, marginLeft: 8}}>generate</div>
							</div>
						</div>
						<div style={{...card(c, {position: 'absolute', inset: 0, background: c.surface, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', padding: '20px 26px'})}}>
							<div style={{display: 'flex', gap: 14}}>
								<Chip c={c} pair={pair} fill={c.primary}>READY</Chip>
								<Chip c={c} pair={pair} fill={c.surface}>6 CLIPS · CAPTIONS ON</Chip>
							</div>
							<div style={{...fontCss(pair.display, 64), color: c.ink, marginTop: 14, lineHeight: 1.05}}>Reel ready. 20 s.</div>
							<div style={{position: 'absolute', left: 26, top: 214}}><Timeline c={c} f={f} w={WIN.w - wp.pad * 2 - 52 - BW * 2} /></div>
						</div>
					</div>
				</div>
			</div>

			{/* sticker badge */}
			{f >= 14 && (
				<div style={{position: 'absolute', ...pct(BOXES.sticker), display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.highlight, color: onFill(c, c.highlight), ...fontCss(pair.accent, 48), border: `${BW}px solid ${c.ink}`, borderRadius: T.border.radius.sticker * U, boxShadow: `${T.sticker.shadow.x * U}px ${T.sticker.shadow.y * U}px 0 ${c.ink}`, boxSizing: 'border-box', transform: `rotate(${-6 + (1 - stamp) * 14}deg) scale(${1 + (1 - stamp) * 0.6})`, opacity: Math.min(1, stamp * 4)}}>
					AI CUT
				</div>
			)}

			{/* frosted glass metric cards */}
			<Metric c={c} pair={pair} f={f} start={DROP_A} box={BOXES.glassA} label="Reel views" unit="K" target={128} delta="+34% WEEK" hover={hoverA} tilt={-2} />
			<Metric c={c} pair={pair} f={f} start={DROP_B} box={BOXES.glassB} label="Signups" unit="" target={4812} delta="+212 TODAY" hover={hoverB} tilt={1.5} />

			<Cursor c={c} pair={pair} f={f} press={press} />
		</AbsoluteFill>
	);
};

export const Preview: React.FC<PreviewProps> = ({palette = 'butter-ink', pairing = 'bricolage-dmsans'}) => {
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	return (
		<FontGate fonts={{...pair, name: pair.id}}>
			<Scene palette={palette} pairing={pairing} />
		</FontGate>
	);
};

/** Three beats side by side: the click, the mid flip, the finished workspace with glass cards. */
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
