import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Kit, Role, Shape} from '../../engine/types';
import {clamp01, mix, rgba, rr, useColor, useD} from '../../engine/tokens';
import {makeBubble, makeChart, makeHeadline, makeLabel, makeNumeral} from '../../engine/base';
import {Vignette} from '../../engine/fx';
import {Grain, VectorMarks} from '../../engine/marks';

const useTx = () => useD().design.system.textures as Record<string, number>;

/** A dark room: one shaft of light through venetian blinds, falling off into black. */
const Backdrop: Kit['Backdrop'] = ({panel}) => {
	const {design, W, H, u} = useD();
	const c = useColor(), tx = useTx();
	const sd = `${design.seed}-${panel.id}`;
	const ang = rr(sd + 'a', -tx.shaft_angle, tx.shaft_angle) || 12;
	const x = rr(sd + 'x', 0.15, 0.6);
	const gap = u * tx.blind_gap;
	const slats = `repeating-linear-gradient(${90 + ang}deg, #000 0, #000 ${gap * 0.56}px, transparent ${gap * 0.56}px, transparent ${gap}px)`;
	return (
		<AbsoluteFill style={{background: `linear-gradient(${180 + ang}deg, ${mix(c('bg'), c('shadow'), 0.28)} 0%, ${c('bg')} 58%, ${mix(c('bg'), '#000000', 0.5)} 100%)`}}>
			<div style={{position: 'absolute', left: W * x - Math.min(W, H) * 0.24, top: -H * 0.2, width: Math.min(W, H) * 0.48, height: H * 1.4, transform: `rotate(${ang}deg)`, background: `linear-gradient(90deg, transparent, ${rgba(c('highlight'), tx.shaft_opacity)} 30%, ${rgba(c('highlight'), tx.shaft_opacity)} 70%, transparent)`, WebkitMaskImage: slats, maskImage: slats, filter: `blur(${u * 0.5}px)`}} />
		</AbsoluteFill>
	);
};
const Finish: Kit['Finish'] = ({panel, t}) => {
	const c = useColor(), tx = useTx();
	return (
		<>
			<Vignette color={mix(c('bg'), '#000000', 0.7)} inner={38} strength={tx.vignette} />
			<Grain id={`nr-g-${panel.id}`} freq={tx.grain_freq} opacity={tx.grain_opacity} blend="overlay" seed={2 + (Math.floor(t / 2) % 5)} />
		</>
	);
};

const Headline = makeHeadline({enter: 'type', em: 'color', css: ({c}) => ({textShadow: `0 0 0.5em ${rgba(c('bg'), 0.9)}`})});
const Label = makeLabel({kicker: 'rule', enter: 'type', attrib: '- '});
const Numeral = makeNumeral({
	enter: 'fade',
	css: ({c}) => ({textShadow: `0 0 0.35em ${rgba(c('highlight'), 0.35)}`}),
	deco: ({w, h, p, u, c, big}) => big ? <div style={{position: 'absolute', left: 0, top: h * 1.02, width: w * clamp01(p * 1.4), height: Math.max(1.5, u * 0.22), background: c('ink')}} /> : null,
});
const Chart = makeChart({sw: 0.5, lead: 1.8, cap: 'butt', grid: 0, axisSw: 0.16, dot: 0.9, annot: 'flag', labelFont: 'mono'});
const Bubble = makeBubble({r: 0, fill: 'bg', sw: 0.18});

/** Silhouettes: everything collapses to the shadow tone except the one accent, then gets a rim of light on the lit side. */
const Marks: Kit['Marks'] = ({zone, p, shapes, vb, flip, kind, seed, state}) => {
	const {u} = useD();
	const c = useColor(), tx = useTx();
	const color = (r: Role, s: Shape) => {
		if (kind === 'figure') return s.tag === 'acc' ? c('primary') : s.tag === 'face' ? c('bg') : c('shadow');
		return r === 'primary' ? c('primary') : r === 'ink' ? c('ink') : r === 'bg' ? c('bg') : r === 'highlight' ? c('highlight') : c('shadow');
	};
	return <VectorMarks shapes={shapes} vb={vb} zone={zone} p={p} seed={seed} flip={flip} kind={kind} dim={state === 'dim'} opts={{outline: null, fill: 'flat', enter: 'fade', lineScale: 1.8, cap: 'butt', color, shadow: {dx: -u * tx.rim * (flip ? -1 : 1), dy: -u * tx.rim * 0.5, color: c('highlight'), opacity: tx.rim_opacity}}} />;
};

/** A hard pool of light on the floor under the subject. */
const Decor: Kit['Decor'] = ({zones, p}) => {
	const {u} = useD();
	const c = useColor(), tx = useTx();
	const v = zones.visual_full ?? zones.visual;
	if (!v) return null;
	return <div style={{position: 'absolute', left: v.x - v.w * 0.05, top: v.y + v.h - u * 2.4, width: v.w * 1.1, height: u * 5.5, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba(c('highlight'), tx.shaft_opacity * 1.6)}, transparent)`, opacity: clamp01(p * 2)}} />;
};

export const kit: Kit = {Backdrop, Headline, Label, Numeral, Marks, Chart, Decor, Finish, Bubble};
