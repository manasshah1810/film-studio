import React from 'react';
import {interpolate} from 'remotion';
import {Avatar, Cursor, Glyph} from './parts';
import {boxPx, boxStyle, card, enterP, lin, moveP, pillR, popP, txt, type WidgetBase} from './tokens';

/** 01 LiveCursor. A cursor glides to a button on a profile card, presses it, and the button flips state. */
export type LiveCursorProps = WidgetBase & {name: string; handle: string; label: string; labelAfter: string; clickAt?: number};
export const LIVE_CURSOR = {frames: 90, hero: 58, sfx: [{at: 'clickAt', id: 'click-soft'}]};

export const LiveCursor: React.FC<LiveCursorProps> = ({tk, frame: f, box, name, handle, label, labelAfter, clickAt = 40}) => {
	const {width: W} = boxPx(box);
	const cardH = 300, pad = 40, btnW = 300, btnH = 104;
	const btn = {x: W - pad - btnW, y: cardH - pad - btnH};
	const target = {x: btn.x + btnW * 0.86, y: btn.y + btnH * 0.78};
	const from = {x: W * 0.12, y: cardH + 300};
	const inn = enterP(tk, f, 0);
	const travel = moveP(tk, f, 8, clickAt - 10);
	// quadratic path with a control point above the straight line: a hand moves in an arc
	const ctl = {x: (from.x + target.x) / 2 + 60, y: Math.max(from.y, target.y) + 40};
	const q = (a: number, b: number, c: number) => (1 - travel) ** 2 * a + 2 * (1 - travel) * travel * b + travel ** 2 * c;
	const cur = {x: q(from.x, ctl.x, target.x), y: q(from.y, ctl.y, target.y)};
	const press = interpolate(f, [clickAt, clickAt + 3, clickAt + 7], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const done = f >= clickAt + 2;
	const ripple = lin(f, clickAt + 1, clickAt + 17);
	const check = popP(tk, f, clickAt + 2);
	const hover = travel > 0.92 ? 1 : 0;
	const btnFill = done ? 'surface' : 'primary';
	return (
		<div style={{...boxStyle(box), overflow: 'visible'}}>
			<div style={{...card(tk), position: 'absolute', left: 0, top: 0, width: W, height: cardH, opacity: inn, transform: `translateY(${(1 - inn) * 40}px)`, display: 'flex', alignItems: 'flex-start', gap: 28, padding: pad}}>
				<Avatar tk={tk} name={name} size={120} />
				<div style={{display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: 1}}>
					<span style={txt(tk, 'display', tk.size.body, tk.c.ink)}>{name}</span>
					<span style={txt(tk, 'body', tk.size.label, tk.c.ink)}>{handle}</span>
				</div>
			</div>
			<div
				style={{
					...card(tk, btnFill, pillR(tk, btnH), 1 - press + hover * 0.4),
					position: 'absolute',
					left: btn.x,
					top: btn.y,
					width: btnW,
					height: btnH,
					opacity: inn,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 14,
					transform: `translate(${press * 4}px, ${press * 4}px) scale(${1 - press * 0.05})`,
				}}
			>
				{done ? <Glyph id="check" size={40 * check} color={tk.on('surface').hex} /> : null}
				<span style={txt(tk, 'display', tk.size.label, tk.on(btnFill).hex)}>{done ? labelAfter : label}</span>
			</div>
			{ripple > 0 && ripple < 1 ? (
				<div style={{position: 'absolute', left: target.x - 20 - ripple * 110, top: target.y - 20 - ripple * 110, width: 40 + ripple * 220, height: 40 + ripple * 220, borderRadius: '50%', border: `6px solid ${tk.c.primary}`, opacity: 1 - ripple, boxSizing: 'border-box'}} />
			) : null}
			<div style={{opacity: lin(f, 4, 10)}}>
				<Cursor tk={tk} x={cur.x} y={cur.y} scale={1 - press * 0.15} />
			</div>
		</div>
	);
};
