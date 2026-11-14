import React from 'react';
import {boxPx, boxStyle, enterP, moveP, txt} from '../social/tokens';
import {lab} from '../data/tokens';
import {Card, Label, Plate, Scene, Viewport} from './parts';
import {shakeAt, slamP, type CameraBase} from './tokens';

/**
 * 32 ImpactFrame. A slow push-in builds, then for `impact.frames` (2) frames the shot becomes a silhouette: the sky in
 * the impact sky role with rays from the subject, the world in the world role, the subject in the hero role. The
 * payoff word lands on its plate on the flash (it starts its slam 5 frames early), then the shot shakes by impact.shake.
 */
export type ImpactFrameProps = CameraBase & {word: string; label: string; hitAt?: number; seed: string};
export const IMPACT_FRAME = {frames: 60, hero: 15, sfx: [{at: 'hitAt', id: 'sub-bass-hit'}, {at: 'hitAt - 5', id: 'tactile-pop'}]};

export const ImpactFrame: React.FC<ImpactFrameProps> = ({tk, frame: f, box, word, label, hitAt = 14, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 8);
	const pad = 52;
	const head = pad + lab(tk, 0.82) * 1.4 + 24;
	const wordSize = Math.min(tk.numeral, 120);
	const foot = wordSize * 1.3 + 60;
	const vw = W - pad * 2, vh = H - head - foot - pad;
	const im = tk.impact;
	const flash = f >= hitAt && f < hitAt + im.frames;
	const push = 1 + 0.05 * moveP(tk, f, 0, hitAt);
	const sx = shakeAt(im.shake, f, hitAt + im.frames);
	const sy = shakeAt(im.shake.map((v) => -v * 0.5), f, hitAt + im.frames);
	const slam = slamP(tk, f, hitAt - 5);
	const sc = 1.7 - 0.7 * slam;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5)}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={tk.accent}>{flash ? `HIT ${f - hitAt + 1}/${im.frames}` : f < hitAt ? 'BUILD' : 'SHAKE'}</Label>
				</div>
				<Viewport tk={tk} x={pad} y={head} w={vw} h={vh}>
					<div style={{position: 'absolute', inset: 0, transform: `translate(${sx}px, ${sy}px) scale(${push})`, transformOrigin: '36% 70%'}}>
						<Scene
							tk={tk} w={vw} h={vh} seed={seed}
							paint={flash ? {sky: im.sky, world: im.world, subject: im.hero, rays: {color: im.rays, n: im.n, rot: (f - hitAt) * 6}} : undefined}
						/>
					</div>
				</Viewport>
				<div style={{position: 'absolute', left: pad, right: pad, top: head + vh + 30, height: foot - 30, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: f >= hitAt - 5 ? 1 : 0}}>
					<Plate tk={tk} color={tk.accent} style={{...txt(tk, 'display', wordSize, tk.accent), padding: '6px 34px', letterSpacing: 0, transform: `scale(${sc}) translateX(${sx * 0.6}px)`, overflow: 'visible'}}>{word}</Plate>
				</div>
			</Card>
		</div>
	);
};
