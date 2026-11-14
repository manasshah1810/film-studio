import React from 'react';
import {interpolate} from 'remotion';
import {rgba} from '../../engine/tokens';
import {boxPx, boxStyle, enterP, moveP, popP} from '../social/tokens';
import {lab, lockP} from '../data/tokens';
import {Brackets, Card, Label, Scene, SPOT, Viewport, numCss} from './parts';
import {type CameraBase} from './tokens';

/**
 * 36 LensRing. A lens opens over the shot, travels to the lit tower window and magnifies it `zoom` times inside a
 * circle (a second copy of the shot, scaled about the lens centre and clipped to it), which shows the figure standing in
 * the window. A crosshair with a centre gap and a rim with a radial gradient sit on top; a lock box snaps on when the
 * magnification settles. The footer reads the zoom and the lens position, tabular.
 */
export type LensRingProps = CameraBase & {label: string; caption: string; zoom?: number; moveAt?: number; moveFrames?: number; seed: string};
export const LENS_RING = {frames: 96, hero: 82, sfx: [{at: 4, id: 'tactile-pop'}, {at: 'moveAt + moveFrames', id: 'digital-tick'}, {at: 'moveAt + moveFrames + 10', id: 'click-soft'}]};

export const LensRing: React.FC<LensRingProps> = ({tk, frame: f, box, label, caption, zoom = 2.2, moveAt = 14, moveFrames = 36, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 52;
	const head = pad + lab(tk, 0.82) * 1.4 + 24;
	const foot = tk.size.h2 * 1.2 + lab(tk, 0.82) * 1.4 + tk.size.body * 1.4 + 80;
	const vw = W - pad * 2, vh = H - head - foot - pad;
	const R = Math.min(vw, vh) * 0.26 * popP(tk, f, 4);
	const m = moveP(tk, f, moveAt, moveFrames);
	const start = {x: 0.3, y: 0.3};
	const tx = start.x + (SPOT.window.x - start.x) * m;
	const ty = start.y + (SPOT.window.y - start.y) * m + Math.sin(m * Math.PI) * 0.06;
	const cx = tx * vw, cy = ty * vh;
	const lock = lockP(tk, f, moveAt + moveFrames);
	const z = 1 + (zoom - 1) * Math.min(1, lock);
	const box2 = R * 0.62 * interpolate(lock, [0, 1], [1.6, 1]);
	const gap = R * 0.18;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={tk.accent}>{lock > 0.5 ? 'LOCK' : m > 0 ? 'TRACK' : 'SCAN'}</Label>
				</div>
				<Viewport tk={tk} x={pad} y={head} w={vw} h={vh}>
					<Scene tk={tk} w={vw} h={vh} seed={seed} />
					{R > 1 && (
						<>
							<div style={{position: 'absolute', inset: 0, clipPath: `circle(${R.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`}}>
								<div style={{position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: `${cx}px ${cy}px`}}>
									<Scene tk={tk} w={vw} h={vh} seed={seed} />
								</div>
								<div style={{position: 'absolute', left: cx - R, top: cy - R, width: R * 2, height: R * 2, borderRadius: '50%', background: `radial-gradient(circle, ${rgba(tk.shade, 0)} 62%, ${rgba(tk.shade, 0.45)} 100%)`}} />
							</div>
							<svg width={vw} height={vh} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
								<circle cx={cx} cy={cy} r={R} fill="none" stroke={tk.series[0]} strokeWidth={tk.stroke.line} style={{filter: tk.glow(tk.series[0])}} />
								<circle cx={cx} cy={cy} r={R + tk.stroke.line * 2.5} fill="none" stroke={tk.grid} strokeWidth={tk.stroke.hair} />
								<g stroke={tk.series[0]} strokeWidth={tk.stroke.hair}>
									<line x1={cx - R * 0.9} y1={cy} x2={cx - gap} y2={cy} />
									<line x1={cx + gap} y1={cy} x2={cx + R * 0.9} y2={cy} />
									<line x1={cx} y1={cy - R * 0.9} x2={cx} y2={cy - gap} />
									<line x1={cx} y1={cy + gap} x2={cx} y2={cy + R * 0.9} />
								</g>
							</svg>
							{lock > 0.02 && <Brackets x={cx - box2} y={cy - box2} w={box2 * 2} h={box2 * 2} color={tk.series[1]} stroke={tk.stroke.line} opacity={Math.min(1, lock * 2)} />}
						</>
					)}
				</Viewport>
				<div style={{position: 'absolute', left: pad, right: pad, top: head + vh + 30, display: 'flex', flexDirection: 'column', gap: 18}}>
					<div style={{display: 'flex', justifyContent: 'space-between'}}>
						{[
							['ZOOM', `${z.toFixed(1)}x`],
							['X', tx.toFixed(2)],
							['Y', ty.toFixed(2)],
						].map(([k, v], i) => (
							<div key={k} style={{display: 'flex', flexDirection: 'column', gap: 8, alignItems: i === 0 ? 'flex-start' : i === 2 ? 'flex-end' : 'center'}}>
								<Label tk={tk}>{k}</Label>
								<span style={numCss(tk, tk.size.h2, i === 0 ? tk.accent : tk.text)}>{v}</span>
							</div>
						))}
					</div>
					<Label tk={tk} size={lab(tk, 0.82)} style={{opacity: Math.min(1, lock * 2), textTransform: 'none', letterSpacing: '0.02em'}}>{caption}</Label>
				</div>
			</Card>
		</div>
	);
};
