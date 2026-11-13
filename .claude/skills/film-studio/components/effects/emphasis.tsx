import React from 'react';
import {Rays, SpeedLines} from '../engine/fx';
import type {A} from './core';
import {fill, reg} from './core';

// Emphasis: particles drawn over the panel and short pulses of the whole panel.
reg('speed-lines', (a) => ({over: a.on ? <div style={{...fill, opacity: a.bell}}><SpeedLines cx={(a.W * a.n('x', 50)) / 100} cy={(a.H * a.n('y', 45)) / 100} color={a.c(a.s('role', 'ink'), 'ink')} seed={(i) => a.r('sl' + i)} opacity={a.n('amount', 0.3)} /></div> : null}));
reg('radial-rays', (a) => ({under: undefined, over: <div style={{...fill, opacity: a.e * a.n('amount', 0.16), mixBlendMode: 'soft-light'}}><Rays cx={(a.W * a.n('x', 50)) / 100} cy={(a.H * a.n('y', 45)) / 100} color={a.c(a.s('role', 'highlight'))} n={a.n('count', 14)} rot={a.t * 0.08} /></div>}));

const ROLE_CYCLE = ['primary', 'secondary', 'highlight'];
const burst = (a: A, count: number, draw: (i: number, x: number, y: number, k: number, col: string) => React.ReactNode) => {
	if (!a.on) return null;
	const cx = (a.W * a.n('x', 50)) / 100, cy = (a.H * a.n('y', 45)) / 100, reach = Math.min(a.W, a.H) * a.n('reach', 0.45);
	return (
		<div style={fill}>
			{Array.from({length: count}, (_, i) => {
				const ang = a.r('a' + i) * Math.PI * 2, sp = 0.4 + a.r('v' + i) * 0.6;
				const d = reach * sp * (1 - Math.pow(1 - a.k, 2.2));
				return draw(i, cx + Math.cos(ang) * d, cy + Math.sin(ang) * d + reach * 0.5 * a.k * a.k, a.k, a.c(ROLE_CYCLE[i % 3], 'primary'));
			})}
		</div>
	);
};
reg('confetti-burst', (a) => ({over: burst(a, a.n('count', 36), (i, x, y, k, col) => <div key={i} style={{position: 'absolute', left: x, top: y, width: a.u * 1.1, height: a.u * 0.6, background: col, transform: `rotate(${a.r('r' + i) * 360 + k * 540}deg)`, opacity: 1 - k * k}} />)}));
reg('spark-burst', (a) => ({over: burst(a, a.n('count', 18), (i, x, y, k) => <div key={i} style={{position: 'absolute', left: x, top: y, width: a.u * 0.5 * (1 - k), height: a.u * 0.5 * (1 - k), borderRadius: '50%', background: a.c(a.s('role', 'highlight')), boxShadow: `0 0 ${a.u}px ${a.c(a.s('role', 'highlight'))}`}} />)}));

const fall = (id: string, count: number, shape: (a: A, i: number) => React.CSSProperties, dir: 1 | -1, speed: number, sway: number) =>
	reg(id, (a) => ({
		over: (
			<div style={{...fill, opacity: a.e * a.n('amount', 0.6)}}>
				{Array.from({length: a.n('count', count)}, (_, i) => {
					const v = speed * (0.6 + a.r('v' + i) * 0.8);
					const y0 = a.r('y' + i) * 120;
					const y = (((y0 + dir * a.t * v) % 120) + 120) % 120 - 10;
					return <div key={i} style={{position: 'absolute', left: `${a.r('x' + i) * 100 + Math.sin(a.t / 20 + i) * sway}%`, top: `${y}%`, ...shape(a, i)}} />;
				})}
			</div>
		),
	}));
fall('rain', 46, (a) => ({width: Math.max(1, a.u * 0.12), height: a.u * 3.2, background: a.c(a.s('role', 'ink'), 'ink'), transform: 'rotate(8deg)'}), 1, 3.2, 0);
fall('snow', 40, (a, i) => ({width: a.u * (0.4 + a.r('s' + i) * 0.6), height: a.u * (0.4 + a.r('s' + i) * 0.6), borderRadius: '50%', background: a.c(a.s('role', 'ink'), 'ink')}), 1, 0.5, 1.5);
fall('floating-dust', 24, (a, i) => ({width: a.u * (0.3 + a.r('s' + i) * 1.4), height: a.u * (0.3 + a.r('s' + i) * 1.4), borderRadius: '50%', background: a.c(a.s('role', 'highlight')), filter: `blur(${a.u * 0.15}px)`, opacity: 0.3 + a.r('o' + i) * 0.5}), -1, 0.12, 2);
fall('embers', 22, (a, i) => ({width: a.u * 0.35, height: a.u * 0.35, borderRadius: '50%', background: a.c(a.s('role', 'primary'), 'primary'), opacity: 0.4 + a.r('o' + i) * 0.6}), -1, 0.6, 2.5);

reg('progress-bar', (a) => {
	const h = Math.max(2, a.u * a.n('height', 0.6));
	return {over: <div style={{...fill, top: 'auto', height: h, background: a.c(a.s('role', 'primary'), 'primary'), width: `${Math.min(1, a.t / Math.max(1, a.panelDur - 1)) * 100}%`, right: 'auto'}} />};
});
reg('heartbeat-pulse', (a) => {
	if (!a.on) return {};
	const b = Math.max(0, Math.sin(a.k * Math.PI * 4)) * (a.k % 0.5 < 0.25 ? 1 : 0.6);
	return {style: {transform: `scale(${1 + a.n('amount', 0.03) * b})`}};
});
reg('beat-pulse', (a) => {
	const every = Math.max(4, a.n('every', 15)), ph = (a.t % every) / every;
	return {style: {transform: `scale(${1 + a.n('amount', 0.02) * Math.pow(1 - ph, 3)})`}};
});
reg('bounce-settle', (a) => ({style: a.on ? {transform: `scale(${1 + a.n('amount', 0.06) * Math.sin(a.k * Math.PI * 3) * (1 - a.k)})`} : undefined}));
reg('impact-squash', (a) => {
	if (!a.on) return {};
	const s = a.n('amount', 0.06) * Math.sin(a.k * Math.PI * 2) * (1 - a.k);
	return {style: {transform: `scale(${1 + s}, ${1 - s})`, transformOrigin: '50% 100%'}};
});
reg('slow-breathe', (a) => ({style: {transform: `scale(${1.01 + Math.sin(a.t / 30) * a.n('amount', 0.008)})`}}));
reg('wobble', (a) => ({style: a.on ? {transform: `rotate(${Math.sin(a.k * Math.PI * 5) * a.n('deg', 1.5) * (1 - a.k)}deg) scale(1.03)`} : undefined}));
