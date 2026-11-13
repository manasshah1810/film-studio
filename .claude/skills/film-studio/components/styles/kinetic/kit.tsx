import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Kit, Role} from '../../engine/types';
import {clamp01, fontCss, rr, useColor, useD} from '../../engine/tokens';
import {makeBubble, makeChart, makeHeadline, makeLabel, makeNumeral} from '../../engine/base';
import {VectorMarks} from '../../engine/marks';

const useTx = () => useD().design.system.textures as Record<string, number>;

/** Type is the picture: a cropped giant ghost glyph, one slab of colour, nothing else. */
const Backdrop: Kit['Backdrop'] = ({panel, t, dur}) => {
	const {design, W, H, u} = useD();
	const c = useColor(), tx = useTx();
	const sd = `${design.seed}-${panel.id}`;
	const s = panel.slots;
	const word = (s.stat?.value ?? s.emphasis ?? s.headline ?? s.quote?.text ?? '?').trim();
	const glyph = word.replace(/[^\p{L}\p{N}%?!]/gu, '').charAt(0).toUpperCase() || '?';
	const size = Math.max(W, H) * tx.ghost_size;
	const slabH = H * rr(sd + 'sh', tx.slab_min, tx.slab_max);
	const top = rr(sd + 'st', 0, 1) > 0.5;
	const drift = (t / Math.max(1, dur)) * u * tx.drift;
	return (
		<AbsoluteFill style={{background: c('bg'), overflow: 'hidden'}}>
			<div style={{position: 'absolute', left: 0, right: 0, [top ? 'top' : 'bottom']: 0, height: slabH, background: c('shadow')}} />
			<div style={{position: 'absolute', left: W * rr(sd + 'gx', -0.12, 0.3) - drift, top: H * rr(sd + 'gy', 0.02, 0.4) - size * 0.2, ...fontCss({...design.fonts.display, case: 'none'}, size), lineHeight: 1, color: 'transparent', WebkitTextStroke: `${u * tx.ghost_stroke}px ${c('secondary')}`, opacity: tx.ghost_opacity, whiteSpace: 'nowrap'}}>{glyph}</div>
		</AbsoluteFill>
	);
};

const Headline = makeHeadline({
	enter: 'slam', em: 'box',
	after: ({zone, fit, left, p, u, c, accent, level}) => level === 'h2' ? null : <div style={{position: 'absolute', left, top: zone.y + fit.lines.length * fit.lineH + u * 0.4, width: u * 14 * clamp01(p * 2 - 1), height: u * 1.3, background: c(accent ?? 'primary')}} />,
});
const Label = makeLabel({kicker: 'slash', enter: 'type', kickerFont: 'mono'});
const Numeral = makeNumeral({enter: 'rise', fill: 0.98, css: () => ({letterSpacing: '-0.04em'})});
const Chart = makeChart({sw: 1.3, lead: 1.6, cap: 'butt', axis: false, barOpacity: 1, annot: 'flag', labelFont: 'mono', nameFont: 'display', labelSize: 2.8});
const Bubble = makeBubble({r: 0, fill: 'primary', stroke: null, font: 'accent'});

/** No characters, only signs: every figure is one flat silhouette in a single palette colour. */
const Marks: Kit['Marks'] = ({zone, p, shapes, vb, flip, kind, seed, state}) => {
	const c = useColor();
	const body = shapes.find((s) => s.tag === 'body');
	const role: Role = kind === 'figure' ? ((body?.fill && body.fill !== 'none' ? body.fill : 'primary') as Role) : 'ink';
	const flat = shapes.filter((s) => s.tag !== 'face' && s.tag !== 'hair').map((s) => (kind === 'figure' ? {...s, fill: s.t === 'line' || s.fill === 'none' ? s.fill : role, stroke: s.t === 'line' ? role : undefined} : s));
	return <VectorMarks shapes={flat} vb={vb} zone={zone} p={p} seed={seed} flip={flip} kind={kind} dim={state === 'dim'} opts={{outline: null, fill: 'flat', enter: 'cut', lineScale: 2.4, cap: 'butt', color: kind === 'figure' ? () => c(role) : undefined}} />;
};

export const kit: Kit = {Backdrop, Headline, Label, Numeral, Marks, Chart, Bubble};
