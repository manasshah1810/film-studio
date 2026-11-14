import React from 'react';
import {Glyph} from './parts';
import {boxPx, boxStyle, card, enterP, lin, popP, seeded, txt, type FillRole, type WidgetBase} from './tokens';

/** 10 JiggleDelete. A home grid enters edit mode: icons jiggle, minus badges pop, one app is tapped away, the rest reflow. */
export type JiggleDeleteProps = WidgetBase & {apps: string[]; target: number; editAt?: number; deleteAt?: number; cols?: number};
export const JIGGLE_DELETE = {frames: 90, hero: 43, sfx: [{at: 'editAt', id: 'tactile-pop'}, {at: 'deleteAt', id: 'click-soft'}, {at: 'deleteAt + 4', id: 'tactile-pop'}]};

const FILLS: FillRole[] = ['primary', 'surface', 'highlight', 'ink'];

export const JiggleDelete: React.FC<JiggleDeleteProps> = ({tk, frame: f, box, apps, target, editAt = 12, deleteAt = 40, cols = 4}) => {
	const {width: W} = boxPx(box);
	const icon = 160;
	const gx = (W - cols * icon) / (cols - 1);
	const cellH = icon + 80;
	const inn = enterP(tk, f, 0);
	const edit = popP(tk, f, editAt);
	const tap = lin(f, deleteAt, deleteAt + 4) - lin(f, deleteAt + 4, deleteAt + 8);
	const gone = enterP(tk, f, deleteAt + 4, 8);
	const reflow = popP(tk, f, deleteAt + 10);
	const slot = (s: number) => ({x: (s % cols) * (icon + gx), y: Math.floor(s / cols) * cellH});
	const iconR = Math.min(Math.max(tk.radius, 0), icon * 0.28);
	return (
		<div style={{...boxStyle(box), overflow: 'visible', opacity: inn}}>
			{apps.map((name, i) => {
				const isT = i === target;
				const from = slot(i), to = slot(i > target ? i - 1 : i);
				const x = from.x + (to.x - from.x) * reflow, y = from.y + (to.y - from.y) * reflow;
				const phase = seeded(`jig-${i}`, 0, Math.PI * 2);
				const amp = f >= editAt ? 2.4 : 0;
				const rot = Math.sin(f * 0.85 + phase) * amp;
				const fill = FILLS[i % FILLS.length];
				const s = isT ? (1 - gone) * (1 - tap * 0.06) : 1;
				if (isT && gone >= 1) return null;
				return (
					<div key={i} style={{position: 'absolute', left: x, top: y, width: icon, height: cellH, transform: `rotate(${rot}deg) scale(${s})`, transformOrigin: `${icon / 2}px ${icon / 2}px`, opacity: isT ? 1 - gone : 1}}>
						<div style={{...card(tk, fill, iconR, 0.6), width: icon, height: icon, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
							<span style={txt(tk, 'display', 72, tk.on(fill).hex)}>{name[0]}</span>
						</div>
						<div style={{...txt(tk, 'body', tk.size.label * 0.88, tk.c.ink), width: icon + gx * 0.8, marginLeft: -gx * 0.4, textAlign: 'center', marginTop: 12}}>{name}</div>
						{edit > 0 ? (
							<div style={{...card(tk, 'surface', 30, 0.5), position: 'absolute', left: -18, top: -18, width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${edit * (isT ? 1 + tap * 0.25 : 1)})`, background: isT && f >= deleteAt ? tk.c.alert : tk.c.surface}}>
								<Glyph id="minus" size={34} color={isT && f >= deleteAt ? tk.on('alert').hex : tk.c.ink} />
							</div>
						) : null}
						{isT && tap > 0 ? <div style={{position: 'absolute', left: -48, top: -48, width: 120, height: 120, borderRadius: 60, border: `6px solid ${tk.c.primary}`, opacity: tap, transform: `scale(${0.6 + tap * 0.6})`, boxSizing: 'border-box'}} /> : null}
					</div>
				);
			})}
		</div>
	);
};
