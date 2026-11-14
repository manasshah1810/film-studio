import React from 'react';
import {random} from 'remotion';
import {boxPx, boxStyle, enterP, lin, moveP, popP, txt} from '../social/tokens';
import {Halftone, Paper, type Subject} from './parts';
import {jit, type EditorialBase} from './tokens';

/** 12 PressFront. A made-up front page: masthead, rules draw out, headline words drop in, then a marker sweeps the key phrase. */
export type PressFrontProps = EditorialBase & {paper: string; date: string; edition: string; headline: string; deck: string; caption: string; mark?: string; subject?: Subject; seed: string; markAt?: number};
export const PRESS_FRONT = {frames: 90, hero: 84, sfx: [{at: 0, id: 'card-flick'}, {at: 16, id: 'tactile-pop'}, {at: 'markAt', id: 'marker-stroke'}]};

export const PressFront: React.FC<PressFrontProps> = ({tk, frame: f, box, paper, date, edition, headline, deck, caption, mark, subject = 'crowd', seed, markAt = 56}) => {
	const {width: W, height: H} = boxPx(box);
	const pad = 48;
	const inn = enterP(tk, f, 0, 14);
	const rule = moveP(tk, f, 8, 14);
	const mSize = Math.min(104, ((W - pad * 2) / Math.max(6, paper.length)) * 1.45);
	const words = headline.split(' ');
	const mw = mark ? mark.split(' ') : [];
	const mStart = mark ? words.findIndex((_, i) => words.slice(i, i + mw.length).join(' ') === mark) : -1;
	const sweep = moveP(tk, f, markAt, 24) * Math.max(1, mw.length);
	const photoFix = 330;
	const colTop = H - pad - 50 - photoFix;
	const photoW = (W - pad * 2) * 0.54;
	const photoH = photoFix;
	return (
		<div style={{...boxStyle(box), overflow: 'visible', opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 70}px) rotate(${-1 + (1 - inn) * 3}deg)`}}>
			<Paper tk={tk} w={W} h={H} seed={seed}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad - 6, textAlign: 'center', opacity: lin(f, 4, 10)}}>
					<span style={{...txt(tk, 'display', mSize, tk.text), lineHeight: 1.1, overflow: 'visible'}}>{paper}</span>
				</div>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad + mSize * 1.14, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center'}}>
					<div style={{width: `${rule * 100}%`, height: tk.rule.thick, background: tk.text}} />
					<div style={{width: `${rule * 100}%`, height: tk.rule.thin, background: tk.text}} />
				</div>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad + mSize * 1.14 + 22, display: 'flex', justifyContent: 'space-between', opacity: lin(f, 10, 16)}}>
					<span style={txt(tk, 'mono', tk.size.label * 0.78, tk.text)}>{date}</span>
					<span style={txt(tk, 'mono', tk.size.label * 0.78, tk.text)}>{edition}</span>
				</div>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad + mSize * 1.14 + 84, transform: jit(tk, f, `${seed}h`)}}>
					<div style={{display: 'flex', flexWrap: 'wrap', columnGap: tk.h1 * 0.24, rowGap: 4}}>
						{words.map((w, i) => {
							const p = popP(tk, f, 16 + i * 3);
							const k = mStart >= 0 && i >= mStart && i < mStart + mw.length ? i - mStart : -1;
							const m = k >= 0 ? Math.max(0, Math.min(1, sweep - k)) : 0;
							const last = k === mw.length - 1;
							const multiply = tk.marker.blend === 'multiply';
							return (
								<span key={i} style={{position: 'relative', display: 'inline-block', opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * -36}px)`}}>
									{m > 0 ? (
										<span style={{position: 'absolute', left: -8, top: `${(1 - tk.marker.height) * 50 + 4}%`, height: `${tk.marker.height * 100}%`, width: `calc(${m * 100}% + ${last ? 16 : tk.h1 * 0.24 + 8}px)`, background: tk.marker.hex, mixBlendMode: multiply ? 'multiply' : 'normal', zIndex: multiply ? 2 : 0, clipPath: tk.marker.jitter ? `polygon(0 ${random(`${seed}${i}a`) * 8}%, 100% 0, 100% 100%, 0 ${100 - random(`${seed}${i}b`) * 8}%)` : undefined}} />
									) : null}
									<span style={{...txt(tk, 'display', tk.h1, tk.text), position: 'relative', zIndex: 1, lineHeight: 1.02, overflow: 'visible'}}>{w}</span>
								</span>
							);
						})}
					</div>
					<div style={{...txt(tk, 'body', tk.size.label, tk.text), whiteSpace: 'normal', marginTop: 22, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', opacity: lin(f, 30, 40), lineHeight: 1.3}}>{deck}</div>
				</div>
				<div style={{position: 'absolute', left: pad, top: colTop, width: photoW, opacity: lin(f, 22, 30)}}>
					<div style={{border: `${tk.rule.thin}px solid ${tk.text}`}}>
						<Halftone tk={tk} w={photoW - tk.rule.thin * 2} h={photoH} subject={subject} seed={seed} pitch={11} grow={moveP(tk, f, 22, 20)} spot />
					</div>
					<div style={{...txt(tk, 'body', tk.size.label * 0.72, tk.text), marginTop: 10}}>{caption}</div>
				</div>
				<div style={{position: 'absolute', left: pad + photoW + 30, right: pad, top: colTop, display: 'flex', flexDirection: 'column', gap: 18}}>
					{Array.from({length: Math.floor((photoH + 50) / 30)}).map((_, i, a) => (
						<div key={i} style={{height: 11, background: tk.line, width: `${(i === a.length - 1 ? 0.55 : 0.84 + random(`${seed}c${i}`) * 0.16) * 100 * lin(f, 26 + i, 34 + i)}%`}} />
					))}
				</div>
			</Paper>
		</div>
	);
};
