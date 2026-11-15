import React from 'react';
import {rnd, span, type BespokeScene} from '../kit';

/** s2 / s8: the "coin" is a row in a plain database table. A caret walks down the rows and types each balance;
 * typed rows are masked and the active one types # marks, so no number on screen reads as a real figure. */
export const TypedLedger: BespokeScene = ({kit}) => {
	const {frame: f, box, role, font, ease} = kit;
	const W = box.width, H = box.height;
	const rows = 6, head = H * 0.16, rh = (H - head) / rows, every = Number(kit.props.every ?? 18), seed = Number(kit.props.seed ?? 3);
	const title = String(kit.props.title ?? 'DATABASE');
	const active = Math.min(rows - 1, Math.floor(Math.max(0, f - 10) / every));
	const typed = (r: number) => {
		const len = 7 + Math.floor(rnd(seed + r) * 3);
		const k = r < active ? len : r === active ? Math.floor(span(f, 10 + r * every, 10 + r * every + every * 0.7) * len) : 0;
		let s = '';
		// rows already typed are masked: the scene shows the act of typing, never a value that could read as real data
		for (let i = 0; i < k; i++) s += r < active ? '\u2022' : '#';
		return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	};
	const inn = ease('draw', 0, 14);
	return (
		<div style={{position: 'absolute', ...box, background: role('surface'), borderRadius: 28, border: `3px solid ${role('primary')}`, overflow: 'hidden', opacity: inn, transform: `translateY(${(1 - inn) * 40}px)`}}>
			<div style={{height: head, display: 'flex', alignItems: 'center', gap: 18, padding: '0 36px', borderBottom: `3px solid ${role('ink')}`}}>
				{[0, 1, 2].map((i) => <div key={i} style={{width: 18, height: 18, borderRadius: 9, background: i === 0 ? role('highlight') : role('ink'), opacity: i === 0 ? 1 : 0.4}} />)}
				<span style={{...font('mono', 40), color: role('ink'), marginLeft: 12}}>{title}</span>
			</div>
			{Array.from({length: rows}).map((_, r) => {
				const on = r === active;
				const shown = span(f, 4 + r * 4, 14 + r * 4);
				return (
					<div key={r} style={{position: 'absolute', left: 0, right: 0, top: head + r * rh, height: rh, display: 'flex', alignItems: 'center', padding: '0 36px', gap: 28, opacity: shown, background: on ? role('bg') : undefined, borderBottom: `2px solid ${role('ink')}22`}}>
						<div style={{width: W * 0.08, height: 14, borderRadius: 7, background: role('ink'), opacity: 0.35}} />
						<div style={{width: W * (0.22 + rnd(seed + r * 7) * 0.12), height: 14, borderRadius: 7, background: role('ink'), opacity: 0.35}} />
						<span style={{...font('mono', 46), color: on ? role('primary') : role('ink'), marginLeft: 'auto', textAlign: 'right', minWidth: W * 0.36}}>
							{typed(r)}
							{on && Math.floor(f / 8) % 2 === 0 ? <span style={{display: 'inline-block', width: 22, height: 46, marginLeft: 6, verticalAlign: 'middle', background: role('primary')}} /> : null}
						</span>
					</div>
				);
			})}
		</div>
	);
};
