import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Kit, Role, Zone} from '../../engine/types';
import {abs, clamp01, fontCss, lum, mix, rgba, rnd, rr, useColor, useD} from '../../engine/tokens';
import {TextLines, useFit} from '../../engine/text';
import {Grain, VectorMarks} from '../../engine/marks';
import {smoothD, wobble} from '../../engine/shapes';
import {chartGeo, fmt} from '../../engine/chart';

const useTx = () => useD().design.system.textures as Record<string, number>;
const useDark = () => {
	const c = useColor();
	return {dark: lum(c('bg')) < 0.25, darkest: lum(c('ink')) < lum(c('bg')) ? c('ink') : c('bg'), lightest: lum(c('ink')) < lum(c('bg')) ? c('bg') : c('ink')};
};
/** A hand-drawn line through points: resampled, wobbled, smoothed. */
const rough = (pts: number[][], amp: number, seed: string, closed = false) => smoothD(wobble(pts, amp, seed, closed, 60), closed);
const draw = (p: number) => ({pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - clamp01(p)});

const Backdrop: Kit['Backdrop'] = ({panel}) => {
	const {design, W, H, u} = useD();
	const c = useColor(), tx = useTx(), {dark} = useDark();
	const sd = `${design.seed}-${panel.id}`;
	const edge = u * 1.3;
	return (
		<AbsoluteFill style={{background: c('bg')}}>
			{/* ghost of the last lesson: erased strokes and a smear */}
			<svg width={W} height={H} style={{position: 'absolute', filter: `blur(${tx.ghost_blur_px}px)`, opacity: tx.ghost_opacity * (dark ? 1.6 : 1)}}>
				{[0, 1, 2, 3, 4].map((i) => {
					const x = rr(sd + 'gx' + i, 0.08, 0.8) * W, y = rr(sd + 'gy' + i, 0.1, 0.86) * H, w = rr(sd + 'gw' + i, 0.1, 0.3) * W;
					return <path key={i} d={rough([[x, y], [x + w * 0.5, y + rr(sd + 'gb' + i, -30, 30)], [x + w, y + rr(sd + 'gc' + i, -14, 14)]], 6, sd + 'g' + i)} fill="none" stroke={c('ink')} strokeWidth={u * rr(sd + 'gs' + i, 0.5, 1.5)} strokeLinecap="round" />;
				})}
				<ellipse cx={rr(sd + 'sx', 0.3, 0.7) * W} cy={rr(sd + 'sy', 0.3, 0.7) * H} rx={W * 0.3} ry={H * 0.07} fill={c('ink')} opacity={0.35} transform={`rotate(${rr(sd + 'sr', -18, 18)} ${W / 2} ${H / 2})`} />
			</svg>
			<Grain id={`wb-g-${panel.id}`} freq={tx.grain_freq} opacity={tx.grain_opacity} blend={dark ? 'screen' : 'multiply'} />
			{/* board edge */}
			<div style={{position: 'absolute', inset: 0, boxShadow: `inset 0 0 0 ${edge}px ${c('shadow')}, inset 0 0 ${u * 5}px ${edge}px ${rgba(c('shadow'), 0.55)}`}} />
		</AbsoluteFill>
	);
};

const Finish: Kit['Finish'] = () => {
	const tx = useTx(), {dark, lightest} = useDark();
	if (dark) return null;
	return <AbsoluteFill style={{background: `linear-gradient(112deg, transparent 38%, ${rgba(lightest, tx.glare_opacity * 9)} 47%, transparent 55%)`, mixBlendMode: 'soft-light', pointerEvents: 'none'}} />;
};

const Headline: Kit['Headline'] = ({zone, p, text, emphasis, level, align, seed}) => {
	const {u} = useD();
	const c = useColor(), tx = useTx(), {dark, darkest} = useDark();
	const {fit, f} = useFit(text, 'display', zone, level);
	const n = fit.lines.length;
	const hp = clamp01((p - 0.75) / 0.25);
	const last = fit.lines[n - 1];
	const uw = Math.min(zone.w, fit.width * 0.5);
	return (
		<>
			<TextLines fit={fit} f={f} zone={zone} color="ink" align={align} valign="top" emphasis={emphasis}
				lineStyle={(li) => ({clipPath: `inset(-20% ${100 - clamp01(p * n - li) * 104}% -20% -4%)`, isolation: 'isolate'})}
				word={(w, em) => em ? (
					<span style={{position: 'relative', display: 'inline-block', color: darkest}}>
						<span style={{position: 'absolute', left: '-6%', top: '20%', height: '62%', width: `${(100 + tx.highlighter_bleed * 100 + 12) * hp}%`, background: c('highlight'), transform: `skewX(-12deg) rotate(${tx.highlighter_skew_deg}deg)`, zIndex: -1, borderRadius: u * 0.4, opacity: dark ? 0.92 : 1}} />
						{w}
					</span>
				) : w}
			/>
			{last && level !== 'h2' ? (
				<svg style={{position: 'absolute', left: align === 'right' ? zone.x + zone.w - uw : zone.x, top: zone.y + n * fit.lineH + u * 0.2, overflow: 'visible'}} width={uw} height={u * 3}>
					<path d={rough([[0, u * 1.2], [uw * 0.5, u * 0.5], [uw, u * 1.4]], u * 0.3, seed + 'u')} fill="none" stroke={c('primary')} strokeWidth={u * 0.55} strokeLinecap="round" {...draw((p - 0.6) / 0.4)} />
				</svg>
			) : null}
		</>
	);
};

const Label: Kit['Label'] = ({zone, p, text, kind, align, accent, seed}) => {
	const {u} = useD();
	const c = useColor();
	const role = kind === 'kicker' || kind === 'attrib' ? 'accent' : 'body';
	const arrow = kind === 'kicker' ? u * 5 : 0;
	const z = {...zone, x: zone.x + (align === 'right' ? 0 : arrow), w: zone.w - arrow};
	const {fit, f} = useFit(kind === 'attrib' ? `- ${text}` : text, role, z, kind === 'kicker' || kind === 'label' ? 'label' : 'body', kind === 'body' ? 4 : 3);
	const color: Role = kind === 'kicker' ? 'secondary' : kind === 'label' && accent !== 'ink' ? 'ink' : accent === 'ink' || kind === 'sub' || kind === 'attrib' ? 'ink' : accent ?? 'ink';
	return (
		<>
			{kind === 'kicker' && align !== 'right' ? (
				<svg style={{position: 'absolute', left: zone.x, top: zone.y + fit.lineH * 0.22, overflow: 'visible'}} width={arrow} height={fit.lineH}>
					<path d={rough([[0, fit.size * 0.42], [arrow * 0.66, fit.size * 0.4]], 0.6, seed) + `M${arrow * 0.42} ${fit.size * 0.16}L${arrow * 0.7} ${fit.size * 0.4}L${arrow * 0.44} ${fit.size * 0.66}`} fill="none" stroke={c('secondary')} strokeWidth={u * 0.42} strokeLinecap="round" strokeLinejoin="round" {...draw(p * 1.5)} />
				</svg>
			) : null}
			<TextLines fit={fit} f={f} zone={z} color={color} align={align} valign={kind === 'label' && align === 'center' ? 'middle' : 'top'} lineStyle={(li) => ({clipPath: `inset(-20% ${100 - clamp01(p * fit.lines.length - li) * 104}% -20% -4%)`})} />
		</>
	);
};

const Numeral: Kit['Numeral'] = ({zone, p, value, unit, align, accent, seed}) => {
	const {u, design} = useD();
	const c = useColor();
	const {fit, f} = useFit(value, 'display', {...zone, w: zone.w * (unit ? 0.62 : 0.7), h: zone.h * 0.8}, 'numeral', 1);
	const w = fit.width, h = fit.size;
	const x = align === 'right' ? zone.x + zone.w - w - u * 3 : align === 'center' ? zone.x + (zone.w - w) / 2 : zone.x + u * 2.5;
	const y = zone.y + (zone.h - fit.lineH) / 2;
	const big = zone.h > u * 16;
	const cx = w / 2, cy = fit.lineH / 2, rx = w * 0.62 + u * 2, ry = h * 0.62;
	const loop = (k: number, s: string) => Array.from({length: 13}, (_, i) => { const a = ((i / 12) * 2.1 - 0.62) * Math.PI; return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]; }).map(([px, py], i) => [px + (rnd(seed + s + i) - 0.5) * u, py + (rnd(seed + s + 'y' + i) - 0.5) * u]);
	return (
		<div style={{position: 'absolute', left: x, top: y, width: w, height: fit.lineH}}>
			<div style={{...fontCss({...f, case: 'none'}, fit.size), color: c(accent === 'ink' ? 'ink' : accent ?? 'primary'), whiteSpace: 'nowrap', clipPath: `inset(-20% ${100 - clamp01(p * 1.4) * 104}% -20% -4%)`}}>{fit.lines[0]}</div>
			{unit ? <div style={{position: 'absolute', left: w + u * 1.2, bottom: fit.lineH * 0.16, ...fontCss(design.fonts.accent, fit.size * 0.34), color: c('ink'), whiteSpace: 'nowrap', opacity: clamp01(p * 3 - 1.4)}}>{unit}</div> : null}
			{big ? (
				<svg width={w} height={fit.lineH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', transform: 'rotate(-4deg)'}}>
					<path d={smoothD([...loop(1, 'a'), ...loop(1.05, 'b').slice(1, 9)], false)} fill="none" stroke={c('secondary')} strokeWidth={u * 0.62} strokeLinecap="round" {...draw((p - 0.55) / 0.45)} />
				</svg>
			) : null}
		</div>
	);
};

const Marks: Kit['Marks'] = ({zone, p, shapes, vb, flip, kind, seed, state}) => {
	const tx = useTx();
	const s = kind === 'figure' ? 1 : 0.82;
	return <VectorMarks shapes={shapes} vb={vb} zone={zone} p={p} seed={seed} flip={flip} kind={kind} dim={state === 'dim'} opts={{outline: 'ink', outlineAll: true, sw: tx.marker_width * s, wobble: tx.wobble, passes: tx.double_stroke ? 2 : 1, fill: 'hatch', hatch: {gap: tx.hatch_gap, w: tx.hatch_width, angle: tx.hatch_angle}, enter: 'draw'}} />;
};

const Chart: Kit['Chart'] = ({zone, p, chart, seed, accent}) => {
	const {u, design} = useD();
	const c = useColor();
	const g = chartGeo(chart, zone, [0.1, 0.16, 0.14, 0.06]);
	const roles: Role[] = [accent ?? 'primary', 'secondary', 'ink'];
	const ax = rough([[g.plot.x, g.plot.y - u * 2], [g.plot.x, g.base], [g.plot.x + g.plot.w + u * 3, g.base]], u * 0.25, seed + 'ax');
	const lab = fontCss(design.fonts.body, u * 3.1);
	return (
		<div style={abs(zone)}>
			<svg width={zone.w} height={zone.h} style={{overflow: 'visible'}}>
				<path d={ax} fill="none" stroke={c('ink')} strokeWidth={u * 0.5} strokeLinecap="round" strokeLinejoin="round" {...draw(p * 2.4)} />
				{chart.type === 'bar'
					? g.bars.map((b, i) => (
							<g key={i} opacity={clamp01(p * 3 - 0.6 - b.i * 0.25)}>
								<path d={rough([[b.x, g.base], [b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, g.base]], u * 0.2, seed + 'b' + i)} fill={rgba(c(chart.series[b.si].role ?? roles[b.si % 3]), 0.28)} stroke={c(chart.series[b.si].role ?? roles[b.si % 3])} strokeWidth={u * 0.55} strokeLinejoin="round" />
							</g>
						))
					: g.lines.map((pts, si) => (
							<path key={si} d={rough(pts, u * 0.22, seed + 'l' + si)} fill="none" stroke={c(chart.series[si].role ?? roles[si % 3])} strokeWidth={u * (si === 0 ? 0.95 : 0.6)} strokeLinecap="round" {...draw((p - 0.25 - si * 0.12) / 0.6)} />
						))}
				{chart.annot ? (() => {
					const pt = g.lines[chart.annot.series ?? 0][chart.annot.at];
					return <circle cx={pt[0]} cy={pt[1]} r={u * 1.7} fill="none" stroke={c('ink')} strokeWidth={u * 0.4} opacity={clamp01(p * 4 - 3)} />;
				})() : null}
			</svg>
			{chart.x.map((x, i) => (i === 0 || i === chart.x.length - 1 || chart.type === 'bar' || chart.x.length <= 5 ? <div key={i} style={{position: 'absolute', left: g.xs[i] - u * 8, width: u * 16, textAlign: 'center', top: g.base + u * 1, ...lab, color: c('ink'), opacity: clamp01(p * 3 - 0.5)}}>{x}</div> : null))}
			{chart.type !== 'bar' ? g.lines.map((pts, si) => {
				const e = pts[pts.length - 1];
				return <div key={si} style={{position: 'absolute', left: e[0] + u * 1.2, top: e[1] - u * 2.4, ...fontCss(design.fonts.accent, u * 3.4), color: c(chart.series[si].role ?? roles[si % 3]), whiteSpace: 'nowrap', opacity: clamp01(p * 4 - 2.6 - si * 0.3)}}>{chart.series[si].name}</div>;
			}) : g.bars.map((b, i) => <div key={i} style={{position: 'absolute', left: b.x - u * 4, width: b.w + u * 8, textAlign: 'center', top: b.y - u * 4.6, ...fontCss(design.fonts.accent, u * 3.4), color: c('ink'), opacity: clamp01(p * 3 - 1.2 - b.i * 0.25)}}>{fmt(b.v, chart.unit)}</div>)}
			{chart.annot ? (() => {
				const pt = g.lines[chart.annot.series ?? 0]?.[chart.annot.at] ?? [g.bars[chart.annot.at].x, g.bars[chart.annot.at].y];
				return <div style={{position: 'absolute', left: Math.min(pt[0] + u * 2.4, zone.w - u * 30), top: pt[1] - u * 8.4, ...fontCss(design.fonts.accent, u * 3.6), color: c('ink'), whiteSpace: 'nowrap', opacity: clamp01(p * 4 - 3), transform: 'rotate(-3deg)'}}>{chart.annot.text}</div>;
			})() : null}
		</div>
	);
};

/** Because-arrow: one curved marker arrow from the text block to the drawing. */
const Decor: Kit['Decor'] = ({panel, zones, p}) => {
	const {u, W, H, design} = useD();
	const c = useColor();
	const from = zones.headline ?? zones.numeral, to = zones.visual;
	if (!from || !to || panel.layout === 'versus' || H > W) return null; // only where text and drawing sit side by side
	const sd = `${design.seed}-${panel.id}-arrow`;
	const portrait = H > W;
	const a = portrait ? [from.x + from.w * 0.16, from.y + from.h + u * 3] : [from.x + from.w * 0.5, from.y + from.h + u * 4];
	const b = portrait ? [to.x + to.w * 0.3, to.y + to.h * 0.2] : [to.x + u * 2, to.y + to.h * 0.56];
	if (Math.hypot(b[0] - a[0], b[1] - a[1]) < u * 14) return null;
	const mid = [(a[0] + b[0]) / 2 - (b[1] - a[1]) * 0.18, (a[1] + b[1]) / 2 + (b[0] - a[0]) * 0.18];
	const ang = Math.atan2(b[1] - mid[1], b[0] - mid[0]);
	const hd = (d: number) => [b[0] - Math.cos(ang + d) * u * 3, b[1] - Math.sin(ang + d) * u * 3];
	return (
		<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
			<path d={rough([a, mid, b], u * 0.3, sd)} fill="none" stroke={c('secondary')} strokeWidth={u * 0.5} strokeLinecap="round" {...draw((p - 0.3) * 1.6)} />
			<path d={`M${hd(0.5)[0]} ${hd(0.5)[1]}L${b[0]} ${b[1]}L${hd(-0.5)[0]} ${hd(-0.5)[1]}`} fill="none" stroke={c('secondary')} strokeWidth={u * 0.5} strokeLinecap="round" strokeLinejoin="round" opacity={clamp01(p * 6 - 5)} />
		</svg>
	);
};

const Bubble: Kit['Bubble'] = ({zone, p, text, tail, seed}) => {
	const {u} = useD();
	const c = useColor();
	const z: Zone = {x: zone.x + u * 2, y: zone.y + u * 2, w: zone.w - u * 4, h: zone.h * 0.6};
	const {fit, f} = useFit(text, 'body', {...z, x: z.x + u * 2, w: z.w - u * 4, h: z.h - u * 3}, 'body', 3);
	const bw = fit.width + u * 5, bh = fit.lines.length * fit.lineH + u * 3.4;
	const tx = tail === 'left' ? bw * 0.24 : bw * 0.76;
	return (
		<div style={{position: 'absolute', left: z.x, top: z.y, opacity: clamp01(p * 3)}}>
			<svg width={bw} height={bh + u * 5} style={{position: 'absolute', overflow: 'visible'}}>
				<path d={rough([[u, u], [bw - u, 0], [bw, bh - u], [tx + u * 3, bh], [tx + (tail === 'left' ? -u * 2 : u * 2), bh + u * 4.4], [tx - u, bh], [0, bh - u]], u * 0.3, seed, true)} fill={mix(c('bg'), c('highlight'), 0.16)} stroke={c('ink')} strokeWidth={u * 0.5} strokeLinejoin="round" />
			</svg>
			<TextLines fit={fit} f={f} zone={{x: u * 2.5, y: u * 1.5, w: fit.width, h: bh}} color="ink" />
		</div>
	);
};

export const kit: Kit = {Backdrop, Headline, Label, Numeral, Marks, Chart, Decor, Finish, Bubble};
