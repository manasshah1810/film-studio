import React from 'react';
import {boxPx, boxStyle, enterP, popP} from '../social/tokens';
import {TAB, lab, rollP} from '../data/tokens';
import {Card, Label, WORD_PAD, Word, frameOf} from './parts';
import {measure, parseWords, type KineticBase} from './tokens';

/**
 * 49 GiantCaptions. The hook and the payoff: one word per beat at hero size (180 px cap), centred in the safe zone.
 * Each word pops (0.6 to 1, overshoot) on its beat and hard-cuts on the next. A power word (`*word*`) sits on a
 * `power` block with the tilt and the stage punches in. One size holds for the whole line (the largest at which the
 * longest word fits), so the words never jump in size. A progress row marks the word in the line.
 */
export type GiantCaptionsProps = KineticBase & {label: string; text: string; beatFrames?: number; startAt?: number; seed: string};
export const GIANT_CAPTIONS = {frames: 84, hero: 42, sfx: [{at: 'each word', id: 'tactile-pop'}, {at: 'power word', id: 'sub-bass-hit'}]};

export const GiantCaptions: React.FC<GiantCaptionsProps> = ({tk, frame: f, box, label, text, beatFrames = 12, startAt = 4}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 8);
	const {pad, head} = frameOf(tk);
	const vw = W - pad * 2, vh = H - head - pad;
	const {words, power} = parseWords(text);
	const room = vw / (tk.powerScale * (1 + WORD_PAD[0] * 2 * 1.05));
	let size = tk.hero;
	while (size > 60 && words.some((w) => measure(tk, 'display', size, w) > room)) size -= 2;
	const cur = Math.min(words.length - 1, Math.floor((f - startAt) / beatFrames));
	const at = startAt + cur * beatFrames;
	const isP = cur >= 0 && power.has(cur);
	const p = cur >= 0 ? popP(tk, f, at) : 0;
	const punch = isP ? enterP(tk, f, at, 4) * (1 - rollP(tk, f, at + 4, 14)) : 0;
	const stage = 1 + (tk.punch - 1) * punch;
	const dot = Math.max(14, lab(tk, 0.5));
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5)}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={isP ? tk.accent : tk.label} style={TAB}>{`${String(Math.max(0, cur + 1)).padStart(2, '0')}/${String(words.length).padStart(2, '0')}`}</Label>
				</div>
				<div style={{position: 'absolute', left: pad, top: head, width: vw, height: vh - dot * 4, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${stage.toFixed(4)})`}}>
					{cur >= 0 && (
						<Word key={cur} tk={tk} size={size} color={isP ? tk.power.text : tk.text} fill={isP ? tk.power.fill : null} scale={(0.6 + 0.4 * p) * (isP ? tk.powerScale : 1)} tilt={isP ? tk.powerTilt : 0}>
							{words[cur]}
						</Word>
					)}
				</div>
				<div style={{position: 'absolute', left: pad, right: pad, bottom: pad + dot, display: 'flex', justifyContent: 'center', gap: dot}}>
					{words.map((_, i) => (
						<div key={i} style={{width: i === cur ? dot * 3 : dot, height: dot, borderRadius: Math.min(tk.pill, dot / 2), background: i === cur ? (power.has(i) ? tk.power.fill : tk.series[0]) : i < cur ? tk.label : tk.grid}} />
					))}
				</div>
			</Card>
		</div>
	);
};
