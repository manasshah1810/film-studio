import React from 'react';
import {Avatar} from './parts';
import {boxPx, boxStyle, card, enterP, popP, txt, type FillRole, type WidgetBase} from './tokens';

/** 04 PostWall. A profile header, then a 3 x 3 grid of posts pops in diagonally; one post is lifted and pinned. */
export type PostWallProps = WidgetBase & {handle: string; stats: string; posts: string[]; hero?: number; heroAt?: number};
export const POST_WALL = {frames: 90, hero: 74, sfx: [{at: '6 + d * stagger', id: 'tactile-pop'}, {at: 'heroAt', id: 'tactile-pop'}]};

const FILLS: FillRole[] = ['primary', 'surface', 'highlight'];

export const PostWall: React.FC<PostWallProps> = ({tk, frame: f, box, handle, stats, posts, hero = 4, heroAt = 56}) => {
	const {width: W} = boxPx(box);
	const headH = 170, gap = 10;
	const tile = (W - gap * 2) / 3;
	const inn = enterP(tk, f, 0);
	const lift = popP(tk, f, heroAt);
	return (
		<div style={{...boxStyle(box), overflow: 'visible'}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: W, height: headH - 20, display: 'flex', alignItems: 'center', gap: 28, opacity: inn, transform: `translateY(${(1 - inn) * 30}px)`}}>
				<Avatar tk={tk} name={handle} size={130} />
				<div style={{display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0}}>
					<span style={txt(tk, 'display', tk.size.body, tk.c.ink)}>{handle}</span>
					<span style={txt(tk, 'body', tk.size.label, tk.c.ink)}>{stats}</span>
				</div>
			</div>
			{posts.slice(0, 9).map((label, i) => {
				const r = Math.floor(i / 3), c = i % 3;
				const p = popP(tk, f, 6 + (r + c) * tk.stagger);
				const fill = FILLS[(r + c * 2) % 3];
				const isHero = i === hero;
				const s = (0.6 + 0.4 * p) * (isHero ? 1 + 0.03 * lift : 1);
				return (
					<div key={i} style={{...card(tk, fill, Math.min(tk.radius, 18), isHero ? 1 + lift : 1), position: 'absolute', left: c * (tile + gap), top: headH + r * (tile + gap), width: tile, height: tile, opacity: Math.min(1, p * 1.5), transform: `scale(${s})`, zIndex: isHero ? 2 : 1, display: 'flex', alignItems: 'flex-end', padding: 22, outline: isHero && lift > 0 ? `${6 * Math.min(1, lift)}px solid ${tk.c.ink}` : 'none', outlineOffset: 0}}>
						<span style={txt(tk, 'display', tk.size.body, tk.on(fill).hex)}>{label}</span>
						{isHero && lift > 0 ? (
							<span style={{...card(tk, 'ink', tk.pill), position: 'absolute', right: 16, top: 16, padding: '6px 18px', transform: `scale(${lift})`, ...txt(tk, 'mono', tk.size.label * 0.8, tk.on('ink').hex)}}>PINNED</span>
						) : null}
					</div>
				);
			})}
		</div>
	);
};
