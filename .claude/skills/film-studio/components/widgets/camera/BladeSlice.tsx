import React from 'react';
import {boxPx, boxStyle, enterP, txt} from '../social/tokens';
import {lab} from '../data/tokens';
import {Card, Label, Scene, Viewport, halfPoly, polyCss} from './parts';
import {whipP, type CameraBase} from './tokens';

/**
 * 34 BladeSlice. A diagonal cut transition. A blade of light runs along the cut line on the whip easing, then the two
 * halves of shot A slide apart along the cut's normal and reveal shot B (the same place at night) underneath. The halves
 * are clip-path polygons, so the cut edge stays hard; each carries a rim line of the strike colour on its cut face.
 */
export type BladeSliceProps = CameraBase & {label: string; from: string; to: string; angle?: number; cutAt?: number; seed: string};
export const BLADE_SLICE = {frames: 72, hero: 24, sfx: [{at: 'cutAt - 6', id: 'fast-whoosh'}, {at: 'cutAt + 10', id: 'tactile-pop'}]};

export const BladeSlice: React.FC<BladeSliceProps> = ({tk, frame: f, box, label, from, to, angle = -24, cutAt = 10, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 52;
	const head = pad + lab(tk, 0.82) * 1.4 + 24;
	const rowH = Math.max(tk.size.body * 1.25, lab(tk, 0.82) * 1.3);
	const foot = rowH * 2 + 14 + 60;
	const vw = W - pad * 2, vh = H - head - foot - pad;
	const cx = vw / 2, cy = vh / 2;
	const a = (angle * Math.PI) / 180;
	const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
	const L = Math.hypot(vw, vh) * 0.62;
	const blade = whipP(tk, f, cutAt, 10);
	const split = whipP(tk, f, cutAt + 10, 22);
	const D = Math.hypot(vw, vh) * 0.55 * split;
	const slide = 60 * split;
	const B = 80;
	const rimW = Math.max(3, tk.stroke.line);
	const halves = ([-1, 1] as const).map((side) => {
		const dx = side * nx * D - side * ux * slide, dy = side * ny * D - side * uy * slide;
		return (
			<div key={side} style={{position: 'absolute', inset: 0, transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`, clipPath: polyCss(halfPoly(vw, vh, cx, cy, angle, side, B))}}>
				<Scene tk={tk} w={vw} h={vh} seed={seed} />
				{split > 0 && (
					<svg width={vw} height={vh} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
						<line x1={cx - ux * L * 2} y1={cy - uy * L * 2} x2={cx + ux * L * 2} y2={cy + uy * L * 2} stroke={tk.strike} strokeWidth={rimW * 2} />
					</svg>
				)}
			</div>
		);
	});
	const x0 = cx - ux * L, y0 = cy - uy * L;
	const len = 2 * L * blade;
	const tail = 2 * L * Math.max(0, blade - 0.35);
	const done = split >= 1;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={tk.accent}>{`CUT ${Math.abs(angle)}°`}</Label>
				</div>
				<Viewport tk={tk} x={pad} y={head} w={vw} h={vh}>
					<Scene tk={tk} w={vw} h={vh} seed={`${seed}-b`} night />
					{!done && halves}
					{blade > 0 && split < 0.4 && (
						<svg width={vw} height={vh} style={{position: 'absolute', left: 0, top: 0, filter: tk.glow(tk.strike), opacity: 1 - split * 2.5}}>
							<line x1={x0 + ux * tail} y1={y0 + uy * tail} x2={x0 + ux * len} y2={y0 + uy * len} stroke={tk.strike} strokeWidth={rimW * 1.6} strokeLinecap="round" />
							<circle cx={x0 + ux * len} cy={y0 + uy * len} r={rimW * 2.6} fill={tk.strike} />
						</svg>
					)}
				</Viewport>
				<div style={{position: 'absolute', left: pad, right: pad, top: head + vh + 30, display: 'flex', flexDirection: 'column', gap: 14}}>
					{[
						['SHOT A', from, split < 0.5],
						['SHOT B', to, split >= 0.5],
					].map(([k, t, on], i) => (
						<div key={i} style={{height: rowH, display: 'flex', alignItems: 'center', gap: 24, minWidth: 0}}>
							<Label tk={tk} color={on ? tk.accent : tk.label} style={{flex: 'none', width: lab(tk, 0.82) * 5.2}}>{k as string}</Label>
							<span style={{...txt(tk, 'body', tk.size.body, on ? tk.text : tk.label), minWidth: 0}}>{t as string}</span>
						</div>
					))}
				</div>
			</Card>
		</div>
	);
};
