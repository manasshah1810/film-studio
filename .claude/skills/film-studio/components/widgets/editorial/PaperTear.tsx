import React from 'react';
import {boxPx, boxStyle, enterP, lin, txt} from '../social/tokens';
import {jagged, Paper, pathOf, type Pt} from './parts';
import {draw, type EditorialBase} from './tokens';

/** 13 PaperTear. A sheet splits down a jagged tear, the halves pull apart and off, the document underneath is revealed. */
export type PaperTearProps = EditorialBase & {before: {kicker: string; title: string}; after: {kicker: string; title: string; body: string}; tearAt?: number; seed: string};
export const PAPER_TEAR = {frames: 90, hero: 52, sfx: [{at: 'tearAt', id: 'paper-rip'}, {at: 'tearAt + 10', id: 'paper-rip'}]};

const Content: React.FC<{tk: PaperTearProps['tk']; W: number; kicker: string; title: string; body?: string}> = ({tk, W, kicker, title, body}) => (
	<div style={{position: 'absolute', left: 60, top: 70, width: W - 120, display: 'flex', flexDirection: 'column', gap: 26}}>
		<span style={txt(tk, 'mono', tk.size.label, tk.text)}>{kicker}</span>
		<span style={{...txt(tk, 'display', tk.size.h2 * 1.25, tk.text), whiteSpace: 'normal', lineHeight: 1.04}}>{title}</span>
		{body ? <span style={{...txt(tk, 'body', tk.size.body * 0.86, tk.text), whiteSpace: 'normal', lineHeight: 1.35}}>{body}</span> : null}
	</div>
);

export const PaperTear: React.FC<PaperTearProps> = ({tk, frame: f, box, before, after, tearAt = 30, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 14);
	const cut = tk.tearCut;
	const edge = tk.paper.tear;
	// The tear: a vertical jagged line (both sides), drifting from 54% at the top to 46% at the bottom.
	const T: Pt[] = jagged([W * 0.54, 0], [W * 0.46, H], cut.step, cut.amp, `${seed}cut`, 1, 0, true);
	const e = (a: Pt, b: Pt, s: string, nx: number, ny: number) => (edge ? jagged(a, b, edge.step, edge.amp, s, nx, ny) : [a, b]);
	const top = T[0], bot = T[T.length - 1];
	const left: Pt[] = [...e([0, 0], top, `${seed}lt`, 0, 1), ...T.slice(1), ...e(bot, [0, H], `${seed}lb`, 0, -1).slice(1), ...e([0, H], [0, 0], `${seed}ll`, 1, 0).slice(1, -1)];
	const right: Pt[] = [...e(top, [W, 0], `${seed}rt`, 0, 1), ...e([W, 0], [W, H], `${seed}rr`, -1, 0).slice(1), ...e([W, H], bot, `${seed}rb`, 0, -1).slice(1), ...[...T].reverse().slice(1, -1)];
	// Fibre: the torn edge pushed outward by up to `fibre` px, under each half.
	const fib = (side: number): Pt[] | null =>
		cut.fibre ? (side < 0 ? [[0, 0], ...T.map(([x, y], i) => [x + cut.fibre * (0.4 + ((i * 7) % 5) / 5), y] as Pt), [0, H]] : [[W, 0], ...T.map(([x, y], i) => [x - cut.fibre * (0.4 + ((i * 3) % 5) / 5), y] as Pt), [W, H]]) : null;
	const crack = lin(f, tearAt, tearAt + 8);
	const s = tk.tearEase(lin(f, tearAt + 8, tearAt + 34));
	const wob = f < tearAt + 8 ? Math.sin(f * 1.7) * crack * 2 : 0;
	const reveal = lin(f, tearAt + 10, tearAt + 26);
	return (
		<div style={{...boxStyle(box), overflow: 'visible', opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 60}px)`}}>
			<Paper tk={tk} w={W - 24} h={H - 24} seed={`${seed}u`} style={{left: 12, top: 12, transform: 'rotate(1deg)'}}>
				<div style={{opacity: reveal, transform: `scale(${0.97 + 0.03 * reveal})`, transformOrigin: '50% 30%'}}>
					<Content tk={tk} W={W - 24} {...after} />
				</div>
			</Paper>
			<div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `translateX(${-s * W * 0.82 + wob}px) translateY(${s * 50}px) rotate(${-s * 8}deg)`, transformOrigin: '0% 100%'}}>
				<Paper tk={tk} w={W} h={H} seed={`${seed}a`} outline={left} fibre={fib(-1)}>
					<Content tk={tk} W={W} {...before} />
				</Paper>
			</div>
			<div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `translateX(${s * W * 0.82 - wob}px) translateY(${s * 30}px) rotate(${s * 7}deg)`, transformOrigin: '100% 0%'}}>
				<Paper tk={tk} w={W} h={H} seed={`${seed}a`} outline={right} fibre={fib(1)}>
					<Content tk={tk} W={W} {...before} />
				</Paper>
			</div>
			{s <= 0 && crack > 0 ? (
				<svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<path d={pathOf(T, false)} fill="none" stroke={tk.text} strokeWidth={2.5} strokeLinejoin="round" opacity={0.7} {...draw(crack)} />
				</svg>
			) : null}
		</div>
	);
};
