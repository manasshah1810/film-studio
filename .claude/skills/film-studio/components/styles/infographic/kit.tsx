import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Kit} from '../../engine/types';
import {clamp01, fontCss, mix, rr, useColor, useD} from '../../engine/tokens';
import {makeBubble, makeChart, makeHeadline, makeLabel, makeNumeral} from '../../engine/base';
import {VectorMarks} from '../../engine/marks';

const useTx = () => useD().design.system.textures as Record<string, number>;

/** Dot grid, a hairline frame with a running folio, and one colour band bleeding off an edge. */
const Backdrop: Kit['Backdrop'] = ({panel}) => {
	const {design, W, H, u, safe} = useD();
	const c = useColor(), tx = useTx();
	const sd = `${design.seed}-${panel.id}`;
	const g = u * tx.grid_cell;
	const right = rr(sd + 'side', 0, 1) > 0.5;
	return (
		<AbsoluteFill style={{background: c('bg')}}>
			<div style={{position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${c('shadow')} ${u * tx.grid_dot}px, transparent ${u * tx.grid_dot + 0.5}px)`, backgroundSize: `${g}px ${g}px`, opacity: tx.grid_opacity}} />
			<div style={{position: 'absolute', [right ? 'right' : 'left']: 0, top: 0, bottom: 0, width: u * tx.band_w, background: c(panel.accent ?? 'primary')}} />
			<div style={{position: 'absolute', left: safe.x + u * 4, right: W - safe.x - safe.w + u * 4, top: safe.y + u * 2.2, height: Math.max(1, u * 0.16), background: c('ink')}} />
			<div style={{position: 'absolute', left: safe.x + u * 4, top: safe.y + u * 3, ...fontCss(design.fonts.mono, u * 2.2), color: c('ink'), opacity: 0.7}}>{panel.id.toUpperCase()}</div>
		</AbsoluteFill>
	);
};

const Headline = makeHeadline({enter: 'rise', em: 'color'});
const Label = makeLabel({kicker: 'bar', enter: 'rise'});
const Numeral = makeNumeral({
	enter: 'count',
	deco: ({w, h, p, u, c, big, col}) => big ? <div style={{position: 'absolute', left: 0, top: h * 0.98, width: w * clamp01(p * 1.5), height: u * 0.9, background: col, boxShadow: `0 ${u * 1.5}px 0 ${c('shadow')}`}} /> : null,
});
const Chart = makeChart({sw: 0.5, lead: 1.8, grid: 4, dot: 1, area: 0.14, annot: 'flag', cap: 'butt', axisSw: 0.2, labelFont: 'mono', nameFont: 'body'});
const Bubble = makeBubble({r: 0.6, fill: 'ink', stroke: null});

const Marks: Kit['Marks'] = ({zone, p, shapes, vb, flip, kind, seed, state}) => (
	<VectorMarks shapes={shapes} vb={vb} zone={zone} p={p} seed={seed} flip={flip} kind={kind} dim={state === 'dim'} opts={{outline: null, fill: 'flat', enter: 'drop', lineScale: 1.9, cap: 'round'}} />
);

/** The visual sits on a tinted card with a measured corner tick: data, not illustration. */
const Decor: Kit['Decor'] = ({zones, p}) => {
	const {u} = useD();
	const c = useColor(), tx = useTx();
	const v = zones.visual ?? zones.chart;
	if (!v) return null;
	const k = clamp01(p * 2);
	return (
		<>
			<div style={{position: 'absolute', left: v.x, top: v.y + v.h * (1 - k), width: v.w, height: v.h * k, background: mix(c('bg'), c('shadow'), tx.card_mix), borderRadius: u * tx.card_radius}} />
			<div style={{position: 'absolute', left: v.x + u * 1.4, top: v.y + u * 1.4, width: u * 3, height: u * 3, borderLeft: `${u * 0.3}px solid ${c('ink')}`, borderTop: `${u * 0.3}px solid ${c('ink')}`, opacity: k}} />
		</>
	);
};

export const kit: Kit = {Backdrop, Headline, Label, Numeral, Marks, Chart, Decor, Bubble};
