import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Kit} from '../../engine/types';
import {clamp01, mix, rr, useColor, useD} from '../../engine/tokens';
import {makeBubble, makeChart, makeHeadline, makeLabel, makeNumeral} from '../../engine/base';
import {Halftone, Rays} from '../../engine/fx';
import {VectorMarks} from '../../engine/marks';

const useTx = () => useD().design.system.textures as Record<string, number>;

/** Sunburst sky, a ground band the cast stands on, and a halftone corner. */
const Backdrop: Kit['Backdrop'] = ({panel, t}) => {
	const {design, W, H, u, safe} = useD();
	const c = useColor(), tx = useTx();
	const sd = `${design.seed}-${panel.id}`;
	const peak = panel.energy === 'peak';
	return (
		<AbsoluteFill style={{background: c('bg')}}>
			<Rays cx={W * rr(sd + 'x', 0.3, 0.7)} cy={safe.y + safe.h * rr(sd + 'y', 0.4, 0.7)} color={mix(c('bg'), c('highlight'), tx.ray_mix)} n={peak ? 18 : 12} rot={t * tx.ray_spin} />
			<Halftone id={`ct-h-${panel.id}`} color={c('shadow')} cell={u * tx.dot_cell} opacity={tx.dot_opacity} mask="linear-gradient(200deg, #000 0%, transparent 42%)" />
		</AbsoluteFill>
	);
};

const hard = (col: string, k: number) => `${k}em ${k}em 0 ${col}`;
const Headline = makeHeadline({enter: 'slam', em: 'box', css: ({c, level}) => ({textShadow: hard(c('shadow'), level === 'hero' ? 0.07 : 0.05), WebkitTextStroke: `0.012em ${c('ink')}`})});
const Label = makeLabel({kicker: 'pill', enter: 'rise', pillR: 12});
const Numeral = makeNumeral({
	enter: 'pop',
	css: ({c, col}) => ({color: col, WebkitTextStroke: `0.035em ${c('ink')}`, paintOrder: 'stroke fill', textShadow: hard(c('ink'), 0.06)}),
	deco: ({w, h, p, u, c, big, seed}) => {
		if (!big) return null;
		const n = 12, R = Math.max(w, h) * 0.78;
		const pts = Array.from({length: n * 2}, (_, i) => { const a = (i / (n * 2)) * Math.PI * 2, r = R * (i % 2 ? 0.78 : 1) * (0.97 + rr(seed + i, 0, 0.06)); return `${w / 2 + Math.cos(a) * r},${h / 2 + Math.sin(a) * r * 0.8}`; }).join(' ');
		return (
			<svg width={w} height={h} style={{position: 'absolute', overflow: 'visible', transform: `scale(${clamp01(p * 1.6)}) rotate(${-8 + p * 8}deg)`}}>
				<polygon points={pts} fill={c('ink')} transform={`translate(${u * 0.9} ${u * 0.9})`} />
				<polygon points={pts} fill={c('highlight')} stroke={c('ink')} strokeWidth={u * 0.5} strokeLinejoin="round" />
			</svg>
		);
	},
});
const Chart = makeChart({sw: 0.9, lead: 1.5, barR: 1, barStroke: 0.5, dot: 1.3, axisSw: 0.55, annot: 'ring', smooth: true});
const Bubble = makeBubble({r: 3.4, shadow: 'ink', sw: 0.55});

const Marks: Kit['Marks'] = ({zone, p, shapes, vb, flip, kind, seed, state}) => {
	const {u} = useD();
	const c = useColor(), tx = useTx();
	return <VectorMarks shapes={shapes} vb={vb} zone={zone} p={p} seed={seed} flip={flip} kind={kind} dim={state === 'dim'} opts={{outline: 'ink', outlineAll: true, sw: tx.outline, fill: 'flat', enter: 'pop', lineScale: 1.5, shadow: kind === 'prop' ? {dx: u * tx.shadow_offset, dy: u * tx.shadow_offset, color: c('ink')} : undefined}} />;
};

/** The ground band (its top edge is where the cast stands) and a squash shadow under them. */
const Decor: Kit['Decor'] = ({zones, p}) => {
	const {u, W, H, safe} = useD();
	const c = useColor(), tx = useTx();
	const v = zones.visual_full ?? zones.visual;
	const gy = v ? v.y + v.h - u * 1.2 : Math.max(safe.y + safe.h, H * 0.86);
	const ground = (
		<svg width={W} height={H} style={{position: 'absolute'}}>
			<path d={`M0 ${gy}Q${W * 0.5} ${gy - u * tx.ground_bow} ${W} ${gy}V${H}H0Z`} fill={c('shadow')} stroke={c('ink')} strokeWidth={u * tx.outline * 0.42} />
		</svg>
	);
	if (!v) return ground;
	return <>{ground}<div style={{position: 'absolute', left: v.x + v.w * 0.2, top: v.y + v.h - u * 1.6, width: v.w * 0.6, height: u * 3.2, borderRadius: '50%', background: c('ink'), opacity: 0.22 * clamp01(p * 3), transform: `scaleX(${0.6 + 0.4 * p})`}} /></>;
};

export const kit: Kit = {Backdrop, Headline, Label, Numeral, Marks, Chart, Decor, Bubble};
