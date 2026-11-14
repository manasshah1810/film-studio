import React from 'react';
import {random} from 'remotion';
import {fontCss} from '../../engine/tokens';
import {boxPx, boxStyle, enterP, popP} from '../social/tokens';
import {TAB} from '../data/tokens';
import {whipP} from '../camera/tokens';
import {Card, Label, frameOf} from './parts';
import {breakLines, cased, fitSize, measure, parseWords, type KineticBase} from './tokens';

/**
 * 45 BlowAway. The old line is set letter by letter at measured positions. A gust runs left to right: each letter
 * lifts off at once (square-root rise, turn and shrink), drifts right on the whip easing, turns and shrinks, trailing two specks, so the line erodes from
 * its first letter to its last. The new line then pops in word by word in the same place. Both lines are broken by
 * measured width with no orphan word. `*word*` marks a power word in the new line.
 */
export type BlowAwayProps = KineticBase & {label: string; from: string; to: string; blowAt?: number; seed: string};
export const BLOW_AWAY = {frames: 84, hero: 30, sfx: [{at: 'blowAt', id: 'fast-whoosh'}, {at: 'blowAt + 34', id: 'tactile-pop'}]};

export const BlowAway: React.FC<BlowAwayProps> = ({tk, frame: f, box, label, from, to, blowAt = 16, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const {pad, head} = frameOf(tk);
	const vw = W - pad * 2, vh = H - head - pad;
	const A = from.split(/\s+/).filter(Boolean);
	const B = parseWords(to);
	const size = Math.min(fitSize(tk, 'display', tk.h1, A, vw, 4, 48), fitSize(tk, 'display', tk.h1, B.words, vw, 4, 48));
	const lh = size * Math.max(1, (tk.font.display as {lineHeight: number}).lineHeight) * 1.04;
	const LA = breakLines(tk, 'display', size, A, vw);
	const LB = breakLines(tk, 'display', size, B.words, vw);
	const blockH = (n: number) => n * lh;
	const topA = (vh - blockH(LA.length)) / 2, topB = (vh - blockH(LB.length)) / 2;
	const font = fontCss(tk.font.display, size);
	const chars: {ch: string; x: number; y: number}[] = [];
	LA.forEach((ln, li) => {
		const s = cased(tk, 'display', ln.join(' '));
		for (let i = 0; i < s.length; i++) if (s[i] !== ' ') chars.push({ch: s[i], x: i ? measure(tk, 'display', size, s.slice(0, i)) : 0, y: topA + li * lh});
	});
	const gone = chars.filter((c, i) => whipP(tk, f, blowAt + (c.x / vw) * 26 + random(`${seed}-d${i}`) * 4 + (c.y / vh) * 4, 20) >= 1).length;
	let wi = 0;
	const lastStart = blowAt + 34;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={gone ? tk.accent : tk.label} style={TAB}>{`GONE ${String(gone).padStart(2, '0')}/${String(chars.length).padStart(2, '0')}`}</Label>
				</div>
				<div style={{position: 'absolute', left: pad, top: head, width: vw, height: vh, overflow: 'visible'}}>
					{chars.map((c, i) => {
						const start = blowAt + (c.x / vw) * 26 + random(`${seed}-d${i}`) * 4 + (c.y / vh) * 4;
						const p = whipP(tk, f, start, 20);
						if (p >= 1) return null;
						const r1 = random(`${seed}-x${i}`), r2 = random(`${seed}-y${i}`), r3 = random(`${seed}-r${i}`);
						// Lift first (square root: the letter leaves its line at once), then drift right on the whip easing.
						const q = Math.sqrt(p);
						const dx = p * (vw * 0.45 + r1 * vw * 0.5), dy = -q * (90 + r2 * 260);
						const rot = q * (r3 - 0.5) * 300;
						const sc = 1 - 0.55 * q;
						return (
							<React.Fragment key={i}>
								<span style={{...font, position: 'absolute', left: c.x, top: c.y, lineHeight: `${lh}px`, color: tk.text, whiteSpace: 'pre', transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${sc.toFixed(3)})`, opacity: 1 - p * p, textTransform: 'none'}}>
									{c.ch}
								</span>
								{p > 0.05 &&
									[0, 1].map((s) => {
										const q = Math.max(0, p - 0.12 * (s + 1));
										const z = size * 0.05 * (1 - s * 0.4);
										return <div key={s} style={{position: 'absolute', left: c.x + size * 0.2 + q * (vw * 0.35 + r1 * vw * 0.4), top: c.y + lh * (0.4 + 0.2 * s) - q * (40 + r2 * 200), width: z, height: z, background: tk.label, opacity: (1 - p) * 0.8}} />;
									})}
							</React.Fragment>
						);
					})}
					{LB.map((ln, li) => (
						<div key={li} style={{position: 'absolute', left: 0, top: topB + li * lh, height: lh, display: 'flex', alignItems: 'center', gap: measure(tk, 'display', size, ' ')}}>
							{ln.map((w) => {
								const idx = wi++;
								const p = popP(tk, f, lastStart + idx * tk.stagger);
								const pw = B.power.has(idx);
								return (
									<span key={idx} style={{...font, color: pw ? tk.powerInk : tk.text, display: 'inline-block', whiteSpace: 'nowrap', transform: `scale(${(0.6 + 0.4 * p).toFixed(4)})`, transformOrigin: '0% 60%', opacity: p > 0.02 ? 1 : 0}}>{w}</span>
								);
							})}
						</div>
					))}
				</div>
			</Card>
		</div>
	);
};
