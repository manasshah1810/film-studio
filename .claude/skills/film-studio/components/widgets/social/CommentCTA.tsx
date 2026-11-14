import React from 'react';
import {Avatar, Glyph} from './parts';
import {boxPx, boxStyle, card, enterP, lin, pillR, popP, txt, type WidgetBase} from './tokens';

/** 08 CommentCTA. "Comment WORD": the keyword types itself into a comment box, is sent, and lands as a posted comment. */
export type CommentCTAProps = WidgetBase & {ask: string; keyword: string; user: string; typeAt?: number; perChar?: number};
export const COMMENT_CTA = {frames: 90, hero: 72, sfx: [{at: 'typeAt + i * perChar', id: 'digital-tick'}, {at: 'send', id: 'click-soft'}, {at: 'send + 4', id: 'soft-chime'}]};

export const CommentCTA: React.FC<CommentCTAProps> = ({tk, frame: f, box, ask, keyword, user, typeAt = 14, perChar = 3}) => {
	const {width: W} = boxPx(box);
	const inn = enterP(tk, f, 0);
	const typed = Math.max(0, Math.min(keyword.length, Math.floor((f - typeAt) / perChar) + 1));
	const send = typeAt + keyword.length * perChar + 8;
	const ready = typed === keyword.length;
	const press = lin(f, send, send + 3) - lin(f, send + 3, send + 8);
	const sent = f >= send + 2;
	const post = popP(tk, f, send + 4);
	const nudge = ready && !sent ? Math.sin((f - send) * 0.8) * 0.06 : 0;
	const caret = !sent && Math.floor(f / 8) % 2 === 0;
	const inH = 132, btn = 104;
	const arrow = popP(tk, f, 4);
	return (
		<div style={{...boxStyle(box), overflow: 'visible'}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: W, display: 'flex', alignItems: 'center', gap: 18, opacity: inn, transform: `translateY(${(1 - inn) * 24}px)`}}>
				<span style={txt(tk, 'display', tk.size.body, tk.c.ink)}>{ask}</span>
				<Glyph id="down" size={50} color={tk.c.ink} style={{transform: `translateY(${Math.sin(f * 0.3) * 6 * arrow}px) scale(${arrow})`}} />
			</div>
			<div style={{...card(tk, 'surface', pillR(tk, inH)), position: 'absolute', left: 0, top: 100, width: W, height: inH, opacity: inn, display: 'flex', alignItems: 'center', gap: 22, padding: '0 14px 0 26px'}}>
				<Avatar tk={tk} name={user} size={84} />
				<div style={{flex: 1, minWidth: 0, display: 'flex', alignItems: 'center'}}>
					{sent ? <span style={txt(tk, 'body', tk.size.label, tk.c.ink)}>Add a comment</span> : <span style={txt(tk, 'display', tk.size.body, tk.c.ink)}>{keyword.slice(0, typed)}</span>}
					{caret ? <span style={{width: 5, height: tk.size.body * 1.05, background: tk.c.primary, marginLeft: 6}} /> : null}
				</div>
				<div style={{...card(tk, 'primary', btn / 2, 1 - press), width: btn, height: btn, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.45 + 0.55 * (ready ? 1 : 0), transform: `scale(${1 + nudge - press * 0.08})`}}>
					<Glyph id="send" size={52} color={tk.on('primary').hex} />
				</div>
			</div>
			{post > 0 ? (
				<div style={{...card(tk), position: 'absolute', left: 0, top: 100 + inH + 28, width: W, height: 150, padding: '0 30px', display: 'flex', alignItems: 'center', gap: 22, opacity: Math.min(1, post * 1.4), transform: `translateY(${(1 - post) * -50}px)`}}>
					<Avatar tk={tk} name={user} size={84} />
					<div style={{display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0}}>
						<span style={txt(tk, 'body', tk.size.label, tk.c.ink)}>{user}</span>
						<span style={txt(tk, 'display', tk.size.body, tk.c.ink)}>{keyword}</span>
					</div>
					<Glyph id="heart" size={46} color={tk.c.primary} fill />
				</div>
			) : null}
		</div>
	);
};
