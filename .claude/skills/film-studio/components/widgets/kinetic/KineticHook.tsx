import React from 'react';
import {boxPx, boxStyle, enterP} from '../social/tokens';
import {drawP, rollP} from '../data/tokens';
import {Odometer} from '../data/parts';
import {slamP, whipP} from '../camera/tokens';
import {Card, Label, WORD_PAD, Word, frameOf} from './parts';
import {breakLines, fitSize, measure, parseWords, springAt, type KineticBase} from './tokens';

/**
 * 47 KineticHook. The first two seconds. The stage starts at `pullFrom` and springs back to 1 (pull-back spring).
 * The hook slams in word by word at hero size, left aligned, at most 12 characters a line, broken with no orphan
 * word. The power word (`*word*`) lands on a `power` block with the tilt, the stage punches in, and a strike-colour
 * swipe draws under it. A `{n}` word rolls as a counter to `count.to`. The last 4 frames whip the stage out on x.
 */
export type KineticHookProps = KineticBase & {
	label: string; kicker: string; text: string; count?: {from?: number; to: number; prefix?: string; suffix?: string};
	startAt?: number; gap?: number; exit?: boolean; frames?: number; seed: string;
};
export const KINETIC_HOOK = {frames: 84, hero: 60, sfx: [{at: 0, id: 'zoom-swell'}, {at: 'each word', id: 'tactile-pop'}, {at: 'power word', id: 'sub-bass-hit'}, {at: 'frames - 4', id: 'fast-whoosh'}]};

export const KineticHook: React.FC<KineticHookProps> = ({tk, frame: f, box, label, kicker, text, count, startAt = 8, gap = 6, exit = true, frames = KINETIC_HOOK.frames}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 8);
	const {pad, head} = frameOf(tk);
	const vw = W - pad * 2, vh = H - head - pad;
	const {words: raw, power} = parseWords(text);
	const num = (c: NonNullable<KineticHookProps['count']>) => `${c.prefix ?? ''}${Math.round(c.to).toLocaleString('en-US')}${c.suffix ?? ''}`;
	const words = raw.map((w) => (w === '{n}' && count ? num(count) : w));
	const padEm = WORD_PAD[0] * 2 * tk.powerScale;
	const size = fitSize(tk, 'display', tk.hero, words, vw, 5, 64, 12, padEm);
	const lines = breakLines(tk, 'display', size, words, vw, 12, padEm);
	const t = words.map((_, i) => startAt + i * gap);
	const pIdx = [...power][0];
	const pull = 1 + (tk.pullFrom - 1) * (1 - springAt(tk.pullback, f, 0));
	const punch = pIdx === undefined ? 0 : enterP(tk, f, t[pIdx], 4) * (1 - rollP(tk, f, t[pIdx] + 4, 14));
	const out = exit ? whipP(tk, f, frames - 4, 4) : 0;
	const stage = pull * (1 + (tk.punch - 1) * punch);
	const lh = size * Math.max(0.94, (tk.font.display as {lineHeight: number}).lineHeight) * 1.1;
	const kick = Math.min(tk.size.h2, 64);
	const blockH = kick * 1.5 + lines.length * lh;
	const top = Math.max(0, (vh - blockH) * 0.4);
	const space = measure(tk, 'display', size, ' ');
	let idx = 0;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5)}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={f >= t[t.length - 1] ? tk.accent : tk.label}>{f >= t[t.length - 1] ? 'LANDED' : 'BUILDING'}</Label>
				</div>
				<div style={{position: 'absolute', left: pad, top: head, width: vw, height: vh, transform: `translateX(${(out * vw * 1.1).toFixed(1)}px) scale(${stage.toFixed(4)})`, transformOrigin: `0px ${top + blockH / 2}px`, filter: out > 0 ? `blur(${(out * tk.whipBlur).toFixed(1)}px)` : 'none'}}>
					<div style={{position: 'absolute', left: 0, top, opacity: enterP(tk, f, 2, 6)}}>
						<Word tk={tk} role="accent" size={kick} color={tk.accent} style={{paddingLeft: 0}}>{kicker}</Word>
					</div>
					{lines.map((ln, li) => (
						<div key={li} style={{position: 'absolute', left: -size * WORD_PAD[0], top: top + kick * 1.5 + li * lh, height: lh, display: 'flex', alignItems: 'center', gap: space - size * WORD_PAD[0] * 2 + size * 0.05}}>
							{ln.map((w) => {
								const i = idx++;
								const s = slamP(tk, f, t[i]);
								if (f < t[i]) return <span key={i} style={{visibility: 'hidden'}}><Word tk={tk} size={size} color={tk.text}>{w}</Word></span>;
								const isP = i === pIdx;
								const sc = (1.7 - 0.7 * s) * (isP ? tk.powerScale : 1);
								const isN = raw[i] === '{n}' && count;
								const swipe = isP ? drawP(tk, f, t[i] + 3, 8) : 0;
								return (
									<span key={i} style={{position: 'relative', display: 'inline-block', zIndex: isP ? 2 : 1}}>
										<Word tk={tk} size={size} color={isP ? tk.power.text : isN ? 'transparent' : tk.text} fill={isP ? tk.power.fill : null} scale={sc} tilt={isP ? tk.powerTilt : 0} opacity={Math.min(1, s * 3)}>
											{w}
										</Word>
										{isN && (
											<span style={{position: 'absolute', left: size * WORD_PAD[0], top: size * WORD_PAD[1], transform: `scale(${sc.toFixed(4)})`, transformOrigin: '50% 55%'}}>
												<Odometer tk={tk} from={count.from ?? 0} to={count.to} p={rollP(tk, f, t[i], 18)} size={size} color={tk.powerInk} prefix={count.prefix} suffix={count.suffix} />
											</span>
										)}
										{isP && <div style={{position: 'absolute', left: size * 0.04, bottom: -size * 0.08, height: Math.max(8, size * 0.07), width: `${(swipe * 100).toFixed(1)}%`, background: tk.strike, transform: `rotate(${tk.powerTilt}deg)`}} />}
									</span>
								);
							})}
						</div>
					))}
				</div>
			</Card>
		</div>
	);
};
