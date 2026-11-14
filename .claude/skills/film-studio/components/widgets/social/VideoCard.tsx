import React from 'react';
import {Avatar, Glyph} from './parts';
import {boxPx, boxStyle, card, compact, enterP, lin, moveP, popP, txt, type WidgetBase} from './tokens';

/** 07 VideoCard. A long-form video card slides up; play is pressed, the scrub bar runs and the view count rolls. */
export type VideoCardProps = WidgetBase & {title: string; channel: string; views: number; duration: string; age: string; thumb: string; playAt?: number};
export const VIDEO_CARD = {frames: 90, hero: 70, sfx: [{at: 'playAt', id: 'click-soft'}, {at: 'playAt + 4 .. +34', id: 'digital-tick'}]};

export const VideoCard: React.FC<VideoCardProps> = ({tk, frame: f, box, title, channel, views, duration, age, thumb, playAt = 28}) => {
	const {width: W} = boxPx(box);
	const inn = enterP(tk, f, 0);
	const thumbH = Math.round((W * 9) / 16);
	const press = lin(f, playAt, playAt + 3) - lin(f, playAt + 3, playAt + 8);
	const gone = lin(f, playAt + 6, playAt + 14);
	const scrub = moveP(tk, f, playAt + 6, 60) * 0.42;
	const count = Math.round(views * moveP(tk, f, playAt + 4, 30));
	const badge = popP(tk, f, 10);
	return (
		<div style={{...boxStyle(box), overflow: 'visible', opacity: inn, transform: `translateY(${(1 - inn) * 60}px)`}}>
			<div style={{...card(tk), position: 'absolute', left: 0, top: 0, width: W, overflow: 'hidden'}}>
				<div style={{position: 'relative', height: thumbH, background: tk.c.primary, borderBottom: tk.border.w ? `${tk.border.w}px solid ${tk.border.color}` : 'none'}}>
					<div style={{position: 'absolute', left: 40, top: 34, right: 40, ...txt(tk, 'display', tk.size.h2 * 1.5, tk.on('primary').hex), whiteSpace: 'normal', lineHeight: 1}}>{thumb}</div>
					<div style={{...card(tk, 'surface', 80, 1 - press), position: 'absolute', left: W / 2 - 80, top: thumbH / 2 - 80, width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1 - gone, transform: `scale(${(1 - press * 0.1) * (1 + gone * 0.3)})`}}>
						<Glyph id="play" size={76} color={tk.c.ink} />
					</div>
					<span style={{...card(tk, 'surface', Math.min(tk.radius, 10), 0), position: 'absolute', right: 20, bottom: 30, padding: '4px 14px', transform: `scale(${badge})`, ...txt(tk, 'mono', tk.size.label * 0.82, tk.c.ink)}}>{duration}</span>
					<div style={{position: 'absolute', left: 0, bottom: 0, width: '100%', height: 10, background: tk.line}} />
					<div style={{position: 'absolute', left: 0, bottom: 0, width: `${scrub * 100}%`, height: 10, background: tk.c.highlight === tk.c.primary ? tk.c.ink : tk.c.highlight}} />
				</div>
				<div style={{display: 'flex', gap: 24, padding: '28px 32px 34px'}}>
					<Avatar tk={tk} name={channel} size={96} />
					<div style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10}}>
						<span style={{...txt(tk, 'display', tk.size.body, tk.c.ink), whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>{title}</span>
						<span style={txt(tk, 'body', tk.size.label, tk.c.ink)}>{`${channel} · ${compact(count)} views · ${age}`}</span>
					</div>
				</div>
			</div>
		</div>
	);
};
