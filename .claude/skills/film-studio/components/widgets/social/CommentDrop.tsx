import React from 'react';
import {Avatar, Glyph} from './parts';
import {boxPx, boxStyle, card, compact, enterP, popP, txt, type WidgetBase} from './tokens';

/** 02 CommentDrop. Comments drop in under a post one by one; older ones slide down; each gets a like. */
export type Comment = {user: string; text: string; likes: number};
export type CommentDropProps = WidgetBase & {author: string; caption: string; comments: Comment[]; gap?: number};
export const COMMENT_DROP = {frames: 90, hero: 72, sfx: [{at: '8 + i * gap', id: 'soft-chime'}]};

export const CommentDrop: React.FC<CommentDropProps> = ({tk, frame: f, box, author, caption, comments, gap = 18}) => {
	const {width: W} = boxPx(box);
	const postH = 290, rowH = 176, space = 22;
	const inn = enterP(tk, f, 0);
	const list = comments.slice(0, 3);
	const at = (i: number) => 8 + i * gap;
	return (
		<div style={{...boxStyle(box), overflow: 'hidden'}}>
			<div style={{...card(tk), position: 'absolute', left: 0, top: 0, width: W, height: postH, padding: '30px 36px', opacity: inn, display: 'flex', flexDirection: 'column', gap: 18}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 20}}>
					<Avatar tk={tk} name={author} size={84} />
					<span style={txt(tk, 'display', tk.size.body, tk.c.ink)}>{author}</span>
				</div>
				<span style={{...txt(tk, 'body', tk.size.body, tk.c.ink), whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.25}}>{caption}</span>
			</div>
			{list.map((cm, i) => {
				const p = popP(tk, f, at(i));
				if (p <= 0) return null;
				// pushed down by every comment that arrived after it
				const push = list.slice(i + 1).reduce((s, _, j) => s + popP(tk, f, at(i + 1 + j)), 0);
				const y = postH + space + push * (rowH + space);
				const like = popP(tk, f, at(i) + 10);
				const liked = like > 0;
				return (
					<div key={i} style={{...card(tk), position: 'absolute', left: 0, top: y, width: W, height: rowH, padding: '28px 32px', display: 'flex', gap: 22, alignItems: 'flex-start', opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * -70}px) scale(${0.9 + 0.1 * p})`, transformOrigin: '50% 0'}}>
						<Avatar tk={tk} name={cm.user} size={84} />
						<div style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6}}>
							<span style={txt(tk, 'display', tk.size.label, tk.c.ink)}>{cm.user}</span>
							<span style={{...txt(tk, 'body', tk.size.label, tk.c.ink), whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>{cm.text}</span>
						</div>
						<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 76}}>
							<Glyph id="heart" size={46} color={liked ? tk.c.primary : tk.c.ink} fill={liked} style={{transform: `scale(${1 + 0.35 * Math.sin(Math.min(1, like) * Math.PI)})`}} />
							<span style={txt(tk, 'mono', tk.size.label * 0.82, tk.c.ink)}>{compact(cm.likes + (liked ? 1 : 0))}</span>
						</div>
					</div>
				);
			})}
		</div>
	);
};
