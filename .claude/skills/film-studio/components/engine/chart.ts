import type {ChartSpec, Zone} from './types';

const nice = (v: number) => {
	const p = Math.pow(10, Math.floor(Math.log10(v || 1)));
	const n = v / p;
	return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
};
/** Chart geometry in zone pixels. Kits only decide how the marks are drawn. `pad` = [top,right,bottom,left] as fractions. */
export const chartGeo = (c: ChartSpec, zone: Zone, pad: [number, number, number, number] = [0.08, 0.06, 0.14, 0.04]) => {
	const plot = {x: zone.w * pad[3], y: zone.h * pad[0], w: zone.w * (1 - pad[1] - pad[3]), h: zone.h * (1 - pad[0] - pad[2])};
	const ymax = c.max ?? nice(Math.max(...c.series.flatMap((s) => s.values)) * 1.05);
	const n = c.x.length;
	const y = (v: number) => plot.y + plot.h * (1 - v / ymax);
	const band = plot.w / n;
	const xs = c.type === 'bar' ? c.x.map((_, i) => plot.x + band * (i + 0.5)) : c.x.map((_, i) => plot.x + (n === 1 ? plot.w / 2 : (plot.w * i) / (n - 1)));
	const lines = c.series.map((s) => s.values.map((v, i) => [xs[i], y(v)]));
	const k = c.series.length;
	const bw = (band * 0.68) / k;
	const bars = c.series.flatMap((s, si) => s.values.map((v, i) => ({x: xs[i] - (bw * k) / 2 + si * bw, y: y(v), w: bw * 0.94, h: plot.y + plot.h - y(v), si, i, v})));
	const ticks = [0, 0.5, 1].map((t) => ({v: ymax * t, y: y(ymax * t)}));
	return {plot, ymax, y, xs, lines, bars, ticks, base: plot.y + plot.h};
};
export const fmt = (v: number, unit = '') => `${Math.round(v * 10) / 10}${unit}`;
