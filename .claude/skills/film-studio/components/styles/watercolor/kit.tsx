import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Kit, Role} from '../../engine/types';
import {clamp01, rgba, rr, useColor, useD} from '../../engine/tokens';
import {makeBubble, makeChart, makeHeadline, makeLabel, makeNumeral} from '../../engine/base';
import {Filters} from '../../engine/fx';
import {Grain, VectorMarks} from '../../engine/marks';

const useTx = () => useD().design.system.textures as Record<string, number>;

/** One soft-edged pool of pigment: dense at the rim, pale in the middle, the way a wash dries. */
const wash = (col: string, a: number): string => `radial-gradient(closest-side, ${rgba(col, a * 0.55)} 0%, ${rgba(col, a * 0.7)} 62%, ${rgba(col, a)} 84%, ${rgba(col, 0)} 100%)`;

/** Cold-press paper with three washes bled into it; the washes stay behind the content area's edges. */
const Backdrop: Kit['Backdrop'] = ({panel}) => {
	const {design, W, H, u} = useD();
	const c = useColor(), tx = useTx();
	const sd = `${design.seed}-${panel.id}`;
	const roles: Role[] = [panel.accent ?? 'primary', 'highlight', 'secondary'];
	return (
		<AbsoluteFill style={{background: c('bg')}}>
			<Filters id="wc-wet" kind="wet" scale={tx.bleed} freq={0.035} blur={0.7} />
			<Filters id="wc-edge" kind="rough" scale={u * 2.2} freq={0.012} />
			<AbsoluteFill style={{filter: 'url(#wc-edge)'}}>
				{roles.map((r, i) => {
					const s = Math.min(W, H) * rr(sd + 's' + i, 0.7, 1.05);
					return <div key={i} style={{position: 'absolute', left: W * rr(sd + 'x' + i, -0.15, 0.6), top: H * (i / 3 + rr(sd + 'y' + i, -0.08, 0.1)), width: s * 1.25, height: s, borderRadius: '50%', background: wash(c(r), tx.wash_opacity * (i === 0 ? 1 : 0.7)), transform: `rotate(${rr(sd + 'r' + i, -30, 30)}deg)`}} />;
				})}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
const Finish: Kit['Finish'] = ({panel}) => {
	const tx = useTx();
	return <Grain id={`wc-g-${panel.id}`} freq={tx.grain_freq} opacity={tx.grain_opacity} octaves={3} />;
};

const Headline = makeHeadline({
	enter: 'rise', em: 'color',
	before: ({fit, zone, left, p, u, c, accent, level}) => level !== 'hero' ? null : <div style={{position: 'absolute', left: left - u * 3, top: zone.y + fit.lineH * (fit.lines.length - 0.42), width: (fit.width + u * 6) * clamp01(p * 1.4), height: fit.lineH * 0.5, borderRadius: '40% 60% 55% 45% / 60% 50% 50% 40%', background: rgba(c(accent ?? 'highlight'), 0.42), filter: `blur(${u * 0.5}px)`}} />,
});
const Label = makeLabel({kicker: 'dot', enter: 'rise'});
const Numeral = makeNumeral({
	enter: 'fade',
	deco: ({w, h, p, u, c, big, seed}) => big ? <div style={{position: 'absolute', left: -w * 0.22, top: -h * 0.2, width: w * 1.44, height: h * 1.4, borderRadius: '48% 52% 55% 45% / 52% 46% 54% 48%', background: wash(c('highlight'), 0.8), transform: `rotate(${rr(seed, -12, 12)}deg) scale(${0.7 + 0.3 * clamp01(p * 1.5)})`, opacity: clamp01(p * 2), filter: `blur(${u * 0.35}px)`}} /> : null,
});
const Chart = makeChart({sw: 0.7, lead: 1.6, smooth: true, grid: 0, axisSw: 0.2, dot: 1.1, area: 0.2, annot: 'ring', wob: 0.1});
const Bubble = makeBubble({r: 3, sw: 0.22});

/** Pigment first, pencil second: wet-edged translucent fills under one thin, slightly loose graphite line. */
const Marks: Kit['Marks'] = ({zone, p, shapes, vb, flip, kind, seed, state}) => {
	const tx = useTx();
	return <VectorMarks shapes={shapes} vb={vb} zone={zone} p={p} seed={seed} flip={flip} kind={kind} dim={state === 'dim'} opts={{outline: 'ink', outlineAll: true, sw: tx.pencil_width, wobble: tx.wobble, fill: 'flat', fillOpacity: tx.fill_alpha, fillFilter: 'url(#wc-wet)', enter: 'fade', lineScale: 1}} />;
};

/** A pale pool under the cast so nothing floats on bare paper. */
const Decor: Kit['Decor'] = ({zones, p}) => {
	const {u} = useD();
	const c = useColor();
	const v = zones.visual_full ?? zones.visual;
	if (!v) return null;
	return <div style={{position: 'absolute', left: v.x + v.w * 0.08, top: v.y + v.h - u * 3, width: v.w * 0.84, height: u * 6, borderRadius: '50%', background: wash(c('shadow'), 0.75), opacity: clamp01(p * 2), filter: `blur(${u * 0.6}px)`}} />;
};

export const kit: Kit = {Backdrop, Headline, Label, Numeral, Marks, Chart, Decor, Finish, Bubble};
