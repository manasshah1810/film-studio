import React from 'react';
import {boxPx, boxStyle, enterP, moveP, popP, txt} from '../social/tokens';
import {Halftone, Paper, type Subject} from './parts';
import {jit, type EditorialBase} from './tokens';

/** 11 MagazineCover. A made-up cover lands: masthead wipes on, the halftone cover picture grows, cover lines pop in. */
export type MagazineCoverProps = EditorialBase & {masthead: string; issue: string; headline: string; lines: string[]; flash?: string; subject?: Subject; seed: string};
export const MAGAZINE_COVER = {frames: 90, hero: 72, sfx: [{at: 0, id: 'card-flick'}, {at: '34 + i * 2 * stagger', id: 'tactile-pop'}, {at: 52, id: 'tactile-pop'}]};

export const MagazineCover: React.FC<MagazineCoverProps> = ({tk, frame: f, box, masthead, issue, headline, lines, flash, subject = 'portrait', seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 14);
	const mast = moveP(tk, f, 8, 14);
	const grow = moveP(tk, f, 6, 24);
	const pad = 40;
	const mSize = Math.min(170, ((W - pad * 2) / Math.max(4, masthead.length)) * 1.5);
	const imgTop = pad + mSize + 54;
	const plate = popP(tk, f, 26);
	const fl = popP(tk, f, 52);
	return (
		<div style={{...boxStyle(box), overflow: 'visible', opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 90}px) rotate(${-1.2 - (1 - inn) * 5}deg)`}}>
			<Paper tk={tk} w={W} h={H} seed={seed} torn={false}>
				<div style={{position: 'absolute', left: 0, top: imgTop, width: W, height: H - imgTop}}>
					<Halftone tk={tk} w={W} h={H - imgTop} subject={subject} seed={seed} pitch={14} grow={grow} spot />
				</div>
				<div style={{position: 'absolute', left: pad, top: pad - mSize * 0.12, width: W - pad * 2, textAlign: 'center', clipPath: `inset(0 ${(1 - mast) * 100}% 0 0)`, transform: jit(tk, f, `${seed}m`)}}>
					<span style={{...txt(tk, 'display', mSize, tk.pen.hex), lineHeight: 1.1, overflow: 'visible'}}>{masthead}</span>
				</div>
				<div style={{position: 'absolute', left: pad, top: pad + mSize + 6, width: W - pad * 2, display: 'flex', justifyContent: 'space-between', opacity: mast, borderTop: `${tk.rule.thin}px solid ${tk.text}`, paddingTop: 8}}>
					<span style={txt(tk, 'mono', tk.size.label * 0.8, tk.text)}>{issue}</span>
				</div>
				<div style={{position: 'absolute', left: pad, top: imgTop + 34, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start'}}>
					{lines.slice(0, 3).map((l, i) => {
						const p = popP(tk, f, 34 + i * tk.stagger * 2);
						return (
							<span key={i} style={{...txt(tk, 'body', tk.size.label, tk.text), maxWidth: W * 0.62, background: tk.c.surface, padding: '6px 14px', opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * -60}px)`}}>
								{l}
							</span>
						);
					})}
				</div>
				<div style={{position: 'absolute', left: pad, right: pad, bottom: pad, background: tk.c.surface, padding: '16px 22px', opacity: Math.min(1, plate * 1.5), transform: `translateY(${(1 - plate) * 40}px) ${jit(tk, f, `${seed}h`)}`}}>
					<span style={{...txt(tk, 'display', tk.size.h2 * 0.8, tk.text), whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', lineHeight: 1.05}}>{headline}</span>
				</div>
				{flash ? (
					<div style={{position: 'absolute', right: pad, top: imgTop + 28, width: 190, height: 190, borderRadius: 95, background: tk.pen.hex, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(12deg) scale(${fl})`}}>
						<span style={{...txt(tk, 'display', Math.min(tk.size.label, 150 / Math.max(1, flash.length * 0.66)), tk.on(tk.pen.role).hex), textAlign: 'center', width: 160, overflow: 'visible', textOverflow: 'clip', lineHeight: 1.05}}>{flash}</span>
					</div>
				) : null}
			</Paper>
		</div>
	);
};
