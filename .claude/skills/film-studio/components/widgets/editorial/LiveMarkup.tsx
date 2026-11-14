import React from 'react';
import {boxPx, boxStyle, enterP, lin, moveP, txt} from '../social/tokens';
import {Paper, PenOver, ringPath} from './parts';
import {jit, type EditorialBase} from './tokens';

/** 16 LiveMarkup. Red pen marks up a printed paragraph live: circle, underline, strike, marker, then a margin note. */
export type Mark = {text: string; kind: 'circle' | 'underline' | 'strike' | 'marker'};
export type LiveMarkupProps = EditorialBase & {lines: string[]; marks: Mark[]; note?: {text: string; mark: number}; startAt?: number; each?: number; seed: string};
export const LIVE_MARKUP = {frames: 100, hero: 94, sfx: [{at: 'startAt + i * each', id: 'pen-scratch (marker: marker-stroke)'}, {at: 'note', id: 'pen-scratch'}]};

const D = {underline: 'M0 106 C 30 101, 62 110, 100 103', strike: 'M-2 60 L102 48'};

export const LiveMarkup: React.FC<LiveMarkupProps> = ({tk, frame: f, box, lines, marks, note, startAt = 14, each = 20, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 64;
	const size = tk.size.body;
	const lh = size * 1.6;
	const noteAt = startAt + marks.length * each;
	const used = new Set<number>();
	const lineOf: number[] = [];
	const rendered = lines.map((line, li) => {
		const out: React.ReactNode[] = [];
		let rest = line;
		let key = 0;
		for (;;) {
			let best = -1, at = Infinity;
			marks.forEach((m, k) => {
				if (used.has(k)) return;
				const i = rest.indexOf(m.text);
				if (i >= 0 && i < at) (at = i), (best = k);
			});
			if (best < 0) break;
			used.add(best);
			lineOf[best] = li;
			const m = marks[best];
			if (at > 0) out.push(<span key={key++}>{rest.slice(0, at)}</span>);
			const p = (f - startAt - best * each) / (m.kind === 'marker' ? 24 : each - 4);
			const multiply = tk.marker.blend === 'multiply';
			out.push(
				<span key={key++} style={{position: 'relative', display: 'inline-block', margin: m.kind === 'circle' ? '0 10px' : undefined}}>
					{m.kind === 'marker' && p > 0 ? <span style={{position: 'absolute', left: -6, top: `${(1 - tk.marker.height) * 50 + 6}%`, height: `${tk.marker.height * 92}%`, width: `calc(${Math.min(1, p) * 100}% + 12px)`, background: tk.marker.hex, mixBlendMode: multiply ? 'multiply' : 'normal', zIndex: multiply ? 2 : 0}} /> : null}
					<span style={{position: 'relative', zIndex: 1}}>{m.text}</span>
					{m.kind === 'circle' && p > 0 ? <PenOver d={ringPath(`${seed}${best}`)} color={tk.pen.hex} w={tk.pen.w} p={p} inset={[12, 6]} /> : null}
					{(m.kind === 'underline' || m.kind === 'strike') && p > 0 ? <PenOver d={D[m.kind]} color={tk.pen.hex} w={tk.pen.w} p={p} /> : null}
					{note && note.mark === best && f >= noteAt ? <Note tk={tk} f={f} at={noteAt} drop={(lines.length - 1 - li) * lh + 44} text={note.text} seed={seed} /> : null}
				</span>,
			);
			rest = rest.slice(at + m.text.length);
		}
		if (rest) out.push(<span key={key++}>{rest}</span>);
		return out;
	});
	return (
		<div style={{...boxStyle(box), overflow: 'visible', opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 60}px) rotate(-0.8deg)`}}>
			<Paper tk={tk} w={W} h={H} seed={seed}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad + 10}}>
					{rendered.map((r, i) => (
						<div key={i} style={{...txt(tk, 'body', size, tk.text), overflow: 'visible', lineHeight: `${lh}px`, opacity: lin(f, 2 + i * 2, 8 + i * 2)}}>
							{r}
						</div>
					))}
				</div>
			</Paper>
		</div>
	);
};

const Note: React.FC<{tk: LiveMarkupProps['tk']; f: number; at: number; drop: number; text: string; seed: string}> = ({tk, f, at, drop, text, seed}) => {
	const arrow = (f - at) / 10;
	const write = moveP(tk, f, at + 6, 12);
	return (
		<>
			<svg width={70} height={drop} style={{position: 'absolute', left: 6, top: '100%', overflow: 'visible'}}>
				<path d={`M22 ${drop - 4} C 4 ${drop * 0.6}, 46 ${drop * 0.35}, 30 8 M18 22 L30 6 L42 20`} fill="none" stroke={tk.pen.hex} strokeWidth={tk.pen.w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.max(0, Math.min(1, arrow))} />
			</svg>
			<span style={{position: 'absolute', left: 0, top: `calc(100% + ${drop}px)`, ...txt(tk, 'accent', tk.size.h2, tk.pen.hex), overflow: 'visible', clipPath: `inset(-20% ${(1 - write) * 100}% -20% -5%)`, transform: jit(tk, f, `${seed}n`)}}>{text}</span>
		</>
	);
};
