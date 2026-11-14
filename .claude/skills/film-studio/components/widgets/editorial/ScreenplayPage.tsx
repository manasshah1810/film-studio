import React from 'react';
import {boxPx, boxStyle, enterP, txt} from '../social/tokens';
import {Paper, PenOver, ringPath} from './parts';
import {jit, type EditorialBase} from './tokens';

/** 14 ScreenplayPage. A script page types itself in screenplay format; the pen circles the speaker and brackets the line. */
export type ScreenplayPageProps = EditorialBase & {page: number; heading: string; action: string; character: string; paren?: string; dialogue: string; typeAt?: number; cps?: number; seed: string};
export const SCREENPLAY_PAGE = {frames: 110, hero: 104, sfx: [{at: 'typeAt + every 3rd character', id: 'click-soft'}, {at: 'done + 4', id: 'pen-scratch'}, {at: 'done + 16', id: 'pen-scratch'}]};

export const ScreenplayPage: React.FC<ScreenplayPageProps> = ({tk, frame: f, box, page, heading, action, character, paren, dialogue, typeAt = 6, cps = 2.6, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const parts = [heading.toUpperCase(), action, character.toUpperCase(), paren ? `(${paren})` : '', dialogue];
	const total = parts.reduce((s, p) => s + p.length, 0);
	const typed = Math.max(0, Math.floor((f - typeAt) * cps));
	const done = typeAt + Math.ceil(total / cps);
	const ring = (f - done - 4) / 14;
	const bracket = (f - done - 16) / 12;
	const size = tk.size.label;
	const lh = size * 1.45;
	let used = 0;
	const T = (i: number, extra: React.CSSProperties) => {
		const s = parts[i];
		const n = Math.max(0, Math.min(s.length, typed - used));
		const active = typed >= used && typed < used + s.length;
		used += s.length;
		if (!s) return null;
		return (
			<div style={{...txt(tk, 'mono', size, tk.text), whiteSpace: 'pre-wrap', overflow: 'visible', lineHeight: `${lh}px`, textTransform: 'none', ...extra}}>
				<span>{s.slice(0, n)}</span>
				{active ? <span style={{display: 'inline-block', width: 0, position: 'relative'}}><span style={{position: 'absolute', left: 1, top: -size * 0.85, width: size * 0.55, height: size * 1.05, background: tk.text, opacity: 0.85}} /></span> : null}
				<span style={{color: 'transparent'}}>{s.slice(n)}</span>
			</div>
		);
	};
	const L = 96, R = 72;
	const tw = W - L - R;
	return (
		<div style={{...boxStyle(box), overflow: 'visible', opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 60}px) rotate(-0.6deg)`}}>
			<Paper tk={tk} w={W} h={H} seed={seed} torn={false}>
				<div style={{position: 'absolute', right: R, top: 54, ...txt(tk, 'mono', size * 0.86, tk.text)}}>{`${page}.`}</div>
				<div style={{position: 'absolute', left: L, top: 140, width: tw, display: 'flex', flexDirection: 'column', gap: lh * 0.9}}>
					{T(0, {})}
					{T(1, {})}
					<div style={{display: 'flex', flexDirection: 'column'}}>
						<div style={{marginLeft: tw * 0.36, position: 'relative', alignSelf: 'flex-start'}}>
							{T(2, {})}
							{ring > 0 ? <PenOver d={ringPath(`${seed}r`)} color={tk.pen.hex} w={tk.pen.w} p={ring} inset={[22, 4]} /> : null}
						</div>
						{T(3, {marginLeft: tw * 0.26, marginTop: 10})}
						<div style={{marginLeft: tw * 0.16, width: tw * 0.66, position: 'relative'}}>
							{T(4, {})}
							{bracket > 0 ? (
								<div style={{position: 'absolute', left: -46, top: 4, width: 24, bottom: 4, transform: jit(tk, f, `${seed}b`)}}>
									<PenOver d="M100 0 Q0 0 0 8 L0 92 Q0 100 100 100" color={tk.pen.hex} w={tk.pen.w} p={bracket} />
								</div>
							) : null}
						</div>
					</div>
				</div>
			</Paper>
		</div>
	);
};
