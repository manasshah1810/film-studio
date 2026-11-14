import React from 'react';
import {boxPx, boxStyle, enterP, txt} from '../social/tokens';
import {lab} from '../data/tokens';
import {Brackets, Card, Label, Scene, SPOT, Viewport, numCss, type LayerId} from './parts';
import {rackP, type CameraBase} from './tokens';

/**
 * 31 RackFocus. Focus pulls from the subject to the lit tower window (and back, with `swaps` 2). Each plane's blur is
 * its distance from the focus depth times blurOff / 0.6, capped at blurOff, so the planes always blur by different
 * amounts. Focus brackets travel with the focus; the footer names the focused subject and reads the focus distance.
 */
export type RackFocusProps = CameraBase & {label: string; near: string; far: string; rackAt?: number; swaps?: 1 | 2; hold?: number; seed: string};
export const RACK_FOCUS = {frames: 96, hero: 56, sfx: [{at: 'rackAt', id: 'zoom-swell'}, {at: 'rackAt + rackFrames', id: 'click-soft'}]};

const DEPTH: Record<LayerId, number> = {near: 0, subject: 0.25, mid: 0.6, far: 0.85, sky: 1};
const D_NEAR = 1.8, D_FAR = 12;

export const RackFocus: React.FC<RackFocusProps> = ({tk, frame: f, box, label, near, far, rackAt = 20, swaps = 1, hold = 30, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 52;
	const head = pad + lab(tk, 0.82) * 1.4 + 24;
	const foot = Math.max(lab(tk, 0.82), tk.size.body) * 2 + 2 * 18 + 40;
	const vw = W - pad * 2, vh = H - head - foot - pad;
	const p = rackP(tk, f, rackAt) - (swaps === 2 ? rackP(tk, f, rackAt + tk.rackFrames + hold) : 0);
	const focus = DEPTH.subject + (DEPTH.mid - DEPTH.subject) * p;
	const k = tk.blurOff / 0.6;
	const fx = Object.fromEntries((Object.keys(DEPTH) as LayerId[]).map((id) => [id, {blur: Math.min(tk.blurOff, Math.abs(DEPTH[id] - focus) * k)}]));
	const S = SPOT.subject, Wn = SPOT.window;
	const a = {x: (S.x - S.w / 2) * vw, y: S.top * vh, w: S.w * vw, h: (S.feet - S.top) * vh};
	const b = {x: (Wn.x - 0.06) * vw, y: (Wn.y - 0.06) * vh, w: 0.12 * vw, h: 0.12 * vh};
	const lerp = (u: number, v: number) => u + (v - u) * p;
	const r = {x: lerp(a.x, b.x), y: lerp(a.y, b.y), w: lerp(a.w, b.w), h: lerp(a.h, b.h)};
	const dist = D_NEAR + (D_FAR - D_NEAR) * p;
	const rows: [string, boolean][] = [[near, p < 0.5], [far, p >= 0.5]];
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={tk.accent}>{`RACK ${tk.rackFrames}F`}</Label>
				</div>
				<Viewport tk={tk} x={pad} y={head} w={vw} h={vh}>
					<Scene tk={tk} w={vw} h={vh} seed={seed} fx={fx} />
					<Brackets x={r.x} y={r.y} w={r.w} h={r.h} color={tk.series[0]} stroke={tk.stroke.line} len={Math.min(r.w, r.h) * 0.25} filter={tk.glow(tk.series[0])} />
				</Viewport>
				<div style={{position: 'absolute', left: pad, right: pad, top: head + vh + 30, display: 'flex', alignItems: 'center', gap: 30}}>
					<div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 18}}>
						{rows.map(([t, on], i) => (
							<div key={i} style={{display: 'flex', alignItems: 'center', gap: 18}}>
								<div style={{width: 22, height: 22, borderRadius: 99, flex: 'none', background: on ? tk.series[0] : 'transparent', border: `${tk.stroke.hair}px solid ${on ? tk.series[0] : tk.grid}`}} />
								<span style={{...txt(tk, 'body', tk.size.body * 0.86, on ? tk.text : tk.label)}}>{t}</span>
							</div>
						))}
					</div>
					<div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6}}>
						<Label tk={tk}>FOCUS</Label>
						<span style={numCss(tk, tk.size.h2, tk.accent)}>{`${dist.toFixed(1)} m`}</span>
					</div>
				</div>
			</Card>
		</div>
	);
};
