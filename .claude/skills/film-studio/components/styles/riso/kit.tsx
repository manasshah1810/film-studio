import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Kit} from '../../engine/types';
import {clamp01, pick, rr, useColor, useD} from '../../engine/tokens';
import {makeBubble, makeChart, makeHeadline, makeLabel, makeNumeral} from '../../engine/base';
import {Halftone} from '../../engine/fx';
import {Grain, VectorMarks} from '../../engine/marks';

const useTx = () => useD().design.system.textures as Record<string, number>;

/** Two flat ink plates overprinted on stock: where they overlap they multiply into a third colour. */
const Backdrop: Kit['Backdrop'] = ({panel}) => {
	const {design, W, H, u} = useD();
	const c = useColor(), tx = useTx();
	const sd = `${design.seed}-${panel.id}`;
	const S = Math.min(W, H) * tx.shape_scale;
	const corner = pick(sd + 'c', [[0.78, 0.14], [0.2, 0.16], [0.8, 0.8], [0.18, 0.84]]);
	const plate: React.CSSProperties = {position: 'absolute', mixBlendMode: 'multiply', opacity: tx.overprint_opacity};
	return (
		<AbsoluteFill style={{background: c('bg'), isolation: 'isolate'}}>
			<div style={{...plate, left: W * corner[0] - S / 2, top: H * corner[1] - S / 2, width: S, height: S, borderRadius: '50%', background: c('highlight')}} />
			<div style={{...plate, left: W * corner[0] - S * rr(sd + 'o', 0.75, 0.95), top: H * corner[1] - S * 0.1, width: S * 0.9, height: S * 0.62, background: c('shadow'), transform: `rotate(${rr(sd + 'r', -14, 14)}deg)`}} />
			<Halftone id={`rs-h-${panel.id}`} color={c(panel.accent ?? 'primary')} cell={u * tx.dot_cell} r={0.34} angle={15} opacity={tx.dot_opacity} mask={`linear-gradient(${corner[1] > 0.5 ? 200 : 20}deg, #000 0%, transparent 46%)`} style={{mixBlendMode: 'multiply'}} />
		</AbsoluteFill>
	);
};
const Finish: Kit['Finish'] = ({panel}) => {
	const tx = useTx();
	return <Grain id={`rs-g-${panel.id}`} freq={tx.grain_freq} opacity={tx.grain_opacity} octaves={3} />;
};

/** The second plate never lands exactly: display type carries a secondary-colour ghost down and right. */
const misreg = (col: string, k: number) => ({textShadow: `${k}em ${k * 0.7}em 0 ${col}`});
const Headline = makeHeadline({enter: 'rise', em: 'color', css: ({c, level}) => (level === 'h2' ? {} : misreg(c('secondary'), 0.045))});
const Label = makeLabel({kicker: 'bar', enter: 'rise'});
const Numeral = makeNumeral({
	enter: 'rise',
	css: ({c, col}) => (col === c('secondary') ? misreg(c('primary'), 0.04) : misreg(c('secondary'), 0.04)),
	deco: ({w, h, p, c, big, seed}) => big ? <div style={{position: 'absolute', left: w * 0.5 - h * 0.62 + rr(seed, -0.2, 0.2) * w, top: -h * 0.12, width: h * 1.24, height: h * 1.24, borderRadius: '50%', background: c('highlight'), mixBlendMode: 'multiply', transform: `scale(${clamp01(p * 1.6)})`}} /> : null,
});
const Chart = makeChart({sw: 1, lead: 1.5, cap: 'butt', grid: 0, barOpacity: 0.88, axisSw: 0.4, dot: 1.3, annot: 'dot'});
const Bubble = makeBubble({r: 0.8, fill: 'highlight', stroke: null, shadow: 'secondary'});

/** Flat shapes with no outline; a secondary-ink copy sits a hair off underneath, like a plate out of register. */
const Marks: Kit['Marks'] = ({zone, p, shapes, vb, flip, kind, seed, state}) => {
	const {u} = useD();
	const c = useColor(), tx = useTx();
	return <VectorMarks shapes={shapes} vb={vb} zone={zone} p={p} seed={seed} flip={flip} kind={kind} dim={state === 'dim'} opts={{outline: null, fill: 'flat', enter: 'slide', lineScale: 1.9, cap: 'butt', shadow: {dx: u * tx.misreg, dy: u * tx.misreg * 0.7, color: c('secondary'), opacity: tx.ghost_opacity}}} />;
};

export const kit: Kit = {Backdrop, Headline, Label, Numeral, Marks, Chart, Finish, Bubble};
