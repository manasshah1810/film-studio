import React from 'react';
import {random} from 'remotion';
import {boxPx, boxStyle, card, enterP} from '../social/tokens';
import {TAB} from '../data/tokens';
import {Card, Label, Word, frameOf} from './parts';
import {measure, parseWords, type KineticBase} from './tokens';

/**
 * 48 GravityDrop. Each word is a block in the style's card look (fill, radius, border, offset shadow). Blocks fall
 * with constant acceleration (y = h * (1 - t^2)) over `drop.fall` frames, squash to 1.1 x `drop.squash` for 2 frames
 * on landing and kick two dust specks. Rows are built bottom up (the lowest row first, centre out, seeded jitter),
 * starts spread over `drop.spread`, so the sentence reads top to bottom once it stands. Rows break by block width
 * with no orphan block. A counter reads landed / total. `*word*` marks a power block.
 */
export type GravityDropProps = KineticBase & {label: string; text: string; seed: string};
export const GRAVITY_DROP = {frames: 72, hero: 66, sfx: [{at: 'each landing', id: 'click-soft'}, {at: 'last landing', id: 'tactile-pop'}]};

export const GravityDrop: React.FC<GravityDropProps> = ({tk, frame: f, box, label, text, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const {pad, head} = frameOf(tk);
	const vw = W - pad * 2, vh = H - head - pad;
	const {words, power} = parseWords(text);
	const G = 16;
	const tileW = (s: number, w: string) => measure(tk, 'display', s, w) + s * 0.5;
	const rowsAt = (s: number) => {
		const rows: number[][] = [];
		let wsum = 0;
		words.forEach((w, i) => {
			const tw = tileW(s, w);
			const cur = rows[rows.length - 1];
			if (cur && wsum + G + tw <= vw) { cur.push(i); wsum += G + tw; } else { rows.push([i]); wsum = tw; }
		});
		for (let r = rows.length - 1; r > 0; r--) {
			const a = rows[r - 1], b = rows[r];
			const wb = b.reduce((x, i) => x + tileW(s, words[i]) + G, 0) + tileW(s, words[a[a.length - 1]]);
			if (b.length === 1 && a.length >= 2 && wb <= vw) b.unshift(a.pop() as number);
		}
		return rows;
	};
	let size = Math.min(tk.h1, 110);
	while (size > 44 && (words.some((w) => tileW(size, w) > vw) || rowsAt(size).length * size * 1.5 > vh * 0.78)) size -= 2;
	const rows = rowsAt(size);
	const th = size * 1.32;
	const floor = vh - 24;
	const order: {i: number; r: number; k: number}[] = [];
	rows.forEach((row, r) => {
		const c = (row.length - 1) / 2;
		row.forEach((i, j) => order.push({i, r, k: Math.abs(j - c)}));
	});
	order.sort((a, b) => b.r - a.r || a.k - b.k);
	const [s0, s1] = tk.drop.spread;
	const start: Record<number, number> = {};
	order.forEach((o, n) => (start[o.i] = Math.round(s0 + (order.length > 1 ? (n / (order.length - 1)) * (s1 - s0) : 0) + (random(`${seed}-j${o.i}`) - 0.5) * 2)));
	const fall = tk.drop.fall;
	const landed = words.filter((_, i) => f >= start[i] + fall).length;
	const rowTop = (r: number) => floor - (rows.length - r) * (th + 12);
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between', zIndex: 3}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={landed === words.length ? tk.accent : tk.label} style={TAB}>{`LANDED ${String(landed).padStart(2, '0')}/${String(words.length).padStart(2, '0')}`}</Label>
				</div>
				<div style={{position: 'absolute', left: pad, top: head, width: vw, height: vh}}>
					<div style={{position: 'absolute', left: -pad, right: -pad, top: floor, height: tk.stroke.line, background: tk.grid}} />
					{rows.map((row, r) => {
						const ws = row.map((i) => tileW(size, words[i]));
						let x = (vw - (ws.reduce((a, b) => a + b, 0) + G * (row.length - 1))) / 2;
						return row.map((i, j) => {
							const left = x;
							x += ws[j] + G;
							const st = start[i];
							if (f < st) return null;
							const y1 = rowTop(r);
							const hgt = y1 + th + head + 40;
							const tt = Math.min(1, (f - st) / fall);
							const y = y1 - hgt * (1 - tt * tt);
							const after = f - (st + fall);
							const sq = after >= 0 && after < 2;
							const isP = power.has(i);
							const fill = isP ? 'highlight' : 'primary';
							return (
								<React.Fragment key={i}>
									<div style={{position: 'absolute', left, top: y, width: ws[j], height: th, ...card(tk, fill, Math.min(tk.radius, th * 0.2)), display: 'flex', alignItems: 'center', justifyContent: 'center', transform: sq ? `scale(1.1, ${tk.drop.squash})` : 'none', transformOrigin: '50% 100%'}}>
										<Word tk={tk} size={size} color={isP ? tk.power.text : tk.knock.text} style={{padding: 0}}>{words[i]}</Word>
									</div>
									{after >= 0 && after < 8 &&
										[-1, 1].map((d) => (
											<div key={d} style={{position: 'absolute', left: left + (d < 0 ? 0 : ws[j]) + d * after * 5, top: y1 + th - 10 - after * 2, width: 10, height: 10, background: tk.label, opacity: 1 - after / 8}} />
										))}
								</React.Fragment>
							);
						});
					})}
				</div>
			</Card>
		</div>
	);
};
