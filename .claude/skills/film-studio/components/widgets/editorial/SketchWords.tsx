import React from 'react';
import {boxPx, boxStyle, enterP, lin, txt} from '../social/tokens';
import {Paper, PenOver} from './parts';
import {jit, type EditorialBase} from './tokens';

/** 17 SketchWords. Words write themselves by hand on a ruled scrap, line by line; the key line gets a swoosh and spark ticks. */
export type SketchWordsProps = EditorialBase & {lines: string[]; emphasis?: number; writeAt?: number; perChar?: number; seed: string};
export const SKETCH_WORDS = {frames: 90, hero: 84, sfx: [{at: 'each line start', id: 'pen-scratch'}, {at: 'swoosh', id: 'pen-scratch'}]};

export const SketchWords: React.FC<SketchWordsProps> = ({tk, frame: f, box, lines, emphasis = -1, writeAt = 6, perChar = 1.6, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const size = Math.round(tk.size.h2 * 1.4);
	const lh = Math.round(size * 1.18);
	const top = 70;
	const margin = 96;
	let t = writeAt;
	const starts = lines.map((l) => {
		const s = t;
		t += Math.ceil(l.length * perChar) + 4;
		return s;
	});
	const end = t;
	return (
		<div style={{...boxStyle(box), overflow: 'visible', opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 50}px) rotate(1.2deg)`}}>
			<Paper tk={tk} w={W} h={H} seed={seed}>
				{Array.from({length: Math.floor((H - top) / lh) + 1}).map((_, i) => (
					<div key={i} style={{position: 'absolute', left: 0, right: 0, top: top + (i + 1) * lh - lh * 0.2, height: 2, background: tk.line}} />
				))}
				<div style={{position: 'absolute', left: margin - 22, top: 0, bottom: 0, width: 2, background: tk.pen.hex, opacity: 0.35}} />
				{lines.map((l, i) => {
					const p = lin(f, starts[i], starts[i] + l.length * perChar);
					const em = i === emphasis;
					const sw = (f - end) / 12;
					const tick = (f - end - 10) / 8;
					return (
						<div key={i} style={{position: 'absolute', left: margin, top: top + i * lh, height: lh, display: 'flex', alignItems: 'flex-end', transform: jit(tk, f, `${seed}${i}`, 1.3)}}>
							<span style={{position: 'relative', display: 'inline-block', clipPath: `inset(-30% ${(1 - p) * 100}% -40% -5%)`}}>
								<span style={{...txt(tk, 'accent', size, em ? tk.pen.hex : tk.text), overflow: 'visible', lineHeight: 1}}>{l}</span>
							</span>
							{em && sw > 0 ? (
								<div style={{position: 'absolute', left: -10, bottom: -12, width: 'calc(100% + 30px)', height: 26}}>
									<PenOver d="M0 40 C 25 10, 60 90, 100 30 M8 90 C 40 70, 70 100, 96 78" color={tk.pen.hex} w={tk.pen.w} p={sw} />
								</div>
							) : null}
							{em && tick > 0 ? (
								<svg width={70} height={70} style={{position: 'absolute', right: -84, top: 0, overflow: 'visible'}}>
									<path d="M10 30 L2 14 M28 20 L32 2 M44 34 L62 24" fill="none" stroke={tk.pen.hex} strokeWidth={tk.pen.w} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.max(0, Math.min(1, tick))} />
								</svg>
							) : null}
						</div>
					);
				})}
			</Paper>
		</div>
	);
};
