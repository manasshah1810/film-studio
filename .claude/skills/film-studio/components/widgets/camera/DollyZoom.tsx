import React from 'react';
import {boxPx, boxStyle, enterP} from '../social/tokens';
import {lab} from '../data/tokens';
import {Brackets, Card, Label, Scene, SPOT, Viewport, numCss} from './parts';
import {rackP, type CameraBase} from './tokens';

/**
 * 33 DollyZoom. The camera pushes in from d0 to d1 while the focal length falls with it (f = f0 x d / d0), so the subject
 * holds its size and the world behind stretches away. A plane `gap` units behind the subject scales by
 * (d / (d + gap)) / (d0 / (d0 + gap)); the foreground (gap < 0) grows. Floor lines fan wider as the field of view opens.
 * Fixed brackets on the subject show it never changes size; the footer reads focal length and distance.
 */
export type DollyZoomProps = CameraBase & {label: string; dollyAt?: number; dollyFrames?: number; d0?: number; d1?: number; f0?: number; seed: string};
export const DOLLY_ZOOM = {frames: 96, hero: 78, sfx: [{at: 'dollyAt', id: 'zoom-swell'}, {at: 'dollyAt + dollyFrames', id: 'sub-bass-hit'}]};

const GAP = {near: -0.6, far: 6, mid: 2.4} as const;

export const DollyZoom: React.FC<DollyZoomProps> = ({tk, frame: f, box, label, dollyAt = 12, dollyFrames = 60, d0 = 4, d1 = 1.6, f0 = 85, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 52;
	const head = pad + lab(tk, 0.82) * 1.4 + 24;
	const foot = tk.size.h2 * 1.2 + lab(tk, 0.82) * 1.4 + 70;
	const vw = W - pad * 2, vh = H - head - foot - pad;
	const p = rackP(tk, f, dollyAt, dollyFrames);
	const d = d0 + (d1 - d0) * p;
	const rel = (gap: number) => d / (d + gap) / (d0 / (d0 + gap));
	const fov = d0 / d;
	const hz = SPOT.horizon * vh;
	const S = SPOT.subject;
	const vx = S.x * vw;
	const lines = Array.from({length: 13}, (_, i) => i - 6);
	const focal = (f0 * d) / d0;
	const fx = {far: {scale: rel(GAP.far)}, mid: {scale: rel(GAP.mid)}, near: {scale: rel(GAP.near)}};
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={tk.accent}>{p <= 0 ? 'SET' : p < 1 ? 'PUSH + ZOOM OUT' : 'HOLD'}</Label>
				</div>
				<Viewport tk={tk} x={pad} y={head} w={vw} h={vh}>
					<Scene tk={tk} w={vw} h={vh} seed={seed} span={1.2} origin={[S.x, SPOT.horizon]} fx={fx} hide={['mid', 'subject', 'near']} />
					<svg width={vw} height={vh} style={{position: 'absolute', left: 0, top: 0}}>
						{lines.map((i) => (
							<line key={i} x1={vx} y1={hz} x2={vx + i * vw * 0.16 * fov} y2={vh} stroke={tk.grid} strokeWidth={tk.stroke.hair} opacity={0.8} />
						))}
					</svg>
					<Scene tk={tk} w={vw} h={vh} seed={seed} span={1.2} origin={[S.x, SPOT.horizon]} fx={fx} hide={['sky', 'far']} />
					<Brackets x={(S.x - S.w / 2) * vw} y={S.top * vh} w={S.w * vw} h={(S.feet - S.top) * vh} color={tk.series[0]} stroke={tk.stroke.line} filter={tk.glow(tk.series[0])} />
				</Viewport>
				<div style={{position: 'absolute', left: pad, right: pad, top: head + vh + 30, display: 'flex', justifyContent: 'space-between'}}>
					{[
						['FOCAL', `${Math.round(focal)}mm`],
						['DISTANCE', `${d.toFixed(1)} m`],
						['SUBJECT', '1.00x'],
					].map(([k, v], i) => (
						<div key={k} style={{display: 'flex', flexDirection: 'column', gap: 8, alignItems: i === 0 ? 'flex-start' : i === 2 ? 'flex-end' : 'center'}}>
							<Label tk={tk}>{k}</Label>
							<span style={numCss(tk, tk.size.h2, i === 2 ? tk.text : tk.accent)}>{v}</span>
						</div>
					))}
				</div>
			</Card>
		</div>
	);
};
