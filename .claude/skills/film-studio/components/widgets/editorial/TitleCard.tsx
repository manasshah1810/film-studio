import React from 'react';
import {contrast} from '../../engine/tokens';
import {boxPx, boxStyle, enterP, lin, moveP, txt} from '../social/tokens';
import {Paper} from './parts';
import {jit, type EditorialBase} from './tokens';

/** 20 TitleCard. A documentary chapter card: kicker, title lines rise out of a mask, a rule draws out, the subline settles. */
export type TitleCardProps = EditorialBase & {kicker: string; title: string[]; sub: string; seed: string};
export const TITLE_CARD = {frames: 90, hero: 70, sfx: [{at: '14 + i * stagger', id: 'stop-tick'}, {at: 34, id: 'pen-scratch'}]};

export const TitleCard: React.FC<TitleCardProps> = ({tk, frame: f, box, kicker, title, sub, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 14);
	const pad = 64;
	const kick = contrast(tk.pen.hex, tk.c.surface) >= 4.5 ? tk.pen.hex : tk.text;
	const rule = moveP(tk, f, 34, 16);
	const mark = (x: number, y: number, sx: number, sy: number) => (
		<path d={`M${x} ${y + sy * 34} V${y} H${x + sx * 34}`} fill="none" stroke={tk.line} strokeWidth={3} />
	);
	return (
		<div style={{...boxStyle(box), overflow: 'visible', opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Paper tk={tk} w={W} h={H} seed={seed}>
				<svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: lin(f, 4, 12)}}>
					{mark(30, 30, 1, 1)}
					{mark(W - 30, 30, -1, 1)}
					{mark(30, H - 30, 1, -1)}
					{mark(W - 30, H - 30, -1, -1)}
				</svg>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, bottom: pad, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14}}>
					<span style={{...txt(tk, 'mono', tk.size.label, kick), letterSpacing: '0.24em', opacity: lin(f, 6, 14), transform: `translateY(${(1 - lin(f, 6, 14)) * 12}px)`}}>{kicker}</span>
					<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', transform: jit(tk, f, `${seed}t`)}}>
						{title.slice(0, 2).map((l, i) => {
							const p = moveP(tk, f, 14 + i * tk.stagger, tk.enterFrames);
							return (
								<div key={i} style={{overflow: 'hidden', paddingBottom: 6}}>
									<div style={{...txt(tk, 'display', tk.h1, tk.text), lineHeight: 1.06, textAlign: 'center', maxWidth: W - pad * 2, transform: `translateY(${(1 - p) * 110}%)`}}>{l}</div>
								</div>
							);
						})}
					</div>
					<div style={{width: (W - pad * 2) * 0.5 * rule, height: tk.rule.thick, background: tk.text, marginTop: 8}} />
					<span style={{...txt(tk, 'body', tk.size.label, tk.text), opacity: lin(f, 44, 54), maxWidth: W - pad * 2}}>{sub}</span>
				</div>
			</Paper>
		</div>
	);
};
