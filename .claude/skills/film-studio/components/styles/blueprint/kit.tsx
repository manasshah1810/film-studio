import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Kit} from '../../engine/types';
import {clamp01, fontCss, rgba, useColor, useD} from '../../engine/tokens';
import {drawn, makeBubble, makeChart, makeHeadline, makeLabel, makeNumeral} from '../../engine/base';
import {Grain, VectorMarks} from '../../engine/marks';

const useTx = () => useD().design.system.textures as Record<string, number>;

/** A drawing sheet: fine and coarse grid, a ruled border, a sheet number in the corner. */
const Backdrop: Kit['Backdrop'] = ({panel}) => {
	const {design, W, H, u, safe} = useD();
	const c = useColor(), tx = useTx();
	const g = u * tx.grid, G = g * tx.major_every;
	const line = (col: string, s: number, w: number) => `linear-gradient(90deg, ${col} ${w}px, transparent ${w}px) 0 0 / ${s}px ${s}px, linear-gradient(0deg, ${col} ${w}px, transparent ${w}px) 0 0 / ${s}px ${s}px`;
	const m = u * tx.frame;
	return (
		<AbsoluteFill style={{background: c('bg')}}>
			<div style={{position: 'absolute', inset: 0, background: `${line(rgba(c('shadow'), tx.major_opacity), G, Math.max(1, u * 0.12))}, ${line(rgba(c('shadow'), tx.grid_opacity), g, 1)}`}} />
			<div style={{position: 'absolute', left: m, top: m, right: m, bottom: m, border: `${Math.max(1.5, u * 0.22)}px solid ${c('ink')}`, opacity: 0.85}} />
			<div style={{position: 'absolute', right: m, top: Math.min(H - m - u * 4.4, safe.y + safe.h + u * 1.5), height: u * 4.4, padding: `0 ${u * 1.6}px`, display: 'flex', alignItems: 'center', gap: u * 1.6, borderLeft: `${Math.max(1.5, u * 0.22)}px solid ${c('ink')}`, borderTop: `${Math.max(1.5, u * 0.22)}px solid ${c('ink')}`, ...fontCss(design.fonts.mono, u * 2), color: c('ink'), opacity: 0.85, whiteSpace: 'nowrap'}}>
				<span>SHEET {panel.id.replace(/\D/g, '').padStart(2, '0') || '01'}</span>
				<span style={{width: 1, alignSelf: 'stretch', background: c('ink')}} />
				<span>NTS</span>
			</div>
		</AbsoluteFill>
	);
};
const Finish: Kit['Finish'] = ({panel}) => {
	const tx = useTx();
	return <Grain id={`bp-g-${panel.id}`} freq={tx.grain_freq} opacity={tx.grain_opacity} blend="overlay" />;
};

const Headline = makeHeadline({enter: 'type', em: 'underline'});
const Label = makeLabel({kicker: 'slash', kickerFont: 'mono', enter: 'type', attrib: 'REF: '});
/** The key figure is called out like a dimension: corner ticks at the four corners of its box. */
const Numeral = makeNumeral({
	enter: 'count',
	deco: ({w, h, p, u, c, big}) => {
		if (!big) return null;
		const m = u * 1.6, L = u * 3, k = clamp01(p * 2), sw = Math.max(1.5, u * 0.22);
		const pts = [[-m, -m, 1, 1], [w + m, -m, -1, 1], [w + m, h + m, -1, -1], [-m, h + m, 1, -1]];
		return (
			<svg width={w} height={h} style={{position: 'absolute', overflow: 'visible'}}>
				{pts.map(([x, y, dx, dy], i) => <path key={i} d={`M${x + dx * L * k} ${y}H${x}V${y + dy * L * k}`} fill="none" stroke={c('ink')} strokeWidth={sw} />)}
			</svg>
		);
	},
});
const Chart = makeChart({sw: 0.5, lead: 1.7, cap: 'butt', grid: 4, axisSw: 0.22, dot: 0.9, annot: 'flag', labelFont: 'mono', nameFont: 'mono'});
const Bubble = makeBubble({r: 0, fill: 'bg', sw: 0.22, font: 'mono'});

/** Drafted, not painted: constant-width line, 45-degree hatch for mass, drawn on stroke by stroke. */
const Marks: Kit['Marks'] = ({zone, p, shapes, vb, flip, kind, seed, state}) => {
	const tx = useTx();
	return <VectorMarks shapes={shapes} vb={vb} zone={zone} p={p} seed={seed} flip={flip} kind={kind} dim={state === 'dim'} opts={{outline: 'ink', outlineAll: true, sw: tx.line_width, fill: 'hatch', hatch: {gap: tx.hatch_gap, w: tx.hatch_width, angle: -45}, enter: 'draw', cap: 'butt', lineScale: 0.8}} />;
};

/** A dimension line under the visual: extension ticks, arrowheads, drawn left to right. */
const Decor: Kit['Decor'] = ({zones, p}) => {
	const {u, W, H} = useD();
	const c = useColor();
	const v = zones.visual ?? zones.visual_full;
	if (!v) return null;
	const y = v.y + v.h + u * 1.2, x0 = v.x + v.w * 0.14, x1 = v.x + v.w * 0.86, a = u * 1.1, sw = Math.max(1.2, u * 0.16);
	return (
		<svg width={W} height={H} style={{position: 'absolute'}} fill="none" stroke={c('secondary')} strokeWidth={sw}>
			<path d={`M${x0} ${y}H${x1}`} {...drawn(p * 1.6 - 0.3)} />
			<path d={`M${x0} ${y - a * 1.4}V${y + a * 1.4}M${x1} ${y - a * 1.4}V${y + a * 1.4}M${x0 + a} ${y - a * 0.6}L${x0} ${y}L${x0 + a} ${y + a * 0.6}M${x1 - a} ${y - a * 0.6}L${x1} ${y}L${x1 - a} ${y + a * 0.6}`} opacity={clamp01(p * 3 - 1.4)} />
		</svg>
	);
};

export const kit: Kit = {Backdrop, Headline, Label, Numeral, Marks, Chart, Decor, Finish, Bubble};
