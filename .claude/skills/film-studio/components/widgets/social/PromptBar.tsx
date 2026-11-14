import React from 'react';
import {Glyph} from './parts';
import {boxPx, boxStyle, card, enterP, lin, pillR, txt, type WidgetBase} from './tokens';

/** 09 PromptBar. A prompt types into an assistant bar, is sent, three dots think, then the answer streams in word by word. */
export type PromptBarProps = WidgetBase & {prompt: string; answer: string; typeAt?: number; cps?: number};
export const PROMPT_BAR = {frames: 100, hero: 92, sfx: [{at: 'typing, every 2nd character', id: 'digital-tick'}, {at: 'send', id: 'click-soft'}, {at: 'answer start', id: 'notification-ping'}]};

export const PromptBar: React.FC<PromptBarProps> = ({tk, frame: f, box, prompt, answer, typeAt = 8, cps = 1.4}) => {
	const {width: W} = boxPx(box);
	const inn = enterP(tk, f, 0);
	const shown = Math.max(0, Math.min(prompt.length, Math.floor((f - typeAt) * cps)));
	const send = typeAt + Math.ceil(prompt.length / cps) + 6;
	const press = lin(f, send, send + 3) - lin(f, send + 3, send + 8);
	const think = send + 4, ans = think + 18;
	const words = answer.split(' ');
	const nWords = Math.max(0, Math.min(words.length, Math.floor((f - ans) / 2) + 1));
	const barH = 190, btn = 96;
	const resp = enterP(tk, f, think);
	const caret = f < send && Math.floor(f / 8) % 2 === 0;
	return (
		<div style={{...boxStyle(box), overflow: 'visible'}}>
			<div style={{...card(tk, 'surface', pillR(tk, barH)), position: 'absolute', left: 0, top: 0, width: W, height: barH, opacity: inn, transform: `translateY(${(1 - inn) * 30}px)`, display: 'flex', alignItems: 'center', gap: 22, padding: '0 22px 0 34px'}}>
				<Glyph id="spark" size={50} color={tk.c.primary} style={{flex: 'none', transform: `rotate(${f * 2}deg)`}} />
				<div style={{flex: 1, minWidth: 0, ...txt(tk, 'body', tk.size.body, tk.c.ink), whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
					{prompt.slice(0, shown)}
					{caret ? <span style={{display: 'inline-block', width: 4, height: tk.size.body, background: tk.c.primary, marginLeft: 4, verticalAlign: 'middle'}} /> : null}
				</div>
				<div style={{...card(tk, 'primary', btn / 2, 1 - press), width: btn, height: btn, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: shown === prompt.length ? 1 : 0.45, transform: `scale(${1 - press * 0.08})`}}>
					<Glyph id="send" size={48} color={tk.on('primary').hex} />
				</div>
			</div>
			{f >= think ? (
				<div style={{...card(tk), position: 'absolute', left: 0, top: barH + 30, width: W, minHeight: 150, padding: '30px 36px', opacity: resp, transform: `translateY(${(1 - resp) * 30}px)`}}>
					{f < ans ? (
						<div style={{display: 'flex', gap: 14, height: 60, alignItems: 'center'}}>
							{[0, 1, 2].map((i) => (
								<div key={i} style={{width: 20, height: 20, borderRadius: 10, background: tk.c.primary, transform: `translateY(${Math.sin((f - think) * 0.5 - i * 0.9) * -8}px)`}} />
							))}
						</div>
					) : (
						<div style={{...txt(tk, 'body', tk.size.label, tk.c.ink), whiteSpace: 'normal', lineHeight: 1.35}}>{words.slice(0, nWords).join(' ')}</div>
					)}
				</div>
			) : null}
		</div>
	);
};
