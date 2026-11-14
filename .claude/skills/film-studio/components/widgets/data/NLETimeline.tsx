import React from 'react';
import {mix} from '../../engine/tokens';
import {boxPx, boxStyle, enterP, lin, popP, txt} from '../social/tokens';
import {Card, Label, numCss} from './parts';
import {TAB, drawP, timecode, type DataBase, lab} from './tokens';

/**
 * 29 NLETimeline. An edit timeline: a ruler in years, clips on 2 or 3 tracks, a playhead scrubs from the first year to the
 * last. The year readout and SMPTE timecode run with it, and each clip lights as the playhead enters it.
 */
export type Clip = {label: string; start: number; end: number; track: number};
export type NLETimelineProps = DataBase & {title: string; span: [number, number]; clips: Clip[]; tracks?: string[]; scrubAt?: number; scrubFrames?: number; seed: string};
export const NLE_TIMELINE = {frames: 110, hero: 104, sfx: [{at: 'clip i build', id: 'card-flick'}, {at: 'playhead enters clip', id: 'click-soft'}]};

export const NLETimeline: React.FC<NLETimelineProps> = ({tk, frame: f, box, title, span: [y0, y1], clips, tracks = ['V2', 'V1', 'A1'], scrubAt = 30, scrubFrames = 66}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 44;
	const headW = 84;
	const tx = pad + headW, tw = W - tx - pad;
	const ruler = pad + 190;
	const trackH = Math.min(96, (H - ruler - 70 - pad - 80) / tracks.length);
	const x = (yr: number) => tx + ((yr - y0) / (y1 - y0)) * tw;
	const p = drawP(tk, f, scrubAt, scrubFrames);
	const yr = y0 + (y1 - y0) * p;
	const px = x(yr);
	// Tick step: about 8 ticks, widened so 4-digit years at the label size never touch (mono advance about 0.62em, 24 px gap).
	const tfs = lab(tk, 0.66);
	const minStep = Math.ceil(((tfs * 0.62 * 4 + 24) / tw) * (y1 - y0));
	const step = [1, 2, 5, 10, 20, 25, 50].find((s) => s >= Math.max(Math.round((y1 - y0) / 8), minStep)) ?? 50;
	const t0 = Math.ceil(y0 / step) * step;
	const ticks = Array.from({length: Math.floor((y1 - t0) / step) + 1}, (_, i) => t0 + i * step);
	const tc = Math.round(p * (y1 - y0) * 30 * 4);
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
					<div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
						<Label tk={tk}>{title}</Label>
						<span style={{...numCss(tk, tk.numeral * 0.82, tk.accent)}}>{Math.floor(yr + 1e-6)}</span>
					</div>
					<div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8}}>
						<Label tk={tk}>TC</Label>
						<span style={{...numCss(tk, tk.size.label, tk.text)}}>{timecode(tc)}</span>
					</div>
				</div>
				<div style={{position: 'absolute', left: tx, width: tw, top: ruler - 4, height: 2, background: tk.grid}} />
				{ticks.map((t, i) => (
					<React.Fragment key={t}>
						<div style={{position: 'absolute', left: x(t) - 1, top: ruler, width: 2, height: 16, background: tk.grid, opacity: lin(f, 4 + i, 10 + i)}} />
						<span style={{position: 'absolute', left: x(t) - 50, width: 100, textAlign: 'center', top: ruler + 20, ...txt(tk, 'mono', tfs, tk.label), ...TAB, opacity: lin(f, 4 + i, 10 + i)}}>{t}</span>
					</React.Fragment>
				))}
				{tracks.map((name, ti) => {
					const ty = ruler + 70 + ti * trackH;
					return (
						<React.Fragment key={name}>
							<span style={{position: 'absolute', left: pad, top: ty, height: trackH - 12, display: 'flex', alignItems: 'center', ...txt(tk, 'mono', lab(tk, 0.72), tk.label)}}>{name}</span>
							<div style={{position: 'absolute', left: tx, width: tw, top: ty, height: trackH - 12, background: tk.well, borderRadius: Math.min(tk.plateR, 8)}} />
						</React.Fragment>
					);
				})}
				{clips.map((c, i) => {
					const ty = ruler + 70 + c.track * trackH;
					const build = popP(tk, f, 8 + i * Math.max(3, tk.stagger - 2));
					const hot = yr >= c.start && yr <= c.end + 1e-6 && p > 0;
					const past = yr > c.end;
					const fill = hot ? tk.series[0] : mix(tk.c.surface, tk.series[0], past ? 0.4 : 0.22);
					const w = x(c.end) - x(c.start) - 4;
					return (
						<div key={c.label} style={{position: 'absolute', left: x(c.start) + 2, top: ty, width: w, height: trackH - 12, background: fill, borderRadius: Math.min(tk.plateR, 8), transform: `scaleY(${build})`, opacity: Math.min(1, build * 2), display: 'flex', alignItems: 'center', padding: '0 10px', boxSizing: 'border-box', overflow: 'hidden', filter: hot ? tk.glow(tk.series[0]) : 'none'}}>
							<span style={{...txt(tk, 'body', lab(tk, 0.78), hot ? tk.onSeries : tk.text)}}>{c.label}</span>
						</div>
					);
				})}
				<div style={{position: 'absolute', left: px - tk.stroke.hair, top: ruler - 30, width: tk.stroke.hair * 2, height: 70 + tracks.length * trackH + 20, background: tk.series[1], opacity: lin(f, scrubAt - 8, scrubAt)}} />
				<div style={{position: 'absolute', left: px - 14, top: ruler - 40, width: 28, height: 24, background: tk.series[1], clipPath: 'polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%)', opacity: lin(f, scrubAt - 8, scrubAt)}} />
			</Card>
		</div>
	);
};
