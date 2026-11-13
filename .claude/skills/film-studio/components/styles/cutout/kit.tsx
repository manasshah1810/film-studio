import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Kit} from '../../engine/types';
import {clamp01, held, mix, rgba, rr, useColor, useD} from '../../engine/tokens';
import {makeBubble, makeChart, makeHeadline, makeLabel, makeNumeral} from '../../engine/base';
import {Grain, VectorMarks} from '../../engine/marks';

const useTx = () => useD().design.system.textures as Record<string, number>;

/** A paper theatre: a paper sun, three torn hills, every layer casting a shadow on the one behind. */
const Backdrop: Kit['Backdrop'] = ({panel}) => {
	const {design, W, H, u, safe} = useD();
	const c = useColor(), tx = useTx();
	const sd = `${design.seed}-${panel.id}`;
	const base = Math.max(safe.y + safe.h, H * 0.82);
	const hill = (i: number) => {
		const y0 = base - u * (10 - i * 5), n = 14;
		const pts = Array.from({length: n + 1}, (_, k) => `${(k / n) * W},${y0 + Math.sin(k * 0.9 + i * 2 + rr(sd + 'h' + i, 0, 6)) * u * 2.2 + rr(sd + i + 'j' + k, -1, 1) * u * tx.tear}`);
		return `M0,${H} L${pts.join(' L')} L${W},${H}Z`;
	};
	const fills = [mix(c('bg'), c('shadow'), 0.55), c('shadow'), mix(c('shadow'), c('ink'), 0.25)];
	const sh = `drop-shadow(0 ${-u * 0.3}px ${u * tx.shadow_blur}px ${rgba(c('ink'), tx.shadow_opacity)})`;
	return (
		<AbsoluteFill style={{background: c('bg')}}>
			<div style={{position: 'absolute', left: W * rr(sd + 'sx', 0.55, 0.8), top: Math.max(u * 3, safe.y * 0.25), width: u * 16, height: u * 16, borderRadius: '47% 53% 50% 50%', background: c('highlight'), filter: sh}} />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				{[0, 1, 2].map((i) => <path key={i} d={hill(i)} fill={fills[i]} style={{filter: sh}} />)}
			</svg>
		</AbsoluteFill>
	);
};
const Finish: Kit['Finish'] = ({panel}) => {
	const tx = useTx();
	return <Grain id={`co-g-${panel.id}`} freq={tx.grain_freq} opacity={tx.grain_opacity} octaves={3} />;
};

/** Each headline line is a strip of ink-coloured paper laid down by hand, never quite level. */
const Headline = makeHeadline({
	enter: 'drop', em: 'color', emRole: 'highlight',
	css: ({c}) => ({color: c('bg')}),
	before: ({fit, zone, left, p, u, c, seed, level}) => level === 'h2' ? null : (
		<>
			{fit.lines.map((_, i) => {
				const lp = clamp01(p * fit.lines.length - i);
				const pad = fit.size * 0.2;
				return <div key={i} style={{position: 'absolute', left: left - pad, top: zone.y + i * fit.lineH - fit.size * 0.02, width: fit.width + pad * 2, height: fit.lineH * 0.98, background: c('ink'), transform: `translateY(${(1 - lp) * -70}%) rotate(${rr(seed + 'r' + i, -1.4, 1.4)}deg)`, opacity: clamp01(lp * 2.5), boxShadow: `${u * 0.3}px ${u * 0.5}px ${u * 0.5}px ${rgba(c('ink'), 0.3)}`, clipPath: `polygon(0 ${rr(seed + 'a' + i, 0, 8)}%, 100% 0, ${100 - rr(seed + 'b' + i, 0, 3)}% 100%, ${rr(seed + 'c' + i, 0, 2)}% ${100 - rr(seed + 'd' + i, 0, 8)}%)`}} />;
			})}
		</>
	),
});
const Label = makeLabel({kicker: 'pill', pillR: 3, enter: 'drop'});
const Numeral = makeNumeral({
	enter: 'pop', css: ({c}) => ({color: c('ink')}),
	deco: ({w, h, u, c, big, p, seed}) => big ? <div style={{position: 'absolute', left: -w * 0.2, top: -h * 0.16, width: w * 1.4, height: h * 1.32, borderRadius: '52% 48% 46% 54% / 50% 54% 46% 50%', background: c('highlight'), transform: `rotate(${rr(seed, -8, 8)}deg) scale(${clamp01(p * 2)})`, boxShadow: `${u * 0.4}px ${u * 0.7}px ${u * 0.7}px ${rgba(c('ink'), 0.3)}`}} /> : null,
});
const Chart = makeChart({sw: 1.1, lead: 1.4, cap: 'butt', barR: 0.3, axisSw: 0.5, annot: 'dot', dot: 1.3});
const Bubble = makeBubble({r: 1.4, fill: 'highlight', stroke: null, shadow: 'shadow'});

/** Scissor-cut shapes with no outline; the pieces are re-laid every 6 frames, so edges boil like stop motion. */
const Marks: Kit['Marks'] = ({zone, p, t, shapes, vb, flip, kind, seed, state}) => {
	const {u, design} = useD();
	const c = useColor(), tx = useTx();
	return <VectorMarks shapes={shapes} vb={vb} zone={zone} p={p} seed={seed} flip={flip} kind={kind} dim={state === 'dim'} opts={{outline: null, fill: 'flat', wobble: tx.cut_wobble, boilSeed: held(t, design.system.motion.hold * 3), enter: 'drop', lineScale: 1.9, cap: 'butt', shadow: {dx: u * 0.35, dy: u * 0.6, color: c('ink'), opacity: tx.shadow_opacity}}} />;
};

export const kit: Kit = {Backdrop, Headline, Label, Numeral, Marks, Chart, Finish, Bubble};
