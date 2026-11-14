import React from 'react';
import {boxPx, boxStyle, enterP, moveP, txt} from '../social/tokens';
import {lab} from '../data/tokens';
import {mix} from '../camera/tokens';
import {Card, Label, Scene, Viewport, frameOf} from './parts';
import type {KineticBase} from './tokens';

/**
 * 43 PictureDive. A picture hangs on a wall. The camera pushes through its frame on the move easing until the
 * painting fills the shot exactly (the inner scene is drawn at viewport size and hung scaled down, so it lands 1:1).
 * A foreground edge (a doorway) scales faster and blurs as it passes, so the push has depth. Inside, the scene's own
 * planes keep a slow parallax push. Labels sit on the card under the shot, never on the moving planes.
 */
export type PictureDiveProps = KineticBase & {label: string; outside: string; inside: string; diveAt?: number; diveFrames?: number; seed: string};
export const PICTURE_DIVE = {frames: 90, hero: 40, sfx: [{at: 'diveAt', id: 'zoom-swell'}, {at: 'diveAt + diveFrames', id: 'soft-chime'}]};

export const PictureDive: React.FC<PictureDiveProps> = ({tk, frame: f, box, label, outside, inside, diveAt = 16, diveFrames = 40, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const {pad, head} = frameOf(tk);
	const rowH = Math.max(tk.size.body * 1.25, lab(tk, 0.82) * 1.3);
	const foot = rowH * 2 + 14 + 60;
	const vw = W - pad * 2, vh = H - head - foot - pad;
	const pw = vw * 0.44, ph = (pw * vh) / vw;
	const pcx = vw / 2, pcy = vh * 0.42;
	const mould = Math.max(14, pw * 0.07);
	const e = moveP(tk, f, diveAt, diveFrames);
	const S1 = vw / pw;
	const S = Math.exp(Math.log(S1) * e);
	const dx = (vw / 2 - pcx) * e, dy = (vh / 2 - pcy) * e;
	const landed = e >= 1;
	const after = moveP(tk, f, diveAt + diveFrames, 40);
	const inner = 0.06 * e + 0.04 * after;
	const fx = {subject: {scale: 1 + inner}, mid: {scale: 1 + inner * 0.55}, far: {scale: 1 + inner * 0.25}};
	const dark = tk.light ? tk.c.ink : tk.c.bg;
	const wall = mix(tk.c.surface, dark, 0.35);
	const floor = mix(tk.c.surface, dark, 0.6);
	const frameFill = mix(tk.series[0], dark, 0.25);
	const near = mix(tk.c.surface, dark, 0.85);
	const nearS = Math.exp(Math.log(S1) * e * 1.7);
	const nearBlur = Math.min(tk.blurOff * 1.5, e * tk.blurOff * 2);
	const k = pw / vw;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={e > 0 ? tk.accent : tk.label}>{landed ? 'INSIDE' : e > 0 ? 'PUSH' : 'WALL'}</Label>
				</div>
				<Viewport tk={tk} x={pad} y={head} w={vw} h={vh}>
					{landed ? (
						<Scene tk={tk} w={vw} h={vh} seed={seed} fx={fx} />
					) : (
						<>
							<div style={{position: 'absolute', inset: 0, transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${S.toFixed(5)})`, transformOrigin: `${pcx}px ${pcy}px`}}>
								<div style={{position: 'absolute', left: -vw, top: -vh, width: vw * 3, height: vh * 3, background: wall}} />
								<div style={{position: 'absolute', left: -vw, top: vh * 0.84, width: vw * 3, height: vh * 2, background: floor}} />
								<div style={{position: 'absolute', left: pcx - pw * 0.3, top: pcy - ph / 2 - mould - 26, width: pw * 0.6, height: 10, borderRadius: 5, background: tk.c.highlight}} />
								<div style={{position: 'absolute', left: pcx - pw / 2 - mould, top: pcy - ph / 2 - mould, width: pw + mould * 2, height: ph + mould * 2, background: frameFill, borderRadius: Math.min(tk.plateR, 8), boxShadow: `0 ${mould * 0.6}px 0 ${mix(wall, dark, 0.5)}`}} />
								<div style={{position: 'absolute', left: pcx - pw / 2, top: pcy - ph / 2, width: pw, height: ph, overflow: 'hidden'}}>
									<div style={{position: 'absolute', left: 0, top: 0, width: vw, height: vh, transform: `scale(${k})`, transformOrigin: '0 0'}}>
										<Scene tk={tk} w={vw} h={vh} seed={seed} fx={fx} />
									</div>
								</div>
							</div>
							<div style={{position: 'absolute', inset: 0, transform: `scale(${nearS.toFixed(5)})`, transformOrigin: `${pcx}px ${pcy}px`, filter: nearBlur > 0.05 ? `blur(${nearBlur.toFixed(2)}px)` : 'none'}}>
								<div style={{position: 'absolute', left: -80, top: -80, width: 80 + vw * 0.1, height: vh + 160, background: near}} />
								<div style={{position: 'absolute', left: vw * 0.9, top: -80, width: vw * 0.1 + 80, height: vh + 160, background: near}} />
								<div style={{position: 'absolute', left: -80, top: -80, width: vw + 160, height: 80 + vh * 0.05, background: near}} />
							</div>
						</>
					)}
				</Viewport>
				<div style={{position: 'absolute', left: pad, right: pad, top: head + vh + 30, display: 'flex', flexDirection: 'column', gap: 14}}>
					{[
						['OUTSIDE', outside, !landed],
						['INSIDE', inside, landed],
					].map(([kk, t, on], i) => (
						<div key={i} style={{height: rowH, display: 'flex', alignItems: 'center', gap: 24, minWidth: 0}}>
							<Label tk={tk} color={on ? tk.accent : tk.label} style={{flex: 'none', width: lab(tk, 0.82) * 5.6}}>{kk as string}</Label>
							<span style={{...txt(tk, 'body', tk.size.body, on ? tk.text : tk.label), minWidth: 0}}>{t as string}</span>
						</div>
					))}
				</div>
			</Card>
		</div>
	);
};
