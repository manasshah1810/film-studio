import React from 'react';
import type {Kit, Role, Zone} from './types';
import {abs, clamp01, contrast, fontCss, rgba, useColor, useD} from './tokens';
import {TextLines, useFit, type Fit} from './text';
import {chartGeo, fmt} from './chart';
import {ptsToD, smoothD, wobble} from './shapes';

/**
 * Kit building blocks. A style kit is its own Backdrop / Decor / Finish plus these factories set to
 * the style's rules. Nothing here picks a colour or font by itself: all come from the locked design.
 */
type C = (r: Role) => string;
type FontKey = 'display' | 'body' | 'accent' | 'mono';
export type Enter = 'wipe' | 'rise' | 'drop' | 'slam' | 'type' | 'fade' | 'cut';
type X = {fit: Fit; zone: Zone; p: number; align?: string; seed: string; u: number; c: C; accent?: Role; left: number};

/** The palette colour (ink or bg) that reads best on top of `hex`. */
export const useOn = () => {
	const c = useColor();
	return (hex: string) => (contrast(c('ink'), hex) >= contrast(c('bg'), hex) ? c('ink') : c('bg'));
};
export const lineEnter = (enter: Enter, lp: number, chars = 12): React.CSSProperties =>
	enter === 'wipe' ? {clipPath: `inset(-25% ${100 - lp * 104}% -25% -4%)`}
	: enter === 'type' ? {clipPath: `inset(-25% ${100 - (Math.ceil(lp * chars) / chars) * 104}% -25% -4%)`}
	: enter === 'rise' ? {transform: `translateY(${(1 - lp) * 60}%)`, opacity: clamp01(lp * 2.5)}
	: enter === 'drop' ? {transform: `translateY(${(1 - lp) * -70}%)`, opacity: clamp01(lp * 2.5)}
	: enter === 'slam' ? {transform: `scale(${1 + (1 - lp) * 0.5})`, transformOrigin: '20% 50%', opacity: clamp01(lp * 3)}
	: enter === 'cut' ? {opacity: lp > 0.02 ? 1 : 0}
	: {opacity: lp};
const leftOf = (zone: Zone, w: number, align?: string) => (align === 'right' ? zone.x + zone.w - w : align === 'center' ? zone.x + (zone.w - w) / 2 : zone.x);
export const drawn = (p: number) => ({pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - clamp01(p)});

export type HeadOpts = {
	enter?: Enter; font?: FontKey; color?: Role;
	/** how the emphasis word is marked */
	em?: 'color' | 'box' | 'underline' | 'none'; emRole?: Role;
	css?: (x: {c: C; u: number; size: number; level: string}) => React.CSSProperties;
	before?: (x: X & {level: string}) => React.ReactNode;
	after?: (x: X & {level: string}) => React.ReactNode;
};
export const makeHeadline = (o: HeadOpts = {}): Kit['Headline'] => ({zone, p, text, emphasis, level, align, accent, seed}) => {
	const {u} = useD();
	const c = useColor(), on = useOn();
	const {fit, f} = useFit(text, o.font ?? 'display', zone, level);
	const n = fit.lines.length;
	const er = c(o.emRole ?? accent ?? 'primary');
	const hp = clamp01((p - 0.55) / 0.45);
	const x = {fit, zone, p, align, seed, u, c, accent, level, left: leftOf(zone, fit.width, align)};
	const pad = fit.size * 0.13;
	return (
		<>
			{o.before?.(x)}
			<TextLines fit={fit} f={f} zone={zone} color={o.color ?? 'ink'} align={align as any} emphasis={emphasis} style={o.css?.({c, u, size: fit.size, level})}
				lineStyle={(li) => lineEnter(o.enter ?? 'wipe', clamp01(p * n - li), fit.lines[li].length)}
				word={(w, em) => !em || o.em === 'none' ? w
					: o.em === 'box' ? <span style={{display: 'inline-block', lineHeight: 1.04, padding: `0 ${pad}px`, margin: `0 ${-pad}px`, backgroundImage: `linear-gradient(${er},${er})`, backgroundRepeat: 'no-repeat', backgroundSize: `${hp * 100}% 100%`, color: hp > 0.5 ? on(er) : undefined, textShadow: 'none'}}>{w}</span>
					: o.em === 'underline' ? <span style={{backgroundImage: `linear-gradient(${er},${er})`, backgroundRepeat: 'no-repeat', backgroundSize: `${hp * 100}% 13%`, backgroundPosition: '0 94%'}}>{w}</span>
					: <span style={{color: er}}>{w}</span>}
			/>
			{o.after?.(x)}
		</>
	);
};

export type LabelOpts = {
	enter?: Enter; color?: Role; kicker?: 'none' | 'bar' | 'pill' | 'dot' | 'rule' | 'slash'; kickerRole?: Role; kickerFont?: FontKey; pillR?: number;
	attrib?: string; bodyFont?: FontKey; css?: (x: {c: C; u: number; size: number; kind: string}) => React.CSSProperties;
};
export const makeLabel = (o: LabelOpts = {}): Kit['Label'] => ({zone, p, text, kind, align, accent}) => {
	const {u} = useD();
	const c = useColor(), on = useOn();
	const isK = kind === 'kicker';
	const deco = isK ? o.kicker ?? 'none' : 'none';
	const padL = deco === 'slash' ? u * 5 : deco === 'bar' || deco === 'dot' ? u * 3.2 : deco === 'pill' ? u * 1.8 : 0;
	const z = {...zone, x: zone.x + (align === 'right' ? 0 : align === 'center' ? padL / 2 : padL), w: zone.w - padL - (deco === 'pill' ? u * 1.8 : 0)};
	const {fit, f} = useFit(kind === 'attrib' ? (o.attrib ?? '- ') + text : text, isK || kind === 'attrib' ? o.kickerFont ?? 'accent' : o.bodyFont ?? 'body', z, isK || kind === 'label' || kind === 'attrib' ? 'label' : 'body', kind === 'body' ? 4 : 3);
	const kr = c(o.kickerRole ?? accent ?? 'primary');
	const left = leftOf(z, fit.width, align);
	const h = fit.lineH * fit.lines.length;
	const op = clamp01(p * 2);
	const color = isK ? (deco === 'pill' ? on(kr) : kr) : c(accent && accent !== 'primary' && kind === 'body' ? accent : o.color ?? 'ink');
	return (
		<>
			{deco === 'pill' ? <div style={{position: 'absolute', left: left - u * 1.8, top: zone.y - fit.size * 0.08, width: (fit.width + u * 3.6) * clamp01(p * 1.6), height: h + fit.size * 0.1, background: kr, borderRadius: o.pillR ?? 999}} /> : null}
			{deco === 'bar' ? <div style={{position: 'absolute', left: left - padL, top: zone.y + h * 0.1, width: u * 0.9, height: h * 0.76 * op, background: kr}} /> : null}
			{deco === 'dot' ? <div style={{position: 'absolute', left: left - padL, top: zone.y + h / 2 - u * 0.9, width: u * 1.8, height: u * 1.8, borderRadius: 99, background: kr, transform: `scale(${op})`}} /> : null}
			{deco === 'slash' ? <div style={{position: 'absolute', left: left - padL, top: zone.y, ...fontCss(f, fit.size), color: kr, opacity: op}}>//</div> : null}
			{deco === 'rule' ? <div style={{position: 'absolute', left: left + fit.width + u * 1.6, top: zone.y + h / 2, width: Math.max(0, z.x + z.w - left - fit.width - u * 1.6) * op, height: Math.max(1, u * 0.25), background: kr}} /> : null}
			<TextLines fit={fit} f={f} zone={z} color="ink" align={align as any} style={{color, ...o.css?.({c, u, size: fit.size, kind})}} lineStyle={(li) => lineEnter(o.enter ?? 'fade', clamp01(p * fit.lines.length - li), fit.lines[li].length)} />
		</>
	);
};

export type NumOpts = {
	enter?: 'pop' | 'wipe' | 'count' | 'cut' | 'fade' | 'rise'; font?: FontKey; fill?: number; unitFont?: FontKey; unitRole?: Role;
	css?: (x: {c: C; u: number; size: number; col: string; big: boolean}) => React.CSSProperties;
	deco?: (x: X & {w: number; h: number; big: boolean; col: string}) => React.ReactNode;
};
const counted = (value: string, p: number) => {
	const m = value.match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/);
	if (!m || p >= 1) return value;
	const dec = (m[2].split('.')[1] ?? '').length;
	const n = Number(m[2].replace(/,/g, '')) * p;
	return m[1] + (m[2].includes(',') ? Math.round(n).toLocaleString('en-US') : n.toFixed(dec)) + m[3];
};
export const makeNumeral = (o: NumOpts = {}): Kit['Numeral'] => ({zone, p, value, unit, align, accent, seed}) => {
	const {u, design} = useD();
	const c = useColor();
	const k = o.fill ?? 0.86;
	const {fit, f} = useFit(value, o.font ?? 'display', {...zone, w: zone.w * (unit ? k * 0.8 : k), h: zone.h * k}, 'numeral', 1);
	const w = fit.width;
	const big = zone.h > u * 28;
	const left = leftOf(zone, w + (unit ? fit.size * 0.4 : 0), align);
	const top = zone.y + (zone.h - fit.lineH) / 2;
	const col = c(accent === 'ink' ? 'ink' : accent ?? 'primary');
	const e = o.enter ?? 'pop';
	const st: React.CSSProperties = e === 'pop' ? {transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: '30% 60%', opacity: clamp01(p * 4)} : e === 'wipe' ? {clipPath: `inset(-20% ${100 - clamp01(p * 1.4) * 104}% -20% -4%)`} : e === 'rise' ? {transform: `translateY(${(1 - p) * 40}%)`, opacity: clamp01(p * 3)} : e === 'cut' ? {opacity: p > 0.02 ? 1 : 0} : e === 'fade' ? {opacity: p} : {};
	const x = {fit, zone, p, align, seed, u, c, accent, left, w, h: fit.lineH, big, col};
	return (
		<div style={{position: 'absolute', left, top, width: w, height: fit.lineH}}>
			{o.deco?.(x)}
			<div style={{...fontCss({...f, case: 'none'}, fit.size), position: 'relative', color: col, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', ...st, ...o.css?.({c, u, size: fit.size, col, big})}}>{e === 'count' ? counted(fit.lines[0], clamp01(p)) : fit.lines[0]}</div>
			{unit ? <div style={{position: 'absolute', left: w + fit.size * 0.06, bottom: fit.lineH * 0.18, ...fontCss(design.fonts[o.unitFont ?? 'accent'], fit.size * 0.34), color: c(o.unitRole ?? 'ink'), whiteSpace: 'nowrap', opacity: clamp01(p * 3 - 1.4)}}>{unit}</div> : null}
		</div>
	);
};

export type ChartOpts = {
	sw?: number; lead?: number; smooth?: boolean; wob?: number; grid?: number; gridRole?: Role; axis?: boolean; axisSw?: number; axisRole?: Role;
	barR?: number; barOpacity?: number; barStroke?: number; dot?: number; area?: number; cap?: 'round' | 'butt' | 'square'; step?: boolean;
	labelFont?: FontKey; nameFont?: FontKey; labelSize?: number; roles?: Role[]; annot?: 'ring' | 'flag' | 'dot';
	filter?: string;
};
export const makeChart = (o: ChartOpts = {}): Kit['Chart'] => ({zone, p, chart, seed, accent}) => {
	const {u, design} = useD();
	const c = useColor(), on = useOn();
	const g = chartGeo(chart, zone, [0.08, 0.18, 0.14, 0.05]);
	const roles: Role[] = o.roles ?? [accent ?? 'primary', 'secondary', 'ink'];
	const rc = (si: number) => c(chart.series[si].role ?? roles[si % roles.length]);
	const sw = u * (o.sw ?? 0.6);
	const path = (pts: number[][], sd: string) => {
		const q = o.step ? pts.flatMap((pt, i) => (i ? [[pt[0], pts[i - 1][1]], pt] : [pt])) : pts;
		return o.wob ? smoothD(wobble(q, u * o.wob, sd, false, 60), false) : o.smooth ? smoothD(q, false) : ptsToD(q, false);
	};
	const lab = fontCss(design.fonts[o.labelFont ?? 'body'], u * (o.labelSize ?? 3));
	const nm = fontCss(design.fonts[o.nameFont ?? 'accent'], u * (o.labelSize ?? 3) * 1.1);
	const ax = c(o.axisRole ?? 'ink');
	const an = chart.annot ? g.lines[chart.annot.series ?? 0]?.[chart.annot.at] ?? (g.bars[chart.annot.at] ? [g.bars[chart.annot.at].x + g.bars[chart.annot.at].w / 2, g.bars[chart.annot.at].y] : null) : null;
	const ap = clamp01(p * 4 - 3);
	return (
		<div style={abs(zone)}>
			<svg width={zone.w} height={zone.h} style={{overflow: 'visible', filter: o.filter}}>
				{Array.from({length: o.grid ?? 0}, (_, i) => {
					const y = g.plot.y + (g.plot.h * i) / (o.grid ?? 1);
					return <line key={i} x1={g.plot.x} x2={g.plot.x + g.plot.w * clamp01(p * 2)} y1={y} y2={y} stroke={c(o.gridRole ?? 'shadow')} strokeWidth={Math.max(1, u * 0.14)} />;
				})}
				{o.axis === false ? null : <path d={`M${g.plot.x} ${g.plot.y}V${g.base}H${g.plot.x + g.plot.w}`} fill="none" stroke={ax} strokeWidth={u * (o.axisSw ?? 0.3)} strokeLinecap={o.cap ?? 'round'} {...drawn(p * 2.4)} />}
				{chart.type === 'bar'
					? g.bars.map((b, i) => {
							const bp = clamp01(p * 2.6 - 0.5 - b.i * 0.22);
							const h = (g.base - b.y) * bp;
							return <rect key={i} x={b.x} y={g.base - h} width={b.w} height={h} rx={u * (o.barR ?? 0)} fill={rgba(rc(b.si), o.barOpacity ?? 1)} stroke={o.barStroke ? ax : 'none'} strokeWidth={u * (o.barStroke ?? 0)} />;
						})
					: g.lines.map((pts, si) => (
							<g key={si}>
								{(o.area || chart.type === 'area') && si === 0 ? <path d={`${path(pts, seed + 'a')}L${pts[pts.length - 1][0]} ${g.base}L${pts[0][0]} ${g.base}Z`} fill={rgba(rc(0), o.area ?? 0.22)} opacity={clamp01(p * 2 - 0.9)} /> : null}
								<path d={path(pts, seed + 'l' + si)} fill="none" stroke={rc(si)} strokeWidth={sw * (si === 0 ? o.lead ?? 1.5 : 1)} strokeLinecap={o.cap ?? 'round'} strokeLinejoin={o.cap === 'butt' || o.cap === 'square' ? 'miter' : 'round'} {...drawn((p - 0.2 - si * 0.1) / 0.6)} />
								{o.dot ? <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={u * o.dot} fill={rc(si)} opacity={clamp01(p * 5 - 3.6)} /> : null}
							</g>
						))}
				{an && o.annot !== 'flag' ? <circle cx={an[0]} cy={an[1]} r={u * (o.annot === 'dot' ? 1 : 1.9)} fill={o.annot === 'dot' ? ax : 'none'} stroke={ax} strokeWidth={u * 0.35} opacity={ap} /> : null}
				{an && o.annot === 'flag' ? <line x1={an[0]} x2={an[0]} y1={an[1]} y2={an[1] - u * 7 * ap} stroke={ax} strokeWidth={u * 0.3} /> : null}
			</svg>
			{chart.x.map((x, i) => (i === 0 || i === chart.x.length - 1 || chart.type === 'bar' || chart.x.length <= 6 ? <div key={i} style={{position: 'absolute', left: g.xs[i] - u * 8, width: u * 16, textAlign: 'center', top: g.base + u * 1.2, ...lab, color: ax, opacity: clamp01(p * 3 - 0.5)}}>{x}</div> : null))}
			{chart.type !== 'bar'
				? g.lines.map((pts, si) => {
						const e = pts[pts.length - 1];
						return <div key={si} style={{position: 'absolute', left: e[0] + u * 1.4, top: e[1] - u * 2.2, ...nm, color: rc(si), whiteSpace: 'nowrap', opacity: clamp01(p * 4 - 2.6 - si * 0.3)}}>{chart.series[si].name}</div>;
					})
				: g.bars.map((b, i) => <div key={i} style={{position: 'absolute', left: b.x - u * 5, width: b.w + u * 10, textAlign: 'center', top: b.y - u * 4.8, ...nm, color: ax, opacity: clamp01(p * 3 - 1.2 - b.i * 0.25)}}>{fmt(b.v, chart.unit)}</div>)}
			{an && chart.annot ? <div style={{position: 'absolute', top: an[1] - u * (o.annot === 'flag' ? 11.4 : 7), ...nm, whiteSpace: 'nowrap', opacity: ap, ...(o.annot === 'flag' ? {background: ax, color: on(ax), padding: `${u * 0.3}px ${u * 1}px`, left: an[0]} : {color: ax, right: Math.max(0, zone.w - an[0] + u * 2.2)})}}>{chart.annot.text}</div> : null}
		</div>
	);
};

export type BubbleOpts = {r?: number; fill?: Role; stroke?: Role | null; sw?: number; shadow?: Role; font?: FontKey; wob?: number; tailLen?: number};
export const makeBubble = (o: BubbleOpts = {}): NonNullable<Kit['Bubble']> => ({zone, p, text, tail, seed}) => {
	const {u} = useD();
	const c = useColor(), on = useOn();
	const padX = u * 2.4, padY = u * 1.6;
	const {fit, f} = useFit(text, o.font ?? 'body', {...zone, w: zone.w - padX * 2 - u, h: zone.h * 0.62}, 'body', 3);
	const bw = fit.width + padX * 2, bh = fit.lines.length * fit.lineH + padY * 2;
	const tl = u * (o.tailLen ?? 4);
	const tx = tail === 'left' ? bw * 0.26 : bw * 0.74;
	const r = Math.min(u * (o.r ?? 2), bh / 2);
	const fill = c(o.fill ?? 'bg');
	const x0 = tail === 'left' ? zone.x + zone.w - bw - u : zone.x + u;
	const y0 = zone.y + Math.max(0, zone.h - bh - tl - u);
	const body = `M${r} 0H${bw - r}Q${bw} 0 ${bw} ${r}V${bh - r}Q${bw} ${bh} ${bw - r} ${bh}H${tx + u * 1.6}L${tx + (tail === 'left' ? -u * 1.6 : u * 1.6)} ${bh + tl}L${tx - u * 1.6} ${bh}H${r}Q0 ${bh} 0 ${bh - r}V${r}Q0 0 ${r} 0Z`;
	return (
		<div style={{position: 'absolute', left: x0, top: y0, transform: `scale(${0.7 + 0.3 * clamp01(p * 2)})`, transformOrigin: `${tx}px ${bh + tl}px`, opacity: clamp01(p * 3)}}>
			<svg width={bw} height={bh + tl} style={{position: 'absolute', overflow: 'visible'}}>
				{o.shadow ? <path d={body} fill={c(o.shadow)} transform={`translate(${u * 0.8} ${u * 0.8})`} /> : null}
				<path d={body} fill={fill} stroke={o.stroke === null ? 'none' : c(o.stroke ?? 'ink')} strokeWidth={u * (o.sw ?? 0.45)} strokeLinejoin="round" />
			</svg>
			<TextLines fit={fit} f={f} zone={{x: padX, y: padY, w: fit.width, h: bh}} color="ink" style={{color: on(fill)}} />
		</div>
	);
};
