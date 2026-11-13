import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Kit} from '../../engine/types';
import {clamp01, lum, mix, rnd, rr, useColor, useD} from '../../engine/tokens';
import {makeBubble, makeChart, makeHeadline, makeLabel, makeNumeral} from '../../engine/base';
import {Halftone, SpeedLines} from '../../engine/fx';
import {Grain, VectorMarks} from '../../engine/marks';

const useTx = () => useD().design.system.textures as Record<string, number>;

/** A printed page: gutter, one skewed inked panel, halftone tone, speed lines on the peak. */
const Backdrop: Kit['Backdrop'] = ({panel}) => {
	const {design, W, H, u, safe} = useD();
	const c = useColor(), tx = useTx();
	const sd = `${design.seed}-${panel.id}`;
	const g = u * tx.gutter;
	const k = (i: number) => rr(sd + 'k' + i, -1, 1) * u * tx.panel_skew;
	const x0 = g, x1 = W - g, y0 = Math.max(g, safe.y - u * 4), y1 = Math.min(H - g, safe.y + safe.h + u * 4);
	const box = `${x0 + k(0)},${y0 + k(1)} ${x1 + k(2)},${y0 + k(3)} ${x1 + k(4)},${y1 + k(5)} ${x0 + k(6)},${y1 + k(7)}`;
	return (
		<AbsoluteFill style={{background: c('bg')}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<defs>
					<clipPath id={`cm-c-${panel.id}`}><polygon points={box} /></clipPath>
					<pattern id="cm-ht" patternUnits="userSpaceOnUse" width={3} height={3} patternTransform="rotate(45)"><circle cx={1.5} cy={1.5} r={0.8} fill={c('ink')} /></pattern>
				</defs>
				<polygon points={box} fill={mix(c('bg'), c('shadow'), tx.panel_tint)} />
			</svg>
			<AbsoluteFill style={{clipPath: `polygon(${box.split(' ').map((p) => p.split(',').map((n) => `${n}px`).join(' ')).join(',')})`}}>
				<Halftone id={`cm-h-${panel.id}`} color={c('secondary')} cell={u * tx.dot_cell} r={0.36} opacity={tx.dot_opacity} mask={`linear-gradient(${rr(sd + 'a', 120, 240)}deg, #000 0%, transparent 55%)`} />
				{panel.energy === 'peak' ? <SpeedLines cx={W / 2} cy={safe.y + safe.h * 0.5} color={c('ink')} seed={(i) => rnd(sd + 's' + i)} opacity={tx.speed_opacity} /> : null}
			</AbsoluteFill>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<polygon points={box} fill="none" stroke={c('ink')} strokeWidth={u * tx.border} strokeLinejoin="miter" />
			</svg>
		</AbsoluteFill>
	);
};
const Finish: Kit['Finish'] = ({panel}) => {
	const tx = useTx();
	return <Grain id={`cm-g-${panel.id}`} freq={tx.grain_freq} opacity={tx.grain_opacity} />;
};

/** Headlines are caption boxes: highlight fill, ink border, hard ink shadow. */
const Headline = makeHeadline({
	enter: 'cut', em: 'color',
	css: ({c}) => ({color: lum(c('ink')) < lum(c('bg')) ? c('ink') : c('bg')}),
	before: ({fit, zone, left, p, u, c, level}) => {
		if (level === 'h2' || p < 0.02) return null;
		const pad = fit.size * 0.22, h = fit.lines.length * fit.lineH + pad * 0.9;
		return (
			<div style={{position: 'absolute', left: left - pad, top: zone.y - pad * 0.55, width: fit.width + pad * 2, height: h, background: c('highlight'), border: `${u * 0.5}px solid ${c('ink')}`, boxShadow: `${u * 0.8}px ${u * 0.8}px 0 ${c('ink')}`, transform: `rotate(${-1.2}deg) scale(${0.9 + 0.1 * clamp01(p * 3)})`}} />
		);
	},
});
const Label = makeLabel({kicker: 'pill', pillR: 0, kickerRole: 'ink', enter: 'cut'});
const Numeral = makeNumeral({
	enter: 'pop',
	css: ({c, col}) => col === c('ink') ? {color: col, fontStyle: 'italic'} : {color: col, WebkitTextStroke: `0.04em ${c('ink')}`, paintOrder: 'stroke fill', textShadow: `0.05em 0.05em 0 ${c('ink')}`, fontStyle: 'italic'},
	deco: ({w, h, p, u, c, big, seed}) => !big ? null : (
		<svg width={w} height={h} style={{position: 'absolute', overflow: 'visible', opacity: clamp01(p * 2)}}>
			{Array.from({length: 26}, (_, i) => {
				const a = (i / 26) * Math.PI * 2, r0 = Math.max(w, h) * (0.62 + rnd(seed + i) * 0.1), r1 = r0 + u * (3 + rnd(seed + 'l' + i) * 7) * p;
				return <line key={i} x1={w / 2 + Math.cos(a) * r0} y1={h / 2 + Math.sin(a) * r0 * 0.7} x2={w / 2 + Math.cos(a) * r1} y2={h / 2 + Math.sin(a) * r1 * 0.7} stroke={c('ink')} strokeWidth={u * 0.5} strokeLinecap="butt" />;
			})}
		</svg>
	),
});
const Chart = makeChart({sw: 0.9, lead: 1.4, cap: 'butt', barStroke: 0.6, axisSw: 0.7, annot: 'flag', dot: 1.2});
const Bubble = makeBubble({r: 7, sw: 0.6, font: 'accent', tailLen: 5});

/** Brush-inked figures: heavy outline, flat colour, a 45-degree dot tone on bodies. */
const Marks: Kit['Marks'] = ({zone, p, shapes, vb, flip, kind, seed, state}) => {
	const tx = useTx();
	return <VectorMarks shapes={shapes} vb={vb} zone={zone} p={p} seed={seed} flip={flip} kind={kind} dim={state === 'dim'} opts={{outline: 'ink', outlineAll: true, sw: tx.ink_width, fill: 'flat', enter: 'cut', lineScale: 1.3, extra: (s, d) => (s.tag === 'body' || (kind === 'prop' && s.t !== 'line' && s.fill && s.fill !== 'none' && s.fill !== 'bg') ? <path d={d} fill="url(#cm-ht)" opacity={tx.tone_opacity} style={{clipPath: 'inset(0 0 0 48%)'}} /> : null)}} />;
};

export const kit: Kit = {Backdrop, Headline, Label, Numeral, Marks, Chart, Finish, Bubble};
