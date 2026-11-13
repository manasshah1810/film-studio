import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Kit} from '../../engine/types';
import {clamp01, pick, rgba, rr, useColor, useD} from '../../engine/tokens';
import {drawn, makeBubble, makeChart, makeHeadline, makeLabel, makeNumeral} from '../../engine/base';
import {Filters} from '../../engine/fx';
import {Grain, VectorMarks} from '../../engine/marks';
import {smoothD, wobble} from '../../engine/shapes';

const useTx = () => useD().design.system.textures as Record<string, number>;
const rough = (pts: number[][], amp: number, seed: string, closed = false) => smoothD(wobble(pts, amp, seed, closed, 50), closed);

/** A ruled notebook page: feint lines, a margin rule, punched holes, tooth in the paper. */
const Backdrop: Kit['Backdrop'] = ({panel}) => {
	const {W, H, u, safe} = useD();
	const c = useColor(), tx = useTx();
	const gap = u * tx.rule_gap;
	const mx = Math.max(u * 7, safe.x + u * 2.4);
	return (
		<AbsoluteFill style={{background: c('bg')}}>
			<Filters id="sk-rough" kind="rough" scale={u * 0.35} freq={0.6} />
			<div style={{position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(0deg, transparent 0, transparent ${gap - 1.5}px, ${rgba(c('shadow'), tx.rule_opacity)} ${gap - 1.5}px, ${rgba(c('shadow'), tx.rule_opacity)} ${gap}px)`}} />
			<div style={{position: 'absolute', left: mx, top: 0, bottom: 0, width: Math.max(1.5, u * 0.18), background: c('primary'), opacity: tx.margin_opacity}} />
			{[0.16, 0.5, 0.84].map((y) => <div key={y} style={{position: 'absolute', left: mx * 0.3, top: H * y, width: u * 2.6, height: u * 2.6, borderRadius: 99, background: rgba(c('ink'), 0.16), boxShadow: `inset ${u * 0.3}px ${u * 0.3}px ${u * 0.5}px ${rgba(c('ink'), 0.35)}`}} />)}
			<Grain id={`sk-g-${panel.id}`} freq={tx.grain_freq} opacity={tx.grain_opacity} />
		</AbsoluteFill>
	);
};

/** Margin doodles, only in the strips outside the platform-safe area. */
const DOODLES = ['M0 6L4 0L8 6L1 2H7Z', 'M4 4m-1 0a1 1 0 1 0 2 0a2 2 0 1 0 -4 0a3 3 0 1 0 6 0a4 4 0 1 0 -8 0', 'M0 4H8M5 1L8 4L5 7', 'M4 0V8M0 4H8M1 1L7 7M7 1L1 7', 'M0 6Q2 0 4 6T8 6'];
const Decor: Kit['Decor'] = ({panel, p}) => {
	const {design, W, H, u, safe} = useD();
	const c = useColor(), tx = useTx();
	const sd = `${design.seed}-${panel.id}-d`;
	const strips = [[0, safe.y], [safe.y + safe.h, H]].filter(([a, b]) => b - a > u * 9);
	return (
		<svg width={W} height={H} style={{position: 'absolute'}}>
			{Array.from({length: tx.doodles}, (_, i) => {
				if (!strips.length) return null;
				const [a, b] = strips[i % strips.length];
				const s = u * rr(sd + 's' + i, 0.7, 1.3);
				return <path key={i} d={pick(sd + i, DOODLES)} transform={`translate(${rr(sd + 'x' + i, 0.14, 0.86) * W} ${rr(sd + 'y' + i, a + u * 2, b - u * 8)}) rotate(${rr(sd + 'r' + i, -25, 25)}) scale(${s})`} fill="none" stroke={c('secondary')} strokeWidth={0.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.75} {...drawn(p * 2 - i * 0.3)} />;
			})}
		</svg>
	);
};

const Headline = makeHeadline({
	enter: 'wipe', em: 'underline',
	before: ({zone, left, u, c, level, seed, p}) => level !== 'hero' ? null : <div style={{position: 'absolute', left: left - u * 2.2, top: zone.y - u * 2.6, width: u * 11, height: u * 3.4, background: c('highlight'), opacity: 0.72 * clamp01(p * 4), transform: `rotate(${rr(seed + 'tape', -9, -3)}deg)`, boxShadow: `0 ${u * 0.2}px ${u * 0.5}px ${rgba(c('ink'), 0.18)}`}} />,
});
const Label = makeLabel({kicker: 'rule', enter: 'wipe', attrib: '~ '});
const Numeral = makeNumeral({
	enter: 'wipe',
	deco: ({w, h, p, u, c, big, seed}) => {
		if (!big) return null;
		const m = u * 2.4, box = [[-m, -m * 0.2], [w + m, -m * 0.5], [w + m * 1.2, h + m * 0.1], [-m * 0.8, h + m * 0.4]];
		return (
			<svg width={w} height={h} style={{position: 'absolute', overflow: 'visible'}}>
				{[0, 1].map((k) => <path key={k} d={rough(box, u * 0.5, seed + 'bx' + k, true)} fill="none" stroke={c('ink')} strokeWidth={u * 0.22} opacity={0.8} {...drawn((p - 0.5) * 2 - k * 0.2)} />)}
				{Array.from({length: 7}, (_, i) => <line key={i} x1={w + m * 1.4 + i * u * 0.9} y1={h * 0.5} x2={w + m * 0.6 + i * u * 0.9} y2={h + m * 0.6} stroke={c('ink')} strokeWidth={u * 0.16} opacity={0.5 * clamp01(p * 3 - 2)} />)}
			</svg>
		);
	},
});
const Chart = makeChart({sw: 0.42, lead: 1.7, wob: 0.22, grid: 0, axisSw: 0.26, dot: 0.9, annot: 'ring'});
const Bubble = makeBubble({r: 2.6, sw: 0.28});

/** Graphite line, drawn twice, over a translucent coloured-pencil fill. */
const Marks: Kit['Marks'] = ({zone, p, shapes, vb, flip, kind, seed, state}) => {
	const tx = useTx();
	return <VectorMarks shapes={shapes} vb={vb} zone={zone} p={p} seed={seed} flip={flip} kind={kind} dim={state === 'dim'} opts={{outline: 'ink', outlineAll: true, sw: tx.pencil_width, wobble: tx.wobble, passes: 2, fill: 'flat', fillOpacity: tx.fill_alpha, fillFilter: 'url(#sk-rough)', enter: 'draw', lineScale: 0.9}} />;
};

export const kit: Kit = {Backdrop, Headline, Label, Numeral, Marks, Chart, Decor, Bubble};
