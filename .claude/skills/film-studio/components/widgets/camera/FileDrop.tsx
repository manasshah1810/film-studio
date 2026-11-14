import React from 'react';
import {interpolate} from 'remotion';
import {boxPx, boxStyle, enterP, moveP, popP, txt} from '../social/tokens';
import {drawP, fmt, lab} from '../data/tokens';
import {Card, Label, numCss} from './parts';
import {mix, type CameraBase} from './tokens';

/**
 * 39 FileDrop. A cursor drags a file (a page with a folded corner and an extension badge) along an arc into a dashed
 * drop zone; the zone border lights while the file hovers, the file lands on the style's spring, a progress bar fills
 * with a tabular percent and size readout, and a check draws on when it is done.
 */
export type FileDropProps = CameraBase & {label: string; file: string; ext: string; sizeMB: number; zoneText?: string; dragAt?: number; dropAt?: number; upFrames?: number; seed: string};
export const FILE_DROP = {frames: 100, hero: 94, sfx: [{at: 'dragAt', id: 'click-soft'}, {at: 'dropAt', id: 'tactile-pop'}, {at: 'dropAt + 6', id: 'digital-tick'}, {at: 'done', id: 'notification-ping'}]};

export const FileDrop: React.FC<FileDropProps> = ({tk, frame: f, box, label, file, ext, sizeMB, zoneText = 'DROP FOOTAGE HERE', dragAt = 8, dropAt = 40, upFrames = 40}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 52;
	const head = pad + lab(tk, 0.82) * 1.4 + 24;
	const foot = 20 + tk.size.h2 * 1.2 + lab(tk, 0.82) * 1.4 + 70;
	const zw = W - pad * 2, zh = H - head - foot - pad;
	const fw = Math.min(230, zw * 0.3), fh = fw * 1.28;
	const m = moveP(tk, f, dragAt, dropAt - dragAt);
	const p0 = {x: zw * 0.8, y: zh * 0.22}, p1 = {x: zw / 2, y: zh * 0.5};
	const px = p0.x + (p1.x - p0.x) * m, py = p0.y + (p1.y - p0.y) * m - Math.sin(m * Math.PI) * zh * 0.12;
	const hover = m > 0.55;
	const land = popP(tk, f, dropAt);
	const dropped = f >= dropAt;
	const sq = dropped ? 0.9 + 0.1 * land : 1;
	const tilt = -10 * (1 - m);
	const up = interpolate(f, [dropAt + 6, dropAt + 6 + upFrames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const done = up >= 1;
	const tick = drawP(tk, f, dropAt + 8 + upFrames, 12);
	const lit = hover || dropped;
	const fold = fw * 0.26;
	const dash = `${tk.stroke.line * 3} ${tk.stroke.line * 2.4}`;
	const cursor = !dropped || f < dropAt + 10;
	const cs = 54;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={tk.accent}>{done ? 'READY' : dropped ? 'UPLOADING' : hover ? 'RELEASE' : 'DRAG'}</Label>
				</div>
				<div style={{position: 'absolute', left: pad, top: head, width: zw, height: zh}}>
					<svg width={zw} height={zh} style={{position: 'absolute', left: 0, top: 0}}>
						<rect x={tk.stroke.line} y={tk.stroke.line} width={zw - tk.stroke.line * 2} height={zh - tk.stroke.line * 2} rx={Math.max(tk.plateR, 12)} fill={lit ? mix(tk.c.surface, tk.series[0], 0.08) : tk.well} stroke={lit ? tk.series[0] : tk.grid} strokeWidth={tk.stroke.line} strokeDasharray={dash} />
						<path d={`M${zw / 2},${zh * 0.7} v${zh * 0.1} M${zw / 2 - 22},${zh * 0.78} l22,22 l22,-22`} fill="none" stroke={lit ? tk.series[0] : tk.grid} strokeWidth={tk.stroke.line} strokeLinecap="round" strokeLinejoin="round" opacity={dropped ? 0 : 1} />
					</svg>
					<div style={{position: 'absolute', left: 0, right: 0, top: zh * 0.86, textAlign: 'center', opacity: dropped ? 0 : 1}}>
						<Label tk={tk} color={lit ? tk.accent : tk.label}>{zoneText}</Label>
					</div>
					<div style={{position: 'absolute', left: px - fw / 2, top: py - fh / 2, width: fw, height: fh, transform: `rotate(${tilt}deg) scale(${1 / sq}, ${sq})`, transformOrigin: '50% 100%'}}>
						<svg width={fw} height={fh} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
							<path d={`M0,${Math.min(16, tk.plateR)} V${fh} H${fw} V${fold} L${fw - fold},0 H${Math.min(16, tk.plateR)} Z`} fill={mix(tk.c.surface, tk.c.ink, 0.1)} stroke={tk.grid} strokeWidth={tk.stroke.hair} />
							<path d={`M${fw - fold},0 V${fold} H${fw}`} fill={mix(tk.c.surface, tk.c.ink, 0.2)} stroke={tk.grid} strokeWidth={tk.stroke.hair} />
							{[0.5, 0.6, 0.7].map((y, i) => (
								<rect key={i} x={fw * 0.16} y={fh * y} width={fw * (i === 2 ? 0.44 : 0.68)} height={Math.max(4, tk.stroke.hair * 2)} fill={tk.grid} />
							))}
						</svg>
						<div style={{position: 'absolute', left: fw * 0.12, top: fh * 0.18, padding: '6px 14px', background: tk.series[0], borderRadius: Math.min(tk.plateR, 10)}}>
							<span style={{...txt(tk, 'mono', Math.max(lab(tk, 0.72), fw * 0.14), tk.onSeries), textTransform: 'uppercase', letterSpacing: '0.04em'}}>{ext}</span>
						</div>
						{done && (
							<svg width={fw} height={fh} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
								<circle cx={fw} cy={fh} r={fw * 0.2} fill={tk.series[0]} style={{filter: tk.glow(tk.series[0])}} />
								<path d={`M${fw - fw * 0.09},${fh} l${fw * 0.06},${fw * 0.06} l${fw * 0.11},${-fw * 0.12}`} fill="none" stroke={tk.onSeries} strokeWidth={tk.stroke.line} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tick} />
							</svg>
						)}
					</div>
					{cursor && (
						<svg width={cs} height={cs} style={{position: 'absolute', left: px + fw * 0.28, top: py + fh * 0.22, overflow: 'visible', opacity: dropped ? 1 - (f - dropAt) / 10 : 1}}>
							<path d={`M0,0 L0,${cs} L${cs * 0.28},${cs * 0.74} L${cs * 0.5},${cs * 1.1} L${cs * 0.64},${cs * 1.02} L${cs * 0.44},${cs * 0.68} L${cs * 0.8},${cs * 0.66} Z`} fill={tk.text} stroke={tk.c.surface} strokeWidth={4} strokeLinejoin="round" />
						</svg>
					)}
				</div>
				<div style={{position: 'absolute', left: pad, right: pad, top: head + zh + 30, display: 'flex', flexDirection: 'column', gap: 18}}>
					<div style={{height: Math.max(12, tk.stroke.line * 2), background: tk.well, borderRadius: 99, overflow: 'hidden', border: `${tk.stroke.hair}px solid ${tk.grid}`}}>
						<div style={{width: `${up * 100}%`, height: '100%', background: tk.series[0], borderRadius: 99}} />
					</div>
					<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24}}>
						<div style={{display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0}}>
							<Label tk={tk}>{`${fmt(sizeMB * up, 1)} / ${fmt(sizeMB, 1)} MB`}</Label>
							<span style={txt(tk, 'body', tk.size.body, tk.text)}>{file}</span>
						</div>
						<span style={numCss(tk, tk.size.h2, tk.accent)}>{`${Math.round(up * 100)}%`}</span>
					</div>
				</div>
			</Card>
		</div>
	);
};
