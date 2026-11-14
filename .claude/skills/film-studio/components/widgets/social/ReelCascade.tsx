import React from 'react';
import {Glyph} from './parts';
import {boxPx, boxStyle, card, compact, enterP, seeded, txt, type FillRole, type WidgetBase} from './tokens';

/** 06 ReelCascade. Three columns of reel thumbnails pour downward at different speeds: endless content, overload. */
export type ReelCascadeProps = WidgetBase & {seed: string; views: number[]; speeds?: [number, number, number]};
export const REEL_CASCADE = {frames: 90, hero: 60, sfx: [{at: 0, id: 'fast-whoosh'}, {at: 'every 8 frames while pouring', id: 'digital-tick'}]};

const FILLS: FillRole[] = ['primary', 'surface', 'highlight', 'surface'];

export const ReelCascade: React.FC<ReelCascadeProps> = ({tk, frame: f, box, seed, views, speeds = [11, 16, 8]}) => {
	const {width: W, height: H} = boxPx(box);
	const gap = 14;
	const cw = (W - gap * 2) / 3;
	const ch = cw * (16 / 9);
	const per = Math.ceil(H / (ch + gap)) + 2;
	const ramp = enterP(tk, f, 0, 20);
	return (
		<div style={{...boxStyle(box), overflow: 'hidden', borderRadius: tk.radius}}>
			{[0, 1, 2].map((col) => {
				// distance travelled: integral of a ramped speed, a pure function of the frame
				const dist = speeds[col] * Math.max(0, f - 10 * (1 - ramp)) + seeded(`${seed}-o${col}`, 0, ch);
				const shift = dist % (ch + gap);
				const base = Math.floor(dist / (ch + gap));
				return Array.from({length: per}, (_, k) => {
					const idx = base + k;
					const fill = FILLS[(idx + col) % FILLS.length];
					const v = views[(idx * 3 + col) % views.length];
					const y = shift + (per - 2 - k) * (ch + gap) - (ch + gap);
					return (
						<div key={`${col}-${k}`} style={{...card(tk, fill, Math.min(tk.radius, 18), 0.6), position: 'absolute', left: col * (cw + gap), top: y, width: cw, height: ch, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
							<Glyph id="play" size={72} color={tk.on(fill).hex} />
							<span style={{...card(tk, 'surface', tk.pill, 0), position: 'absolute', left: 14, bottom: 14, padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 6}}>
								<Glyph id="play" size={22} color={tk.c.ink} />
								<span style={txt(tk, 'mono', tk.size.label * 0.82, tk.c.ink)}>{compact(v)}</span>
							</span>
						</div>
					);
				});
			})}
		</div>
	);
};
