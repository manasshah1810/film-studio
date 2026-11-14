import React from 'react';
import {boxPx, boxStyle, enterP, popP} from '../social/tokens';
import {TAB, rollP} from '../data/tokens';
import {Card, Label, WORD_PAD, Word, frameOf} from './parts';
import {breakLines, fitSize, measure, parseWords, type KineticBase} from './tokens';

/**
 * 46 KnockoutCaptions. The default spoken caption. Each word pops in on its spoken frame (pop spring, 0.6 to 1).
 * While spoken it sits on a `knock` block (primary) with its text knocked out, scale `activeScale`. A power word
 * (`*word*`) sits on a `power` block (highlight), scale `powerScale`, tilt `powerTilt`, and the stage punches in.
 * After it is spoken a word returns to the text colour; a power word stays `powerInk`. Lines are left aligned,
 * broken by measured width with no orphan word, and grouped in pages of `maxLines`; a full page cuts to the next.
 * At most 4 power words count; any after the fourth is set as a normal word.
 */
export type KnockoutCaptionsProps = KineticBase & {label: string; text: string; at?: number[]; startAt?: number; maxLines?: number; seed: string};
export const KNOCKOUT_CAPTIONS = {frames: 96, hero: 46, sfx: [{at: 'each power word', id: 'tactile-pop'}]};

export const KnockoutCaptions: React.FC<KnockoutCaptionsProps> = ({tk, frame: f, box, label, text, at, startAt = 8, maxLines = 3}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const {pad, head} = frameOf(tk);
	const vw = W - pad * 2, vh = H - head - pad;
	const {words, power: pw0} = parseWords(text);
	const power = new Set([...pw0].slice(0, 4));
	const t = words.map((_, i) => at?.[i] ?? startAt + i * tk.beat);
	const padEm = WORD_PAD[0] * 2 * tk.powerScale;
	// Largest fitting size, then step down (to 0.8 of it) to the first size where no line holds a lone word.
	const fit = fitSize(tk, 'display', tk.h1, words, vw, maxLines * 2, 56, Infinity, padEm);
	let size = fit;
	for (let s = fit; s >= fit * 0.8; s -= 2) {
		if (breakLines(tk, 'display', s, words, vw, Infinity, padEm).every((l) => l.length > 1)) { size = s; break; }
	}
	const lines = breakLines(tk, 'display', size, words, vw, Infinity, padEm);
	const pages: number[][][] = [];
	let idx = 0;
	lines.forEach((ln, li) => {
		if (li % maxLines === 0) pages.push([]);
		pages[pages.length - 1].push(ln.map(() => idx++));
	});
	const cur = words.reduce((a, _, i) => (f >= t[i] ? i : a), -1);
	const page = Math.max(0, pages.findIndex((p) => p.some((ln) => ln.includes(Math.max(0, cur)))));
	const end = (i: number) => (i + 1 < t.length ? t[i + 1] : t[i] + tk.beat * 2);
	const lastPower = [...power].filter((i) => f >= t[i]).pop();
	const punch = lastPower === undefined ? 0 : (() => {
		const a = t[lastPower];
		const up = enterP(tk, f, a, 4), down = rollP(tk, f, a + 4, 14);
		return up * (1 - down);
	})();
	const stage = 1 + (tk.punch - 1) * punch;
	const lh = size * Math.max(1, (tk.font.display as {lineHeight: number}).lineHeight) * 1.16;
	const rows = pages[page] ?? [];
	const top = Math.max(0, (vh - rows.length * lh) * 0.42);
	const space = measure(tk, 'display', size, ' ');
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={cur >= 0 ? tk.accent : tk.label} style={TAB}>{`${String(Math.max(0, cur + 1)).padStart(2, '0')}/${String(words.length).padStart(2, '0')}`}</Label>
				</div>
				<div style={{position: 'absolute', left: pad, top: head, width: vw, height: vh, transform: `scale(${stage.toFixed(4)})`, transformOrigin: `0px ${top + (rows.length * lh) / 2}px`}}>
					{rows.map((ln, li) => (
						<div key={`${page}-${li}`} style={{position: 'absolute', left: -size * WORD_PAD[0], top: top + li * lh, height: lh, display: 'flex', alignItems: 'center', gap: space - size * WORD_PAD[0] * 2 + size * 0.16}}>
							{ln.map((i) => {
								if (f < t[i]) return <span key={i} style={{visibility: 'hidden'}}><Word tk={tk} size={size} color={tk.text}>{words[i]}</Word></span>;
								const p = popP(tk, f, t[i]);
								const active = f < end(i);
								const isP = power.has(i);
								const fill = active ? (isP ? tk.power.fill : tk.knock.fill) : null;
								const color = active ? (isP ? tk.power.text : tk.knock.text) : isP ? tk.powerInk : tk.text;
								const sc = (0.6 + 0.4 * p) * (active ? (isP ? tk.powerScale : tk.activeScale) : 1);
								return (
									<Word key={i} tk={tk} size={size} color={color} fill={fill} scale={sc} tilt={active && isP ? tk.powerTilt : 0} style={{position: 'relative', zIndex: active ? 2 : 1}}>
										{words[i]}
									</Word>
								);
							})}
						</div>
					))}
				</div>
			</Card>
		</div>
	);
};
