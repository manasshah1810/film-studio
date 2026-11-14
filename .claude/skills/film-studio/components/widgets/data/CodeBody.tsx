import React from 'react';
import {contrast, mix} from '../../engine/tokens';
import {boxPx, boxStyle, enterP, lin, txt} from '../social/tokens';
import {Card, Label} from './parts';
import {TAB, type DataBase} from './tokens';

/** 24 CodeBody. An editor pane: code types in with tabular line numbers and token colours, then one line gets a focus band. */
export type CodeBodyProps = DataBase & {file: string; lines: string[]; focus?: number; typeAt?: number; cps?: number; seed: string};
export const CODE_BODY = {frames: 120, hero: 114, sfx: [{at: 'typeAt + per char', id: 'digital-tick'}, {at: 'done + 6', id: 'click-soft'}]};

const KW = new Set(['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'await', 'async', 'import', 'from', 'export', 'new', 'def', 'class', 'true', 'false', 'null']);
type Tok = {t: string; k: 'kw' | 'str' | 'num' | 'com' | 'fn' | 'txt'};
/** Small tokenizer: keywords, strings, numbers, // comments, calls. Enough for a 6 to 10 line snippet. */
export const tokenize = (line: string): Tok[] => {
	const out: Tok[] = [];
	const re = /(\/\/.*$|#.*$)|("[^"]*"?|'[^']*'?|`[^`]*`?)|(\b\d[\d_.]*\b)|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)|(\s+|.)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(line))) {
		if (m[1]) out.push({t: m[1], k: 'com'});
		else if (m[2]) out.push({t: m[2], k: 'str'});
		else if (m[3]) out.push({t: m[3], k: 'num'});
		else if (m[4]) out.push({t: m[4], k: KW.has(m[4]) ? 'kw' : 'fn'});
		else if (m[5]) out.push({t: m[5], k: KW.has(m[5]) ? 'kw' : 'txt'});
		else out.push({t: m[6], k: 'txt'});
	}
	return out;
};

export const CodeBody: React.FC<CodeBodyProps> = ({tk, frame: f, box, file, lines, focus, typeAt = 8, cps = 2.2}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 44;
	const head = 92;
	const fs = Math.max(tk.labelMin, Math.min(tk.size.label, 32));
	const lh = fs * 1.62;
	const gutter = fs * 2.4;
	const safe = (hex: string) => (contrast(hex, tk.c.surface) >= 4.5 ? hex : tk.text);
	const col: Record<Tok['k'], string> = {kw: safe(tk.c.primary), str: safe(tk.c.highlight), num: safe(tk.c.highlight), fn: tk.text, com: tk.label, txt: tk.text};
	const total = lines.reduce((s, l) => s + l.length, 0);
	const typed = Math.max(0, Math.floor((f - typeAt) * cps));
	const done = typeAt + Math.ceil(total / cps);
	let left = typed;
	let curLine = 0, curCol = 0;
	const shown = lines.map((l, i) => {
		const n = Math.max(0, Math.min(l.length, left));
		left -= l.length;
		if (n > 0 || i === 0) {
			curLine = i;
			curCol = n;
		}
		return l.slice(0, n);
	});
	const band = focus !== undefined ? enterP(tk, f, done + 6, 10) : 0;
	const blink = f >= done ? Math.floor((f - done) / 12) % 2 === 0 : true;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: 0, top: 0, right: 0, height: head, borderBottom: `${tk.stroke.hair}px solid ${tk.grid}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${pad}px`, boxSizing: 'border-box'}}>
					<Label tk={tk} color={tk.text}>{file}</Label>
					<Label tk={tk}>{`LN ${String(curLine + 1).padStart(2, '0')}  COL ${String(curCol + 1).padStart(2, '0')}`}</Label>
				</div>
				<div style={{position: 'absolute', left: 0, right: 0, top: head + 28}}>
					{focus !== undefined && (
						<div style={{position: 'absolute', left: 0, top: focus * lh - 4, height: lh + 8, width: W * band, background: mix(tk.c.surface, tk.series[0], 0.16), borderLeft: `${tk.stroke.line}px solid ${tk.series[0]}`, boxSizing: 'border-box'}} />
					)}
					{lines.map((_, i) => (
						<div key={i} style={{position: 'relative', height: lh, display: 'flex', alignItems: 'center', opacity: lin(f, typeAt - 6 + i, typeAt + i)}}>
							<span style={{...txt(tk, 'mono', fs, focus === i && band > 0.5 ? tk.text : tk.label), ...TAB, width: gutter, textAlign: 'right', paddingRight: fs * 0.9, flex: 'none', textTransform: 'none'}}>{i + 1}</span>
							<span style={{...txt(tk, 'mono', fs, tk.text), textTransform: 'none', whiteSpace: 'pre', overflow: 'visible', letterSpacing: 0}}>
								{tokenize(shown[i]).map((t, k) => (
									<span key={k} style={{color: col[t.k]}}>{t.t}</span>
								))}
								{i === curLine && blink && <span style={{display: 'inline-block', width: '0.6em', height: '1.1em', verticalAlign: 'middle', background: tk.series[0], marginLeft: 2}} />}
							</span>
						</div>
					))}
				</div>
			</Card>
		</div>
	);
};
