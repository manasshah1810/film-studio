import React from 'react';
import {AbsoluteFill, Easing, Freeze, interpolate, spring, useCurrentFrame} from 'remotion';
import ds from '../../../styles/archival-grunge/design-system.json';
import {FontGate} from '../../engine/fonts';
import {fontCss} from '../../engine/tokens';
import type {Pairing} from '../../engine/types';

/**
 * archival-grunge specimen: one 6 s scene, 1080 x 1920 at 30 fps. A torn press clipping about Nokia's 2011 memo on a dark desk.
 * Layers, bottom to top: desk and grain, drop shadow, torn paper (fibre edge, grain, stains, crease), printed type, halftone figure,
 * yellow highlighter sweep, red pen circle, arrow and margin notes, a LEAKED stamp, masking tape, then the film gate on top.
 * Text sits on the paper only. The clipping is a made-up newspaper; the memo facts are marked [CHECK] in the style docs.
 */
export type PreviewProps = {palette?: string; pairing?: string};
export const PREVIEW_FRAMES = 180;
export const SHEET_FRAMES = [28, 104, 168];
const W = 1080;
const H = 1920;
const FPS = 30;
export const SHEET_SIZE = {width: W * SHEET_FRAMES.length, height: H};
const PAPER = ds.paper.clip;
const FLICK_FPS = ds.paper.flicker.fps;

/** Text boxes in percent of the frame. Mirrored 1:1 by the storyboard that check-safezones reads. */
export const BOXES = {
	mast: {x: 9, y: 7.2, w: 76, h: 3},
	head: {x: 9, y: 11.5, w: 76, h: 17.5},
	body: {x: 9, y: 31.5, w: 76, h: 11.6},
	cap: {x: 9, y: 70.6, w: 45, h: 3.4},
	n1: {x: 58, y: 49, w: 27, h: 8},
	n2: {x: 58, y: 58.5, w: 27, h: 11.2},
	stamp: {x: 56, y: 70.8, w: 29, h: 6},
};
const FIG = {x: 97, y: 883, w: 500, h: 423};
const abs = (b: {x: number; y: number; w: number; h: number}) => ({left: (b.x / 100) * W, top: (b.y / 100) * H, width: (b.w / 100) * W, height: (b.h / 100) * H});
/** Same box, but in the paper's own coordinates (the paper group is rotated, so text is placed inside it). */
const rel = (b: {x: number; y: number; w: number; h: number}) => {
	const a = abs(b);
	return {position: 'absolute', left: a.left - PAPER.x, top: a.top - PAPER.y, width: a.width, height: a.height} as React.CSSProperties;
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (n: keyof typeof ds.motion.easings) => Easing.bezier(...(ds.motion.easings[n] as [number, number, number, number]));
const seg = (f: number, a: number, b: number, e: keyof typeof ds.motion.easings = 'draw') => interpolate(f, [a, b], [0, 1], {...clamp, easing: ease(e)});
const hexA = (h: string, a: number) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
const ch = (h: string, i: number) => (parseInt(h.slice(i, i + 2), 16) / 255).toFixed(3);
/** feColorMatrix rows that paint one flat colour and take alpha from the noise. `a` is the alpha row. */
const flat = (h: string, a: string) => `0 0 0 0 ${ch(h, 1)} 0 0 0 0 ${ch(h, 3)} 0 0 0 0 ${ch(h, 5)} ${a}`;
const blend = (a: string, b: string, t: number) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * t + parseInt(b.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('');
const lighten = (h: string, t: number) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(h.slice(i, i + 2), 16) * (1 - t) + 255 * t).toString(16).padStart(2, '0')).join('');
type Roles = Record<string, string>;

/** Focused palettes have 5 roles; the rest are derived. Expanded palettes carry all 10. */
const rolesOf = (id: string): Roles => {
	const p = ds.palettes.find((x) => x.id === id) ?? ds.palettes[0];
	const r: Roles = {...(p.roles as Roles)};
	if (!r.dim) {
		r.dim = blend(r.ink, r.surface, 0.72);
		r.stain = blend(r.ink, r.surface, 0.14);
		r.rule = blend(r.ink, r.surface, 0.45);
		r.shadow = blend(r.bg, r.ink, 0.5);
		r.tape = blend(r.surface, r.bg, 0.9);
	}
	return r;
};

const rnd = (n: number) => {
	const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return s - Math.floor(s);
};

/** Jagged clip-path polygon in px. `inset` pulls the whole edge inwards, `amp` is the largest tear step. */
const tearPoly = (w: number, h: number, seed: number, amp: number, step: number, inset: number) => {
	const pts: string[] = [];
	const push = (x: number, y: number) => pts.push(`${x.toFixed(1)}px ${y.toFixed(1)}px`);
	for (let x = 0; x < w; x += step) push(x, inset + rnd(seed + x * 0.37) * amp);
	for (let y = 0; y < h; y += step * 2.2) push(w - inset - rnd(seed + 7 + y * 0.41) * amp * 0.35, y);
	for (let x = w; x > 0; x -= step) push(x, h - inset - rnd(seed + 13 + x * 0.29) * amp);
	for (let y = h; y > 0; y -= step * 2.2) push(inset + rnd(seed + 19 + y * 0.43) * amp * 0.35, y);
	return `polygon(${pts.join(',')})`;
};
const T = ds.paper.tear;
const FIBRE_POLY = tearPoly(PAPER.w, PAPER.h, 3, T.amp_px * 0.7, T.step_px, 0);
const PAPER_POLY = tearPoly(PAPER.w, PAPER.h, 41, T.amp_px * 0.7, T.step_px, T.fibre_px + 2);
/** The tear that reveals the clipping: a ragged horizontal edge moving down. */
const revealPoly = (p: number) => {
	const r = p * (PAPER.h + 70) - 35;
	const pts = ['0px 0px', `${PAPER.w}px 0px`];
	for (let x = PAPER.w; x >= 0; x -= 22) pts.push(`${x}px ${(r + rnd(x * 0.17 + 5) * 30).toFixed(1)}px`);
	return `polygon(${pts.join(',')})`;
};
const TAPE_POLY = 'polygon(0% 6%, 3% 0%, 7% 9%, 11% 0%, 100% 0%, 97% 12%, 100% 26%, 96% 40%, 100% 55%, 96% 70%, 100% 86%, 97% 100%, 12% 100%, 8% 92%, 4% 100%, 0% 88%, 3% 70%, 0% 50%, 3% 30%)';

/** Pose for stop-motion jitter: a new random offset 12 times a second. */
const jit = (ff: number, seed: number) => {
	const J = ds.paper.jitter;
	return `translate(${((rnd(ff * 3.1 + seed) - 0.5) * 2 * J.px).toFixed(2)}px, ${((rnd(ff * 5.7 + seed + 9) - 0.5) * 2 * J.px).toFixed(2)}px) rotate(${((rnd(ff * 7.3 + seed + 4) - 0.5) * 2 * J.deg).toFixed(2)}deg)`;
};

/** A hand-drawn circle with a tail: spirals out by 12 percent and overshoots its start. */
const circlePath = (cx: number, cy: number, rx: number, ry: number) => {
	const n = 70;
	const pts: string[] = [];
	for (let k = 0; k <= n; k++) {
		const u = k / n;
		const a = -2.4 + u * Math.PI * 2 * 1.12;
		const m = 1 + 0.12 * u + 0.03 * Math.sin(a * 3);
		pts.push(`${k ? 'L' : 'M'} ${(cx + Math.cos(a) * rx * m).toFixed(1)} ${(cy + Math.sin(a) * ry * m).toFixed(1)}`);
	}
	return pts.join(' ');
};

type Part = {t: string; mark?: boolean};
const BODY: Part[][] = [
	[{t: 'In a memo to staff, Nokia CEO'}],
	[{t: 'Stephen Elop said the company'}],
	[{t: 'was '}, {t: 'losing ground to rivals', mark: true}],
	[{t: 'and had to change course now.'}],
];
const BODY_LEN = BODY.flat().reduce((n, p) => n + p.t.length, 0);

/** A highlighter sweep: a polygon that grows left to right with a ragged end, drawn over the type with multiply. */
const markClip = (p: number) => {
	const X = p * 100;
	const e = ds.paper.marker.edge_jitter_px;
	return `polygon(0% 0%, calc(${X}% + ${e * 0.2}px) 0%, calc(${X}% - ${e * 0.5}px) 28%, calc(${X}% + ${e}px) 52%, calc(${X}% - ${e * 0.3}px) 76%, calc(${X}% + ${e * 0.1}px) 100%, 0% 100%)`;
};

const Halftone: React.FC<{c: Roles; f: number}> = ({c, f}) => {
	const HT = ds.tokens.halftone;
	const a = seg(f, 40, 58, 'fade');
	const x0 = FIG.x - PAPER.x;
	const y0 = FIG.y - PAPER.y;
	const flame = 'M 262 250 C 206 198, 238 150, 220 86 C 270 128, 292 98, 282 36 C 346 108, 356 170, 322 206 C 338 226, 322 246, 302 252 Z';
	return (
		<svg width={FIG.w} height={FIG.h} viewBox={`0 0 ${FIG.w} ${FIG.h}`} style={{position: 'absolute', left: x0, top: y0, opacity: a, mixBlendMode: 'multiply'}}>
			<defs>
				<pattern id="ag-dots-s" width={HT.pitch} height={HT.pitch} patternUnits="userSpaceOnUse"><circle cx={HT.pitch / 2} cy={HT.pitch / 2} r={HT.small_r} fill={c.ink} /></pattern>
				<pattern id="ag-dots-b" width={HT.pitch} height={HT.pitch} patternUnits="userSpaceOnUse"><circle cx={HT.pitch / 2} cy={HT.pitch / 2} r={HT.big_r} fill={c.ink} /></pattern>
				<pattern id="ag-dots-r" width={HT.pitch} height={HT.pitch} patternUnits="userSpaceOnUse" patternTransform="rotate(20)"><circle cx={HT.pitch / 2} cy={HT.pitch / 2} r={HT.big_r - 0.4} fill={c.primary} /></pattern>
				<linearGradient id="ag-fade-up" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="black" /><stop offset="1" stopColor="white" /></linearGradient>
				<mask id="ag-m-struct"><g fill="white"><rect x={110} y={250} width={300} height={22} /><rect x={136} y={272} width={16} height={122} /><rect x={254} y={272} width={16} height={122} /><rect x={372} y={272} width={16} height={122} /></g><g stroke="white" strokeWidth={6}><line x1={152} y1={284} x2={254} y2={380} /><line x1={254} y1={284} x2={152} y2={380} /><line x1={270} y1={284} x2={372} y2={380} /><line x1={372} y1={284} x2={270} y2={380} /><path d="M 140 250 L 176 128 L 212 250 M 152 210 L 200 210 M 162 170 L 190 170" fill="none" /></g></mask>
				<mask id="ag-m-flame"><path d={flame} fill="white" /></mask>
				<mask id="ag-m-sea"><path d={`M 0 396 ${Array.from({length: 11}, (_, i) => `Q ${i * 50 + 25} ${i % 2 ? 380 : 410} ${i * 50 + 50} 396`).join(' ')} L ${FIG.w} ${FIG.h} L 0 ${FIG.h} Z`} fill="white" /></mask>
				<mask id="ag-m-sky"><rect width={FIG.w} height={250} fill="url(#ag-fade-up)" opacity={0.55} /></mask>
			</defs>
			<rect width={FIG.w} height={FIG.h} fill="none" stroke={c.rule} strokeWidth={2} />
			<rect width={FIG.w} height={250} fill="url(#ag-dots-s)" mask="url(#ag-m-sky)" />
			<rect width={FIG.w} height={FIG.h} fill="url(#ag-dots-b)" mask="url(#ag-m-struct)" />
			<rect width={FIG.w} height={FIG.h} fill="url(#ag-dots-s)" mask="url(#ag-m-sea)" />
			<rect width={FIG.w} height={FIG.h} fill="url(#ag-dots-r)" mask="url(#ag-m-flame)" />
		</svg>
	);
};

const Scene: React.FC<{palette: string; pairing: string}> = ({palette, pairing}) => {
	const f = useCurrentFrame();
	const c = rolesOf(palette);
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	const ff = Math.floor((f * FLICK_FPS) / FPS);
	const FL = ds.paper.flicker;
	const G = ds.paper.grain;
	const tearP = seg(f, 2, 20, 'tear');
	const tapeP = spring({frame: f - 18, fps: FPS, config: ds.motion.springs.tape});
	const stampP = spring({frame: f - 146, fps: FPS, config: ds.motion.springs.stamp});
	const inA = (start: number, d = 6) => seg(f, start, start + d, 'fade');
	const slam = (start: number) => {
		const p = seg(f, start, start + 5, 'settle');
		return {opacity: p, transform: `${jit(ff, start)} scale(${1.05 - 0.05 * p})`};
	};
	const typed = Math.floor(interpolate(f, [30, 60], [0, BODY_LEN], clamp));
	const markP = seg(f, 74, 98);
	const circleP = seg(f, 58, 74);
	const arrowP = seg(f, 100, 114);
	const n1P = seg(f, 100, 118, 'settle');
	const n2P = seg(f, 120, 140, 'settle');
	const ulP = seg(f, 134, 146);
	const fl = FL.brightness * rnd(ff * 5.3 + 1);
	const wx = (rnd(ff * 2.9 + 3) - 0.5) * 2 * FL.weave_px;
	const wy = (rnd(ff * 4.1 + 8) - 0.5) * 2 * FL.weave_px;
	const text = {color: c.ink, textShadow: `0 0 1.5px ${hexA(c.ink, 0.35)}`} as React.CSSProperties;
	const accent = (s: number) => ({...fontCss(pair.accent, (pair.accent as unknown as {size: number}).size * s), color: c.primary, whiteSpace: 'pre', mixBlendMode: 'multiply'}) as React.CSSProperties;
	const noteClip = (p: number) => ({clipPath: `inset(-10% ${(1 - p) * 130 - 30}% -10% -6%)`});
	const renderPart = (p: Part, start: number, k: string) => {
		const shown = p.t.slice(0, Math.max(0, typed - start));
		const hidden = p.t.slice(shown.length);
		const inner = (
			<>
				<span>{shown}</span>
				<span style={{opacity: 0}}>{hidden}</span>
			</>
		);
		if (!p.mark) return <span key={k}>{inner}</span>;
		return (
			<span key={k} style={{position: 'relative', display: 'inline-block'}}>
				{inner}
				<span style={{position: 'absolute', left: -8, right: -8, top: 7, bottom: 2, background: c.highlight, mixBlendMode: 'multiply', clipPath: markClip(markP), transform: 'skewX(-4deg)'}} />
			</span>
		);
	};
	let started = 0;
	const bodyLines = BODY.map((line, li) => (
		<div key={li} style={{whiteSpace: 'pre'}}>
			{line.map((p, pi) => {
				const el = renderPart(p, started, `${li}-${pi}`);
				started += p.t.length;
				return el;
			})}
		</div>
	));
	const head = ["NOKIA'S", 'BURNING', 'PLATFORM'];
	const dust = Array.from({length: FL.specks}, (_, i) => ({x: rnd(ff * 9.1 + i * 3.7) * W, y: rnd(ff * 6.3 + i * 5.9) * H, r: 1 + rnd(ff + i * 2.2) * 2.6, dark: rnd(i * 1.9 + ff) > 0.5}));
	const scratch = rnd(ff * 3.3 + 2) < 0.35;
	const stampStyle: React.CSSProperties = {
		...fontCss(pair.display, 56),
		color: c.primary,
		border: `5px solid ${c.primary}`,
		padding: '4px 18px',
		letterSpacing: '0.1em',
		display: 'inline-block',
		whiteSpace: 'nowrap',
		mixBlendMode: 'multiply',
		filter: 'url(#ag-rough)',
		opacity: Math.min(1, stampP * 3) * 0.92,
		transform: `rotate(-9deg) scale(${1 + 0.7 * (1 - Math.min(1.05, stampP))}) ${jit(ff, 77)}`,
	};
	return (
		<AbsoluteFill style={{background: c.bg, overflow: 'hidden'}}>
			{/* desk: boiling grain, vignette */}
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<filter colorInterpolationFilters="sRGB" id="ag-desk" x="0" y="0" width="100%" height="100%">
					<feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed={ff % 24} />
					<feColorMatrix type="matrix" values={flat(c.surface, '1.1 1.1 1.1 0 -1.55')} />
				</filter>
				<rect width={W} height={H} filter="url(#ag-desk)" opacity={0.1} />
			</svg>

			<div style={{position: 'absolute', inset: 0, transform: `translate(${wx}px, ${wy}px)`}}>
				{/* the clipping: shadow, then tear reveal, fibre edge, paper */}
				<div style={{position: 'absolute', left: PAPER.x, top: PAPER.y, width: PAPER.w, height: PAPER.h, transform: `rotate(${PAPER.rotate_deg}deg)`, filter: `drop-shadow(0 ${ds.tokens.shadow.y}px ${ds.tokens.shadow.blur}px ${hexA(c.shadow, ds.tokens.shadow.alpha)})`}}>
					<div style={{position: 'absolute', inset: 0, clipPath: revealPoly(tearP)}}>
						<div style={{position: 'absolute', inset: 0, background: lighten(c.surface, 0.4), clipPath: FIBRE_POLY}} />
						<div style={{position: 'absolute', inset: 0, background: c.surface, clipPath: PAPER_POLY, overflow: 'hidden'}}>
							{/* paper texture: fine grain in ink, blotches in stain, burnt edge, one fold */}
							<svg width={PAPER.w} height={PAPER.h} style={{position: 'absolute', inset: 0}}>
								<filter colorInterpolationFilters="sRGB" id="ag-grain" x="0" y="0" width="100%" height="100%">
									<feTurbulence type="fractalNoise" baseFrequency={G.freq} numOctaves={G.octaves} seed={4} />
									<feColorMatrix type="matrix" values={flat(c.ink, '1.2 1.2 1.2 0 -1.55')} />
								</filter>
								<filter colorInterpolationFilters="sRGB" id="ag-blot" x="0" y="0" width="100%" height="100%">
									<feTurbulence type="fractalNoise" baseFrequency={G.blotch_freq} numOctaves={3} seed={9} />
									<feColorMatrix type="matrix" values={flat(c.stain, '2.6 0 0 0 -0.85')} />
								</filter>
								<rect width={PAPER.w} height={PAPER.h} filter="url(#ag-blot)" opacity={G.blotch_opacity} />
								<rect width={PAPER.w} height={PAPER.h} filter="url(#ag-grain)" opacity={G.opacity} />
							</svg>
							<div style={{position: 'absolute', inset: 0, boxShadow: `inset 0 0 90px 12px ${hexA(c.stain, 0.85)}`}} />
							<div style={{position: 'absolute', left: 0, right: 0, top: PAPER.h * 0.52, height: 26, background: `linear-gradient(180deg, ${hexA(c.shadow, 0)}, ${hexA(c.shadow, 0.13)} 46%, ${hexA(lighten(c.surface, 0.6), 0.28)} 54%, ${hexA(c.shadow, 0)})`}} />

							{/* masthead and the two rules */}
							<div style={{...rel(BOXES.mast), ...fontCss(pair.mono, 34), ...text, whiteSpace: 'nowrap', opacity: inA(14)}}>THE DAILY LEDGER / 9 FEB 2011</div>
							<div style={{position: 'absolute', left: abs(BOXES.mast).left - PAPER.x, width: abs(BOXES.mast).width, top: abs(BOXES.mast).top - PAPER.y + 58, height: ds.tokens.rule.thick, background: c.ink, opacity: inA(14), transformOrigin: 'left', transform: `scaleX(${seg(f, 14, 30)})`}} />
							<div style={{position: 'absolute', left: abs(BOXES.mast).left - PAPER.x, width: abs(BOXES.mast).width, top: abs(BOXES.mast).top - PAPER.y + 68, height: ds.tokens.rule.thin, background: c.ink, opacity: inA(14), transformOrigin: 'left', transform: `scaleX(${seg(f, 18, 34)})`}} />

							{/* headline, one slam per line, jittered at 12 fps */}
							<div style={{...rel(BOXES.head), ...fontCss(pair.display, 108), ...text}}>
								{head.map((ln, i) => (
									<div key={ln} style={{whiteSpace: 'nowrap', transformOrigin: 'left center', ...slam(14 + i * 6)}}>
										{i === 1 ? (
											<span style={{position: 'relative', display: 'inline-block'}}>
												{ln}
												<svg viewBox="0 0 700 160" preserveAspectRatio="none" style={{position: 'absolute', left: '-9%', top: '-22%', width: '118%', height: '148%', overflow: 'visible', mixBlendMode: 'multiply'}}>
													<path d={circlePath(350, 82, 335, 60)} fill="none" stroke={c.primary} strokeWidth={ds.paper.pen.stroke} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - circleP} />
												</svg>
											</span>
										) : (
											ln
										)}
									</div>
								))}
							</div>

							{/* body: typewriter, types itself, then the marker sweeps line 3 */}
							<div style={{...rel(BOXES.body), ...fontCss(pair.body, 44), ...text}}>{bodyLines}</div>

							{/* halftone figure and its caption */}
							<Halftone c={c} f={f} />
							<div style={{...rel(BOXES.cap), ...fontCss(pair.mono, 34), ...text, whiteSpace: 'nowrap', opacity: inA(56)}}>FIG. 1 / THE MEMO, 2011</div>

							{/* red pen: arrow, two margin notes, underline */}
							<svg width={PAPER.w} height={PAPER.h} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', overflow: 'visible'}}>
								<g fill="none" stroke={c.primary} strokeWidth={ds.paper.pen.stroke} strokeLinecap="round" strokeLinejoin="round">
									<path d="M 706 858 C 836 858, 861 728, 801 665" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - arrowP} />
									<path d="M 801 665 L 811 691 M 801 665 L 829 670" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - seg(f, 112, 118)} />
								</g>
							</svg>
							<div style={{...rel(BOXES.n1), ...accent(1), ...noteClip(n1P), transform: `rotate(-3deg) ${jit(ff, 21)}`, transformOrigin: 'left top'}}>{'WHO WAS\nTHIS FOR?'}</div>
							<div style={{...rel(BOXES.n2), ...accent(1), ...noteClip(n2P), transform: `rotate(2deg) ${jit(ff, 33)}`, transformOrigin: 'left top'}}>
								{'SAME WEEK:\n'}
								<span style={{position: 'relative', display: 'inline-block'}}>
									MICROSOFT
									<svg viewBox="0 0 230 14" preserveAspectRatio="none" style={{position: 'absolute', left: 0, bottom: -6, width: '100%', height: 14, overflow: 'visible'}}>
										<path d="M 0 8 C 46 3, 92 12, 142 6 S 212 8, 230 4" fill="none" stroke={c.primary} strokeWidth={ds.paper.pen.stroke} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ulP} />
									</svg>
								</span>
								{'\nDEAL'}
							</div>

							{/* stamp */}
							<div style={{...rel(BOXES.stamp), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
								<span style={stampStyle}>LEAKED</span>
							</div>
						</div>
					</div>
					{/* two pieces of masking tape, slapped on after the tear */}
					{[
						{l: -52, t: -10, r: -36, k: 1},
						{l: PAPER.w - 150, t: -14, r: 38, k: 2},
					].map((tp) => (
						<div key={tp.k} style={{position: 'absolute', left: tp.l, top: tp.t, width: ds.tokens.tape.w, height: ds.tokens.tape.h, background: hexA(c.tape, ds.tokens.tape.alpha), clipPath: TAPE_POLY, transform: `rotate(${tp.r}deg) scale(${1 + 0.35 * (1 - Math.min(1.05, tapeP))})`, opacity: Math.min(1, tapeP * 2), mixBlendMode: 'multiply'}} />
					))}
				</div>
			</div>

			{/* film look on top of everything: flicker, vignette, dust, one scratch */}
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter colorInterpolationFilters="sRGB" id="ag-rough" x="-5%" y="-10%" width="110%" height="120%">
					<feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed={7} result="n" />
					<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -6 0 0 0 4.1" result="m" />
					<feComposite in="SourceGraphic" in2="m" operator="in" />
				</filter>
			</svg>
			<div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.5) 100%)`, pointerEvents: 'none'}} />
			<div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${fl.toFixed(3)})`, pointerEvents: 'none'}} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
				{dust.map((d, i) => (
					<circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.dark ? 'rgba(0,0,0,0.5)' : hexA(lighten(c.surface, 0.5), 0.55)} />
				))}
				{scratch && <line x1={rnd(ff * 8.7 + 6) * W} y1={0} x2={rnd(ff * 8.7 + 6) * W + 3} y2={H * (0.4 + 0.6 * rnd(ff + 4))} stroke={hexA(lighten(c.surface, 0.6), FL.scratch_alpha)} strokeWidth={1.5} />}
			</svg>
		</AbsoluteFill>
	);
};

export const Preview: React.FC<PreviewProps> = ({palette = 'newsprint', pairing = 'playfair-specialelite-reenie'}) => {
	const pair = (ds.fonts.find((x) => x.id === pairing) ?? ds.fonts[0]) as unknown as Pairing;
	return (
		<FontGate fonts={{...pair, name: pair.id}}>
			<Scene palette={palette} pairing={pairing} />
		</FontGate>
	);
};

/** Three beats side by side: tear and type, marker and first note, final frame with the stamp. */
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
