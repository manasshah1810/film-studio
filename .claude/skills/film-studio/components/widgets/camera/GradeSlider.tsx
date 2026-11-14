import React from 'react';
import {interpolate} from 'remotion';
import {boxPx, boxStyle, enterP, popP} from '../social/tokens';
import {lab} from '../data/tokens';
import {Card, Label, Plate, Scene, Viewport, numCss} from './parts';
import {type CameraBase} from './tokens';

/**
 * 37 GradeSlider. Before and after on one shot. Left of the divider is the flat log look (a CSS filter on the shot
 * only: saturate, contrast, brightness from `log`); right of it is the graded shot in the style's own palette. The
 * divider sweeps from 96 percent to 10 percent on the rack easing, then settles at `rest`. Labels sit on opaque plates.
 * The footer reads the graded share of the frame and the log settings, tabular.
 */
export type GradeSliderProps = CameraBase & {
	label: string; before?: string; after?: string; log?: {sat: number; con: number; bri: number}; rest?: number; sweepAt?: number; seed: string;
};
export const GRADE_SLIDER = {frames: 96, hero: 90, sfx: [{at: 'sweepAt', id: 'fast-whoosh'}, {at: 'sweepAt + 44', id: 'click-soft'}]};

export const GradeSlider: React.FC<GradeSliderProps> = ({tk, frame: f, box, label, before = 'LOG', after = 'GRADE', log = {sat: 0.3, con: 0.72, bri: 1.1}, rest = 0.5, sweepAt = 16, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 52;
	const head = pad + lab(tk, 0.82) * 1.4 + 24;
	const foot = tk.size.h2 * 1.2 + lab(tk, 0.82) * 1.4 + 70;
	const vw = W - pad * 2, vh = H - head - foot - pad;
	const sweep = interpolate(f, [sweepAt, sweepAt + 30], [0.96, 0.1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: tk.rack});
	const settle = popP(tk, f, sweepAt + 34);
	const x = (sweep + (rest - sweep) * settle) * vw;
	const lw = Math.max(4, tk.stroke.line);
	const hr = Math.max(34, lab(tk, 1) * 0.9);
	const flat = `saturate(${log.sat}) contrast(${log.con}) brightness(${log.bri})`;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={tk.accent}>{`${before} / ${after}`}</Label>
				</div>
				<Viewport tk={tk} x={pad} y={head} w={vw} h={vh}>
					<Scene tk={tk} w={vw} h={vh} seed={seed} />
					<div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${(vw - x).toFixed(1)}px 0 0)`}}>
						<div style={{position: 'absolute', inset: 0, filter: flat}}>
							<Scene tk={tk} w={vw} h={vh} seed={seed} />
						</div>
					</div>
					<div style={{position: 'absolute', top: 0, bottom: 0, left: x - lw / 2, width: lw, background: tk.text}} />
					<div style={{position: 'absolute', left: x - hr, top: vh / 2 - hr, width: hr * 2, height: hr * 2, borderRadius: '50%', background: tk.c.surface, border: `${lw}px solid ${tk.text}`, boxSizing: 'border-box'}}>
						<svg width={hr * 2} height={hr * 2} style={{position: 'absolute', left: -lw, top: -lw}}>
							<path d={`M${hr * 0.82},${hr * 0.66} L${hr * 0.5},${hr} L${hr * 0.82},${hr * 1.34} M${hr * 1.18},${hr * 0.66} L${hr * 1.5},${hr} L${hr * 1.18},${hr * 1.34}`} fill="none" stroke={tk.text} strokeWidth={lw} strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</div>
					<div style={{position: 'absolute', left: 24, top: 24, opacity: x > vw * 0.3 ? 1 : 0}}>
						<Plate tk={tk}>{before}</Plate>
					</div>
					<div style={{position: 'absolute', right: 24, top: 24, opacity: x < vw * 0.7 ? 1 : 0}}>
						<Plate tk={tk} color={tk.accent}>{after}</Plate>
					</div>
				</Viewport>
				<div style={{position: 'absolute', left: pad, right: pad, top: head + vh + 30, display: 'flex', justifyContent: 'space-between'}}>
					{[
						['GRADED', `${String(Math.round((1 - x / vw) * 100)).padStart(2, ' ')}%`],
						['SAT', log.sat.toFixed(2)],
						['CONTRAST', log.con.toFixed(2)],
					].map(([k, v], i) => (
						<div key={k} style={{display: 'flex', flexDirection: 'column', gap: 8, alignItems: i === 0 ? 'flex-start' : i === 2 ? 'flex-end' : 'center'}}>
							<Label tk={tk}>{i === 0 ? k : `${before} ${k}`}</Label>
							<span style={numCss(tk, tk.size.h2, i === 0 ? tk.accent : tk.text)}>{v}</span>
						</div>
					))}
				</div>
			</Card>
		</div>
	);
};
