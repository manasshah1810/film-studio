import {lerp, reg} from './core';

// Camera: moves the whole finished panel. Amounts are small on purpose; the over-scale hides edges.
reg('push-in', (a) => ({style: {transform: `scale(${1 + a.n('amount', 0.06) * a.e})`}}));
reg('pull-out', (a) => ({style: {transform: `scale(${1 + a.n('amount', 0.06) * (1 - a.e)})`}}));
reg('punch-in', (a) => ({style: {transform: `scale(${1 + a.n('amount', 0.12) * a.o})`, transformOrigin: `${a.n('x', 50)}% ${a.n('y', 45)}%`}}));
reg('snap-zoom', (a) => ({style: {transform: `scale(${1 + a.n('amount', 0.1) * a.bell})`, transformOrigin: `${a.n('x', 50)}% ${a.n('y', 45)}%`}}));
reg('crash-zoom', (a) => ({style: {transform: `scale(${1 + a.n('amount', 0.4) * (1 - a.o)})`, filter: a.k < 1 ? `blur(${(1 - a.o) * a.u * 0.6}px)` : undefined}}));
reg('pan-left', (a) => ({style: {transform: `scale(1.08) translateX(${lerp(a.n('amount', 3), -a.n('amount', 3), a.e)}%)`}}));
reg('pan-right', (a) => ({style: {transform: `scale(1.08) translateX(${lerp(-a.n('amount', 3), a.n('amount', 3), a.e)}%)`}}));
reg('tilt-up', (a) => ({style: {transform: `scale(1.08) translateY(${lerp(-a.n('amount', 3), a.n('amount', 3), a.e)}%)`}}));
reg('tilt-down', (a) => ({style: {transform: `scale(1.08) translateY(${lerp(a.n('amount', 3), -a.n('amount', 3), a.e)}%)`}}));
reg('slow-drift', (a) => ({style: {transform: `scale(1.06) translate(${lerp(-1.5, 1.5, a.k) * a.n('amount', 1)}%, ${lerp(1, -1, a.k) * a.n('amount', 1)}%)`}}));
reg('camera-shake', (a) => {
	if (!a.on) return {};
	const m = a.u * a.n('amount', 0.8) * (1 - a.k);
	return {style: {transform: `translate(${(a.r('x' + a.lt) - 0.5) * 2 * m}px, ${(a.r('y' + a.lt) - 0.5) * 2 * m}px) scale(1.03)`}};
});
reg('handheld-drift', (a) => {
	const m = a.u * a.n('amount', 0.35);
	return {style: {transform: `scale(1.04) translate(${Math.sin(a.t / 17) * m}px, ${Math.cos(a.t / 23) * m}px) rotate(${Math.sin(a.t / 31) * 0.25}deg)`}};
});
reg('dutch-tilt', (a) => ({style: {transform: `scale(${1 + 0.12 * a.e}) rotate(${a.n('deg', 4) * a.e}deg)`}}));
reg('orbit-sway', (a) => ({style: {transform: `scale(1.05) rotate(${Math.sin((a.t / Math.max(1, a.panelDur)) * Math.PI * 2) * a.n('deg', 1.2)}deg)`}}));
reg('rack-focus', (a) => ({style: {filter: a.k < 1 ? `blur(${(1 - a.e) * a.n('px', 12)}px)` : undefined}}));
reg('defocus-out', (a) => ({style: {filter: a.k > 0 ? `blur(${a.e * a.n('px', 12)}px)` : undefined}}));
