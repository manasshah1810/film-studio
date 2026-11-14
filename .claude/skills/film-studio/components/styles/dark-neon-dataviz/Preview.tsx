import React from 'react';
import {AbsoluteFill, Easing, Freeze, interpolate, spring, useCurrentFrame} from 'remotion';
import ds from '../../../styles/dark-neon-dataviz/design-system.json';
import {FontGate} from '../../engine/fonts';
import {fontCss} from '../../engine/tokens';
import type {Pairing} from '../../engine/types';

/**
 * dark-neon-dataviz specimen: one 5 s market-share collapse, 1080 x 1920 at 30 fps. Mode C, data first, no people.
 * An obsidian chart card; a glowing neon line draws on, an area gradient grows under it, three callout nodes pop
 * with opaque label plates, an odometer rolls the share from 49 to 3, two stat cards drop in, and the whole scene
 * drifts the entire time. Glow is an feGaussianBlur chain clipped to the card; no text ever sits on a glow.
 * Data is illustrative (a made up incumbent), and the film says so on screen.
 */
export type PreviewProps = {palette?: string; pairing?: string};
export const PREVIEW_FRAMES = 150;
export const SHEET_FRAMES = [44, 84, 132];
const W = 1080;
const H = 1920;
const FPS = 30;
const T = ds.tokens;
const SPR = ds.motion.springs;

/** Text boxes in percent of the frame. Mirrored 1:1 by the storyboard that check-safezones reads. */
export const BOXES = {
	title: {x: 8, y: 8, w: 76, h: 12},
	numeral: {x: 8, y: 21, w: 44, h: 11},
	numLabel: {x: 52, y: 22.5, w: 33, h: 8},
	plate1: {x: 48, y: 37.3, w: 17.6, h: 5.5},
	plate2: {x: 60.2, y: 43.5, w: 22.2, h: 5.5},
	plate3: {x: 66.7, y: 50.1, w: 15.7, h: 5.5},
	statA: {x: 8, y: 72, w: 36, h: 8},
	statB: {x: 48, y: 72, w: 36, h: 8},
};
const CARD = {x: 0.08 * W, y: 0.33 * H, w: 0.76 * W, h: 0.37 * H};
const px = (b: {x: number; y: number; w: number; h: number}) => ({left: (b.x / 100) * W, top: (b.y / 100) * H, width: (b.w / 100) * W, height: (b.h / 100) * H});

/** Plot rectangle inside the card, and the data. */
const PLOT = {l: 196, r: 856, top: 694, bottom: 1254};
const YEARS = [2007, 2008, 2009, 2010, 2011, 2012, 2013];
const DATA = [49, 46, 38, 29, 21, 11, 3];
const CALLOUTS = [
	{i: 2, label: 'RIVAL', box: BOXES.plate1},
	{i: 4, label: 'PRICE WAR', box: BOXES.plate2},
	{i: 6, label: 'EXIT', box: BOXES.plate3},
];
const xAt = (i: number) => PLOT.l + ((PLOT.r - PLOT.l) / (DATA.length - 1)) * i;
const yOf = (v: number) => PLOT.bottom - (v / 50) * (PLOT.bottom - PLOT.top);
const smooth = (u: number) => u * u * (3 - 2 * u);
const valueAtX = (x: number) => {
	const t = Math.min(DATA.length - 1 - 1e-9, Math.max(0, (x - PLOT.l) / ((PLOT.r - PLOT.l) / (DATA.length - 1))));
	const i = Math.floor(t);
	return DATA[i] + (DATA[i + 1] - DATA[i]) * smooth(t - i);
};
const N = 180;
const PTS = Array.from({length: N + 1}, (_, k) => {
	const x = PLOT.l + ((PLOT.r - PLOT.l) * k) / N;
	return {x, y: yOf(valueAtX(x))};
});
const CUM = PTS.reduce<number[]>((a, p, k) => {
	a.push(k === 0 ? 0 : a[k - 1] + Math.hypot(p.x - PTS[k - 1].x, p.y - PTS[k - 1].y));
	return a;
}, []);
const TOTAL = CUM[CUM.length - 1];
const LINE_D = PTS.map((p, k) => `${k === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
const AREA_D = `${LINE_D} L${PLOT.r} ${PLOT.bottom} L${PLOT.l} ${PLOT.bottom} Z`;
const headAt = (p: number) => {
	const L = p * TOTAL;
	let k = 1;
	while (k < CUM.length - 1 && CUM[k] < L) k++;
	const u = (L - CUM[k - 1]) / Math.max(1e-6, CUM[k] - CUM[k - 1]);
	return {x: PTS[k - 1].x + (PTS[k].x - PTS[k - 1].x) * u, y: PTS[k - 1].y + (PTS[k].y - PTS[k - 1].y) * u};
};

const DRAW_FROM = 20;
const DRAW_TO = 100;
const ease = (n: keyof typeof ds.motion.easings) => Easing.bezier(...(ds.motion.easings[n] as [number, number, number, number]));
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const prog = (f: number) => interpolate(f, [DRAW_FROM, DRAW_TO], [0, 1], {...clamp, easing: ease('draw')});
/** First frame at which the line head has passed a callout node. */
const NODE_FRAME = CALLOUTS.map(({i}) => {
	for (let f = 0; f <= PREVIEW_FRAMES; f++) if (headAt(prog(f)).x >= xAt(i) - 0.5) return f;
	return PREVIEW_FRAMES;
});
const sp = (f: number, cfg: {damping: number; stiffness: number; mass: number}) => spring({frame: f, fps: FPS, config: cfg});

const hexA = (h: string, a: number) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
const blend = (a: string, b: string, t: number) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * t + parseInt(b.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('');
type Roles = Record<string, string>;

/** One rolling digit column. pos is the continuous digit position; the cell strip is 0 to 9 then 0 again. */
const Digit: React.FC<{pos: number; size: number; color: string; visible: number; style: React.CSSProperties}> = ({pos, size, color, visible, style}) => {
	const m = ((pos % 10) + 10) % 10;
	return (
		<div style={{width: size * 0.62, height: size, overflow: 'hidden', position: 'relative', opacity: visible}}>
			<div style={{...style, color, position: 'absolute', left: 0, top: 0, width: '100%', textAlign: 'center', transform: `translateY(${-m * size}px)`, lineHeight: 1}}>
				{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, k) => (
					<div key={k} style={{height: size}}>{d}</div>
				))}
			</div>
		</div>
	);
};
/** Odometer: fixed width digit columns, tabular numerals, a leading zero fades instead of reflowing. */
const Odometer: React.FC<{value: number; cols: number; size: number; color: string; style: React.CSSProperties}> = ({value, cols, size, color, style}) => (
	<div style={{display: 'flex', flexDirection: 'row', height: size}}>
		{Array.from({length: cols}, (_, k) => cols - 1 - k).map((k) => {
			const q = value / 10 ** k;
			const base = Math.floor(q);
			const fr = q - base;
			const pos = base + smooth(Math.min(1, Math.max(0, (fr - 0.5) * 2)));
			const vis = k === 0 ? 1 : Math.min(1, Math.max(0, (q - 0.5) / 0.5));
			return <Digit key={k} pos={pos} size={size} color={color} visible={vis} style={style} />;
		})}
	</div>
);

const Scene: React.FC<{palette: string; pairing: string}> = ({palette, pairing}) => {
	const f = useCurrentFrame();
	const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
	const pal = ds.palettes.find((p) => p.id === palette) ?? ds.palettes[0];
	const c = pal.roles as Roles;
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	const alert = c.alert ?? c.highlight;
	const muted = c.muted ?? blend(c.ink, c.surface, 0.72);
	const tnum: React.CSSProperties = {fontVariantNumeric: 'tabular-nums'};

	const p = prog(f);
	const head = headAt(p);
	const share = valueAtX(head.x);
	const lost = DATA[0] - share;
	const yearV = YEARS[0] + (YEARS[6] - YEARS[0]) * ((head.x - PLOT.l) / (PLOT.r - PLOT.l));
	const tD = f / PREVIEW_FRAMES;
	const dr = interpolate(f, [0, PREVIEW_FRAMES], [0, 1], {...clamp, easing: ease('drift')});
	const scale = 1 + 0.03 * dr;
	const focus = interpolate(f, [106, 120], [0, 1], {...clamp, easing: ease('focus')});
	const titleIn = (s: number) => interpolate(f, [s, s + 10], [0, 1], {...clamp, easing: ease('roll')});
	const cardIn = interpolate(f, [4, 16], [0, 1], {...clamp, easing: ease('roll')});
	const statIn = (s: number) => (f >= s ? sp(f - s, SPR.pop) : 0);
	const glowOn = p > 0.002;
	const done = p >= 0.999;
	const calloutDim = (k: number) => (k === CALLOUTS.length - 1 ? 1 : 1 - 0.4 * focus); // dims lines and nodes only, never label text

	const label: React.CSSProperties = {...fontCss(pair.mono, 34), color: muted, whiteSpace: 'nowrap', ...tnum};

	return (
		<AbsoluteFill style={{background: c.bg, overflow: 'hidden'}}>
			{/* ground stripes: tier 2, never under text without a plate */}
			<div style={{position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(${T.ground.stripe.angle}deg, ${hexA(c.ink, T.ground.stripe.alpha)} 0px, ${hexA(c.ink, T.ground.stripe.alpha)}px ${T.ground.stripe.width}px, transparent ${T.ground.stripe.width}px, transparent ${T.ground.stripe.pitch}px)`}} />

			<AbsoluteFill style={{transform: `translate(${-14 * dr}px, ${-10 * dr}px) scale(${scale})`, transformOrigin: '50% 45%'}}>
				{/* title */}
				<div style={{position: 'absolute', ...px(BOXES.title), ...fontCss(pair.display, 108), color: c.ink}}>
					<div style={{opacity: titleIn(2), transform: `translateY(${(1 - titleIn(2)) * 40}px)`}}>Market share,</div>
					<div style={{opacity: titleIn(8), transform: `translateY(${(1 - titleIn(8)) * 40}px)`, color: alert}}>wiped out.</div>
				</div>

				{/* odometer: share */}
				<div style={{position: 'absolute', ...px(BOXES.numeral), display: 'flex', alignItems: 'center', opacity: titleIn(12)}}>
					<Odometer value={share} cols={2} size={200} color={alert} style={{...fontCss(pair.display, 200), ...tnum}} />
					<div style={{...fontCss(pair.display, 100), color: alert, marginLeft: 8, alignSelf: 'center'}}>%</div>
				</div>
				<div style={{position: 'absolute', ...px(BOXES.numLabel), ...fontCss(pair.mono, 34), color: c.ink, opacity: titleIn(14), display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
					<div>INCUMBENT SHARE</div>
					<div style={{color: muted}}>ILLUSTRATIVE DATA</div>
				</div>

				{/* chart card */}
				<div style={{position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, boxSizing: 'border-box', background: c.surface, border: `${T.card.border.width}px solid ${hexA(c.ink, T.card.border.alpha)}`, borderRadius: T.card.radius, opacity: cardIn, transform: `translateY(${(1 - cardIn) * 50}px)`}} />

				<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, opacity: cardIn}}>
					<defs>
						<filter id={`glow${uid}`} filterUnits="userSpaceOnUse" x={CARD.x + 4} y={CARD.y + 4} width={CARD.w - 8} height={CARD.h - 8} colorInterpolationFilters="sRGB">
							<feGaussianBlur in="SourceGraphic" stdDeviation={T.glow.inner} result="inner" />
							<feGaussianBlur in="SourceGraphic" stdDeviation={T.glow.outer} result="outerRaw" />
							<feComponentTransfer in="outerRaw" result="outer">
								<feFuncA type="linear" slope={T.glow.outer_alpha} />
							</feComponentTransfer>
							<feMerge>
								<feMergeNode in="outer" />
								<feMergeNode in="inner" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
						<linearGradient id={`area${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1={PLOT.top} x2="0" y2={PLOT.bottom}>
							<stop offset="0" stopColor={c.primary} stopOpacity={T.area.from_alpha * (0.35 + 0.65 * p)} />
							<stop offset="1" stopColor={c.primary} stopOpacity={0} />
						</linearGradient>
						<clipPath id={`reveal${uid}`}>
							<rect x={PLOT.l - 4} y={CARD.y} width={Math.max(0, head.x - PLOT.l + 4)} height={CARD.h} />
						</clipPath>
					</defs>

					{/* grid: tier 2 */}
					{[0, 25, 50].map((v) => (
						<line key={v} x1={PLOT.l} x2={PLOT.r + 20} y1={yOf(v)} y2={yOf(v)} stroke={hexA(c.ink, v === 0 ? 0.28 : T.ground.grid.alpha)} strokeWidth={T.ground.grid.width} strokeDasharray={v === 0 ? undefined : '10 12'} />
					))}
					{YEARS.map((_, i) => (
						<line key={i} x1={xAt(i)} x2={xAt(i)} y1={PLOT.bottom} y2={PLOT.bottom + 12} stroke={hexA(c.ink, 0.28)} strokeWidth={2} />
					))}

					{/* animated area gradient, clipped to the line head */}
					<path d={AREA_D} fill={`url(#area${uid})`} clipPath={`url(#reveal${uid})`} />

					{/* the line, with the glow chain */}
					{glowOn && (
						<g filter={`url(#glow${uid})`}>
							<path d={LINE_D} fill="none" stroke={c.primary} strokeWidth={T.line.width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={TOTAL} strokeDashoffset={TOTAL * (1 - p)} />
							{!done && <circle cx={head.x} cy={head.y} r={11} fill={c.ink} />}
						</g>
					)}

					{/* leaders and nodes */}
					{CALLOUTS.map((co, k) => {
						const nf = NODE_FRAME[k];
						const nx = xAt(co.i);
						const ny = yOf(DATA[co.i]);
						const pop = f >= nf ? sp(f - nf, SPR.pop) : 0;
						const ring = interpolate(f, [nf, nf + 18], [0, 1], clamp);
						const ring2 = k === CALLOUTS.length - 1 ? interpolate(f, [118, 136], [0, 1], clamp) : 0;
						const b = px(co.box);
						const lx = k === 2 ? nx : b.left + 30;
						const ly = k === 2 ? b.top + b.height : b.top + b.height;
						const ld = interpolate(f, [nf + 3, nf + 12], [0, 1], clamp);
						const dim = calloutDim(k);
						return (
							<g key={k} opacity={dim}>
								{ld > 0 && <line x1={nx} y1={ny} x2={nx + (lx - nx) * ld} y2={ny + (ly - ny) * ld} stroke={alert} strokeWidth={3} strokeLinecap="round" />}
								{pop > 0 && (
									<g filter={`url(#glow${uid})`}>
										<circle cx={nx} cy={ny} r={T.node.radius * Math.min(1.2, pop)} fill={alert} stroke={c.bg} strokeWidth={4} />
										<circle cx={nx} cy={ny} r={T.node.radius + ring * (T.node.ring_radius - T.node.radius)} fill="none" stroke={alert} strokeWidth={T.node.ring_width} opacity={1 - ring} />
										{ring2 > 0 && ring2 < 1 && <circle cx={nx} cy={ny} r={T.node.radius + ring2 * (T.node.ring_radius - T.node.radius)} fill="none" stroke={alert} strokeWidth={T.node.ring_width} opacity={1 - ring2} />}
									</g>
								)}
							</g>
						);
					})}
				</svg>

				{/* axis labels, on the card */}
				<div style={{opacity: cardIn}}>
					{[0, 25, 50].map((v) => (
						<div key={v} style={{position: 'absolute', left: 104, width: 78, top: yOf(v) - 21, textAlign: 'right', ...label}}>{v}%</div>
					))}
					{YEARS.map((y, i) => (
						<div key={y} style={{position: 'absolute', left: xAt(i) - 50, width: 100, top: PLOT.bottom + 22, textAlign: 'center', ...label}}>{y}</div>
					))}
				</div>

				{/* callout label plates: opaque, above the glow, ink text */}
				{CALLOUTS.map((co, k) => {
					const nf = NODE_FRAME[k];
					const pp = f >= nf + 4 ? sp(f - nf - 4, SPR.pop) : 0;
					const b = px(co.box);
					return (
						<div key={k} style={{position: 'absolute', left: b.left, top: b.top, width: b.width, height: b.height, boxSizing: 'border-box', background: c.surface, border: `3px solid ${hexA(alert, calloutDim(k))}`, borderRadius: T.plate.radius, padding: '6px 18px', opacity: Math.min(1, pp * 3), transform: `scale(${(0.9 + 0.1 * Math.min(1.1, pp)) * (k === CALLOUTS.length - 1 ? 1 + 0.05 * focus : 1)})`, transformOrigin: '0% 100%', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
							<div style={{...fontCss(pair.mono, 34), color: c.ink, lineHeight: 1.1, whiteSpace: 'nowrap'}}>{co.label}</div>
							<div style={{...fontCss(pair.accent, 44), textTransform: 'none', color: alert, lineHeight: 1.05, ...tnum}}>{DATA[co.i]}%</div>
						</div>
					);
				})}

				{/* stat cards */}
				{[
					{box: BOXES.statA, name: 'POINTS LOST', node: <Odometer value={lost} cols={2} size={84} color={alert} style={{...fontCss(pair.display, 84), ...tnum}} />, sign: true, at: 100},
					{box: BOXES.statB, name: 'YEAR', node: <Odometer value={yearV} cols={4} size={84} color={c.ink} style={{...fontCss(pair.display, 84), ...tnum}} />, sign: false, at: 108},
				].map((s, k) => {
					const b = px(s.box);
					const sIn = statIn(s.at);
					return (
						<div key={k} style={{position: 'absolute', left: b.left, top: b.top, width: b.width, height: b.height, boxSizing: 'border-box', background: c.surface, border: `${T.card.border.width}px solid ${hexA(c.ink, T.card.border.alpha)}`, borderRadius: T.card.radius, padding: '10px 28px', opacity: Math.min(1, sIn * 3), transform: `translateY(${(1 - Math.min(1, sIn)) * 60}px)`, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
							<div style={{...fontCss(pair.mono, 34), color: muted, lineHeight: 1.1}}>{s.name}</div>
							<div style={{display: 'flex', alignItems: 'center', height: 84}}>
								{s.sign && <div style={{...fontCss(pair.display, 84), color: alert, width: 84 * 0.62}}>{'−'}</div>}
								{s.node}
							</div>
						</div>
					);
				})}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

export const Preview: React.FC<PreviewProps> = ({palette = 'obsidian-cyan', pairing = 'grotesk-inter-jb'}) => {
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	return (
		<FontGate fonts={{...pair, name: pair.id}}>
			<Scene palette={palette} pairing={pairing} />
		</FontGate>
	);
};

/** Three beats side by side: the draw, the middle of the collapse, the finished chart with stat cards. */
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
