import React from 'react';
import {fontCss} from '../../engine/tokens';
import {boxPx, boxStyle, enterP, popP} from '../social/tokens';
import {TAB, lab} from '../data/tokens';
import {whipP} from '../camera/tokens';
import {Card, Label, Word, frameOf} from './parts';
import {cased, fitSize, glyphBox, measure, type KineticBase} from './tokens';

/**
 * 42 LetterDive. A Z-dive through a letter. The word is a window cut in the card: the next scene (a `knock` fill)
 * shows through its letter shapes. The camera dives into one letter (the first I, T, H or E, else `dive`) on the whip
 * easing with an exponential scale, so the push feels constant, until that letter's stroke fills the window. Then the
 * next word pops in on the new scene. The dive point is the letter's measured ink centre, so it always lands on ink.
 */
export type LetterDiveProps = KineticBase & {label: string; word: string; to: string; dive?: number; diveAt?: number; diveFrames?: number; seed: string};
export const LETTER_DIVE = {frames: 72, hero: 28, sfx: [{at: 'diveAt', id: 'zoom-swell'}, {at: 'diveAt + diveFrames', id: 'sub-bass-hit'}]};

export const LetterDive: React.FC<LetterDiveProps> = ({tk, frame: f, box, label, word, to, dive, diveAt = 22, diveFrames = 22, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const {pad, head} = frameOf(tk);
	const foot = lab(tk, 0.82) * 1.4 + 40;
	const vw = W - pad * 2, vh = H - head - foot - pad;
	const w = cased(tk, 'display', word);
	const size = fitSize(tk, 'display', Math.min(tk.hero * 1.6, 280), [w], vw * 0.86, 1, 60);
	const total = measure(tk, 'display', size, w);
	const all = glyphBox(tk, 'display', size, w);
	const x0 = (vw - total) / 2;
	const base = vh * 0.5 + (all.ascent - all.descent) / 2;
	const auto = ['I', 'T', 'H', 'E'].map((c) => w.toUpperCase().indexOf(c)).find((i) => i >= 0) ?? 0;
	const di = Math.max(0, Math.min(w.length - 1, dive ?? auto));
	const xs = x0 + (di ? measure(tk, 'display', size, w.slice(0, di)) : 0);
	const g = glyphBox(tk, 'display', size, w[di]);
	const fx = xs + (g.left + g.right) / 2, fy = base - (g.ascent - g.descent) / 2;
	const cx = vw / 2, cy = vh / 2;
	const e = whipP(tk, f, diveAt, diveFrames);
	const Smax = (Math.max(vw, vh) * 2.4) / (size * 0.1);
	const S = Math.exp(Math.log(Smax) * e);
	const done = e >= 1;
	const settle = enterP(tk, f, 0, 10);
	const tp = popP(tk, f, diveAt + diveFrames + 2);
	const id = `ld-${seed}`;
	const tr = (tk.font.display as {tracking: number}).tracking * size;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={e > 0 ? tk.accent : tk.label} style={TAB}>{`Z ×${S.toFixed(S < 10 ? 2 : 1)}`}</Label>
				</div>
				<div style={{position: 'absolute', left: pad, top: head, width: vw, height: vh, overflow: 'hidden', borderRadius: tk.plateR}}>
					<div style={{position: 'absolute', inset: 0, background: tk.knock.fill}} />
					{done && (
						<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
							<Word tk={tk} size={Math.min(tk.hero, size)} color={tk.knock.text} scale={0.6 + 0.4 * tp} opacity={tp > 0 ? 1 : 0}>{to}</Word>
						</div>
					)}
					{!done && (
						<svg width={vw} height={vh} style={{position: 'absolute', left: 0, top: 0}}>
							<defs>
								<mask id={id} maskUnits="userSpaceOnUse" x={-8} y={-8} width={vw + 16} height={vh + 16}>
									<rect x={-8} y={-8} width={vw + 16} height={vh + 16} fill="#fff" />
									<g transform={`translate(${(fx + (cx - fx) * e).toFixed(2)} ${(fy + (cy - fy) * e).toFixed(2)}) scale(${S.toFixed(4)}) translate(${-fx} ${-fy})`}>
										<text x={x0} y={base} fill="#000" style={{...fontCss(tk.font.display, size), letterSpacing: tr}} transform={`translate(0 ${((1 - settle) * 30).toFixed(1)})`}>
											{w}
										</text>
									</g>
								</mask>
							</defs>
							<rect x={-8} y={-8} width={vw + 16} height={vh + 16} fill={tk.c.surface} mask={`url(#${id})`} />
						</svg>
					)}
				</div>
				<div style={{position: 'absolute', left: pad, right: pad, top: head + vh + 30, display: 'flex', justifyContent: 'space-between', gap: 24}}>
					<Label tk={tk} color={done ? tk.label : tk.accent}>{`INTO “${w[di]}”`}</Label>
					<Label tk={tk} color={done ? tk.accent : tk.label}>{done ? `NOW: ${cased(tk, 'display', to)}` : 'DIVING'}</Label>
				</div>
			</Card>
		</div>
	);
};
