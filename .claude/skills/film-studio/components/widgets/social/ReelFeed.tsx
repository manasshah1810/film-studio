import React from 'react';
import {Glyph} from './parts';
import {lum} from '../../engine/tokens';
import {boxPx, boxStyle, card, compact, enterP, lin, popP, txt, type FillRole, type WidgetBase} from './tokens';

/** 05 ReelFeed. A vertical feed inside a phone frame; reels snap upward one swipe at a time with a rail of counts. */
export type Reel = {title: string; handle: string; likes: number; comments: number};
export type ReelFeedProps = WidgetBase & {reels: Reel[]; firstSwipe?: number; every?: number};
export const REEL_FEED = {frames: 90, hero: 37, sfx: [{at: 'firstSwipe + i * every - 6', id: 'fast-whoosh'}]};

const FILLS: FillRole[] = ['primary', 'highlight', 'surface'];

export const ReelFeed: React.FC<ReelFeedProps> = ({tk, frame: f, box, reels, firstSwipe = 34, every = 30}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0);
	const n = reels.length;
	const swipes = Array.from({length: n - 1}, (_, i) => popP(tk, f, firstSwipe + i * every)).reduce((s, v) => s + Math.min(v, 1.04), 0);
	const frameR = Math.max(tk.radius, 0);
	const bezel = lum(tk.c.ink) < lum(tk.c.bg) ? 'ink' : 'bg';
	return (
		<div style={{...boxStyle(box), overflow: 'visible', opacity: inn, transform: `translateY(${(1 - inn) * 60}px)`}}>
			<div style={{...card(tk, bezel, frameR), position: 'absolute', inset: 0, padding: 14}}>
				<div style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: Math.max(0, frameR - 10)}}>
					{reels.map((rl, i) => {
						const fill = FILLS[i % 3];
						const on = tk.on(fill).hex;
						const y = (i - swipes) * (H - 28);
						const local = f - (i === 0 ? 0 : firstSwipe + (i - 1) * every);
						const prog = lin(local, 0, 150);
						return (
							<div key={i} style={{position: 'absolute', left: 0, top: y, width: '100%', height: H - 28, background: tk.c[fill]}}>
								<div style={{position: 'absolute', left: 44, right: 150, top: '30%', ...txt(tk, 'display', tk.size.h2, on), whiteSpace: 'normal'}}>{rl.title}</div>
								<div style={{position: 'absolute', right: 30, bottom: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34}}>
									{([['heart', rl.likes], ['comment', rl.comments], ['share', null]] as const).map(([g, v]) => (
										<div key={g} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
											<Glyph id={g} size={64} color={on} fill={g === 'heart' ? true : undefined} />
											{v !== null ? <span style={txt(tk, 'mono', tk.size.label * 0.82, on)}>{compact(v)}</span> : null}
										</div>
									))}
								</div>
								<div style={{position: 'absolute', left: 44, right: 150, bottom: 70, ...txt(tk, 'display', tk.size.label, on)}}>{rl.handle}</div>
								<div style={{position: 'absolute', left: 0, bottom: 0, height: 8, width: `${prog * 100}%`, background: on}} />
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};
