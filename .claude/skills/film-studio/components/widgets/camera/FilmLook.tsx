import React from 'react';
import {random} from 'remotion';
import {rgba} from '../../engine/tokens';
import {Grain} from '../../engine/marks';
import {boxPx, boxStyle, enterP} from '../social/tokens';
import {TAB, lab} from '../data/tokens';
import {Card, Label, Scene, Viewport, numCss} from './parts';
import {filmTick, type CameraBase} from './tokens';

/**
 * 35 FilmLook. A print look built up layer by layer over the shot: gate weave, grain, flicker, vignette, dust and a
 * scratch, each re-rolled at the style's film rate (paper.flicker.fps, 12). Flicker darkens by at most
 * flicker.brightness (capped at 8 percent). Dust and scratch use the text colour on the card, so they read on paper
 * and on a dark shot. A chip per layer lights as it switches on and shows its value.
 */
export type FilmLookProps = CameraBase & {label: string; onAt?: number; each?: number; seed: string};
export const FILM_LOOK = {frames: 90, hero: 62, sfx: [{at: 'onAt + i * each', id: 'click-soft'}, {at: 'every film tick', id: 'stop-tick'}]};

export const FilmLook: React.FC<FilmLookProps> = ({tk, frame: f, box, label, onAt = 8, each = 6, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 52;
	const head = pad + lab(tk, 0.82) * 1.4 + 24;
	const chipH = lab(tk, 0.72) * 1.3 + 22;
	const foot = chipH * 3 + 2 * 14 + 40;
	const vw = W - pad * 2, vh = H - head - foot - pad;
	const F = tk.flicker;
	const t = filmTick(f, F.fps);
	const r = (k: string) => random(`${seed}-${k}-${t}`);
	const on = (i: number) => f >= onAt + i * each;
	const weave = on(0) ? {x: (r('wx') - 0.5) * 2 * F.weave, y: (r('wy') - 0.5) * 2 * F.weave} : {x: 0, y: 0};
	const flick = on(2) ? r('fl') * F.brightness : 0;
	const mark = tk.on('surface').hex;
	const scratchT = Math.floor(t / 6);
	const sx = (0.15 + 0.7 * random(`${seed}-sx-${scratchT}`)) * vw;
	const chips: [string, string][] = [
		['WEAVE', `${F.weave}PX`],
		['GRAIN', tk.grain.opacity.toFixed(2)],
		['FLICKER', `${Math.round(F.brightness * 100)}%`],
		['VIGNETTE', tk.vignette.toFixed(2)],
		['DUST', `${F.specks}`],
		['SCRATCH', F.scratch.toFixed(2)],
	];
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between', gap: 24}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={tk.accent}>{`${F.fps} FPS · ${String(t % 100).padStart(2, '0')}`}</Label>
				</div>
				<Viewport tk={tk} x={pad} y={head} w={vw} h={vh}>
					<div style={{position: 'absolute', inset: -F.weave * 2, transform: `translate(${weave.x.toFixed(2)}px, ${weave.y.toFixed(2)}px)`}}>
						<Scene tk={tk} w={vw + F.weave * 4} h={vh + F.weave * 4} seed={seed} />
					</div>
					{on(1) && <Grain id={`cam-fl-${seed}`} freq={tk.grain.freq} opacity={tk.grain.opacity} octaves={tk.grain.octaves} seed={2 + (t % 7)} blend={tk.light ? 'multiply' : 'overlay'} />}
					{on(2) && <div style={{position: 'absolute', inset: 0, background: tk.shade, opacity: flick}} />}
					{on(3) && <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 48%, ${rgba(tk.shade, 0)} 52%, ${rgba(tk.shade, tk.vignette)} 100%)`}} />}
					{on(4) && (
						<svg width={vw} height={vh} style={{position: 'absolute', left: 0, top: 0}}>
							{Array.from({length: F.specks}, (_, i) => {
								const s = 2 + r(`s${i}`) * 5;
								const hair = r(`h${i}`) > 0.8;
								const x = r(`x${i}`) * vw, y = r(`y${i}`) * vh;
								return hair ? (
									<path key={i} d={`M${x},${y} q${s * 3},${s * 2} ${s * 6},${-s}`} stroke={rgba(mark, 0.55)} strokeWidth={1.5} fill="none" />
								) : (
									<circle key={i} cx={x} cy={y} r={s * 0.5} fill={rgba(mark, 0.6)} />
								);
							})}
						</svg>
					)}
					{on(5) && <div style={{position: 'absolute', top: 0, bottom: 0, left: sx + (r('sj') - 0.5) * 4, width: 2, background: rgba(mark, F.scratch * 2)}} />}
				</Viewport>
				<div style={{position: 'absolute', left: pad, right: pad, top: head + vh + 30, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: 20, rowGap: 14}}>
					{chips.map(([k, v], i) => {
						const lit = on(i);
						return (
							<div key={k} style={{height: chipH, boxSizing: 'border-box', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderRadius: Math.min(tk.plateR, 14), border: `${tk.stroke.hair}px solid ${lit ? tk.series[0] : tk.grid}`}}>
								<Label tk={tk} size={lab(tk, 0.72)} color={lit ? tk.text : tk.label} style={{letterSpacing: '0.06em'}}>{k}</Label>
								<span style={{...numCss(tk, lab(tk, 0.72), lit ? tk.accent : tk.label), ...TAB}}>{v}</span>
							</div>
						);
					})}
				</div>
			</Card>
		</div>
	);
};
