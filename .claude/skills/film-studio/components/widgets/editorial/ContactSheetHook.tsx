import React from 'react';
import {interpolate} from 'remotion';
import {boxPx, boxStyle, enterP, lin, moveP, popP, txt} from '../social/tokens';
import {Halftone, Paper, PenOver, ringPath, type Subject} from './parts';
import {jit, type EditorialBase} from './tokens';

/** 19 ContactSheetHook. A loupe scans a contact sheet, a grease pencil rings one frame, that frame zooms up with the hook. */
export type ContactSheetHookProps = EditorialBase & {roll: string; target: number; caption: string; subjects?: Subject[]; startNo?: number; seed: string};
export const CONTACT_SHEET_HOOK = {frames: 100, hero: 94, sfx: [{at: 10, id: 'click-soft'}, {at: 46, id: 'pen-scratch'}, {at: 53, id: 'zoom-swell'}, {at: 62, id: 'shutter-click'}]};

const SUBJ: Subject[] = ['portrait', 'skyline', 'crowd', 'horizon', 'building'];

export const ContactSheetHook: React.FC<ContactSheetHookProps> = ({tk, frame: f, box, roll, target, caption, subjects = SUBJ, startNo = 1, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 36, head = 64, cols = 3, rows = 4, gap = 12, sp = 30, bandGap = 14;
	const fw = (W - pad * 2 - gap * (cols + 1)) / cols, fh = fw / 1.5;
	const bandH = fh + sp * 2;
	const fx = (i: number) => pad + gap + (i % cols) * (fw + gap);
	const fy = (i: number) => pad + head + Math.floor(i / cols) * (bandH + bandGap) + sp;
	const subj = (i: number) => subjects[(i * 7 + 3) % subjects.length];
	const onInk = tk.on('ink').hex;
	// Loupe: frame 0 -> frame 4 -> target.
	const path = [0, 4, target];
	const lp = moveP(tk, f, 10, 34) * 2;
	const seg = Math.min(1, Math.floor(lp)), t = lp - seg;
	const a = path[seg], z = path[Math.min(2, seg + 1)];
	const lx = interpolate(t, [0, 1], [fx(a) + fw / 2, fx(z) + fw / 2]), ly = interpolate(t, [0, 1], [fy(a) + fh / 2, fy(z) + fh / 2]);
	const loupeOut = lin(f, 46, 54);
	const ring = (f - 46) / 12;
	const zoom = moveP(tk, f, 62, 16);
	const bw = W - pad * 2, bh = bw / 1.5, bx = pad, by = pad + head + 20;
	const cap = popP(tk, f, 80);
	const s0 = fw / bw;
	const ox = interpolate(zoom, [0, 1], [fx(target), bx]), oy = interpolate(zoom, [0, 1], [fy(target), by]), sc = interpolate(zoom, [0, 1], [s0, 1]);
	return (
		<div style={{...boxStyle(box), overflow: 'visible', opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 60}px) rotate(0.6deg)`}}>
			<Paper tk={tk} w={W} h={H} seed={seed} torn={false}>
				<span style={{position: 'absolute', left: pad, top: pad, ...txt(tk, 'mono', tk.size.label * 0.8, tk.text)}}>{roll}</span>
				{Array.from({length: rows}).map((_, r) => (
					<div key={r} style={{position: 'absolute', left: pad, top: pad + head + r * (bandH + bandGap), width: W - pad * 2, height: bandH, background: tk.c.ink, opacity: lin(f, 2 + r * 2, 8 + r * 2)}}>
						{Array.from({length: Math.floor((W - pad * 2) / 30)}).map((_, k) => (
							<div key={k} style={{position: 'absolute', left: 10 + k * 30, top: 8, width: 12, height: 14, borderRadius: 3, background: tk.c.surface}} />
						))}
						{Array.from({length: cols}).map((_, c) => (
							<span key={c} style={{position: 'absolute', left: gap + c * (fw + gap) + 4, bottom: 2, ...txt(tk, 'mono', 20, onInk)}}>{`${startNo + r * cols + c}A`}</span>
						))}
					</div>
				))}
				{Array.from({length: rows * cols}).map((_, i) => (
					<div key={i} style={{position: 'absolute', left: fx(i), top: fy(i), width: fw, height: fh, background: tk.c.surface, overflow: 'hidden', opacity: lin(f, 4 + i, 10 + i)}}>
						<Halftone tk={tk} w={fw} h={fh} subject={subj(i)} seed={`${seed}${i}`} pitch={7} />
					</div>
				))}
				{ring > 0 && zoom < 0.4 ? (
					<div style={{position: 'absolute', left: fx(target), top: fy(target), width: fw, height: fh}}>
						<div style={{opacity: 1 - zoom * 2.5, position: "absolute", inset: 0}}><PenOver d={ringPath(`${seed}r`)} color={tk.pen.hex} w={tk.pen.w * 1.8} p={ring} inset={[18, 18]} /></div>
					</div>
				) : null}
				<div style={{position: "absolute", left: pad, top: pad + head, width: W - pad * 2, height: rows * (bandH + bandGap) - bandGap, background: tk.c.ink, opacity: zoom * 0.55}} />
				{zoom > 0 ? (
					<div style={{position: 'absolute', left: ox, top: oy, width: bw, height: bh, transform: `scale(${sc})`, transformOrigin: '0 0', background: tk.c.surface, outline: `${8 / sc}px solid ${tk.c.surface}`}}>
						<Halftone tk={tk} w={bw} h={bh} subject={subj(target)} seed={`${seed}${target}`} pitch={7 / s0} />
					</div>
				) : null}
				{f < 54 ? (
					<div style={{position: 'absolute', left: lx - 110, top: ly - 110, width: 220, height: 220, borderRadius: 110, border: `10px solid ${tk.text}`, background: tk.c.surface, opacity: (1 - loupeOut) * lin(f, 8, 12) * 0.25, boxSizing: 'border-box'}} />
				) : null}
				{f < 54 ? (
					<div style={{position: 'absolute', left: lx - 110, top: ly - 110, width: 220, height: 220, borderRadius: 110, border: `10px solid ${tk.text}`, opacity: (1 - loupeOut) * lin(f, 8, 12), boxSizing: 'border-box'}} />
				) : null}
				{cap > 0 ? (
					<div style={{position: 'absolute', left: bx, top: by + bh + 34, width: bw, background: tk.c.surface, padding: '22px 26px', boxSizing: 'border-box', opacity: Math.min(1, cap * 1.5), transform: `translateY(${(1 - cap) * 30}px) ${jit(tk, f, `${seed}c`)}`, border: `${Math.max(tk.border.w, tk.rule.thin)}px solid ${tk.text}`}}>
						<span style={txt(tk, 'mono', tk.size.label * 0.8, tk.text)}>{`FRAME ${startNo + target}A`}</span>
						<div style={{...txt(tk, 'display', tk.size.h2, tk.text), whiteSpace: 'normal', marginTop: 10, lineHeight: 1.05, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>{caption}</div>
					</div>
				) : null}
			</Paper>
		</div>
	);
};
