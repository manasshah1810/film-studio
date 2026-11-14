import React from 'react';
import {boxPx, boxStyle, enterP} from '../social/tokens';
import {rgba} from '../../engine/tokens';
import {Card, Label, Plate, Scene, Viewport, frameOf} from './parts';
import {springAt, type KineticBase} from './tokens';
import type {LayerId} from '../camera/parts';

/**
 * 44 LayerExplode. The shot is five planes (sky, ridge, town, subject, foreground). On the style's explode spring
 * the stack tilts into an oblique view and the planes slide apart by `explodeGap` px each, so the viewer sees how
 * the picture is built. Each plane gets a hairline sheet edge and an opaque name plate on a leader line. It holds,
 * then closes back into the flat shot. Every plane is one affine matrix, so the plates anchor exactly to its edge.
 */
export type LayerExplodeProps = KineticBase & {label: string; names?: string[]; explodeAt?: number; hold?: number; seed: string};
export const LAYER_EXPLODE = {frames: 96, hero: 48, sfx: [{at: 'explodeAt', id: 'card-flick'}, {at: 'explodeAt + 26 + hold', id: 'click-soft'}]};

const ORDER: LayerId[] = ['sky', 'far', 'mid', 'subject', 'near'];

export const LayerExplode: React.FC<LayerExplodeProps> = ({tk, frame: f, box, label, names = ['Sky · Z0', 'Ridge', 'Town · Z1', 'Courier · Z2', 'Edge · Z3'], explodeAt = 10, hold = 20, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const {pad, head} = frameOf(tk);
	const vw = W - pad * 2, vh = H - head - pad;
	const closeAt = explodeAt + 26 + hold;
	const e = Math.max(0, springAt(tk.explode, f, explodeAt) - springAt(tk.explode, f, closeAt));
	const cx = vw / 2, cy = vh / 2;
	const k = 1 - 0.5 * e, sy = 1 - 0.56 * e, sh = -Math.tan((24 * Math.PI) / 180) * e;
	const shiftX = -vw * 0.1 * e;
	const gap = tk.explodeGap * e;
	const mat = (i: number) => {
		const ty = (2 - i) * gap;
		const a = k, c = k * sh, d = k * sy;
		return {a, c, d, ex: cx + shiftX - a * cx - c * cy, fy: cy + ty - d * cy};
	};
	const at = (m: ReturnType<typeof mat>, x: number, y: number) => [m.a * x + m.c * y + m.ex, m.d * y + m.fy];
	const shown = e > 0.35;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={shown ? tk.accent : tk.label}>{shown ? `${ORDER.length} PLANES` : 'FLAT SHOT'}</Label>
				</div>
				<Viewport tk={tk} x={pad} y={head} w={vw} h={vh} style={{background: tk.c.surface}}>
					{ORDER.map((id, i) => {
						const m = mat(i);
						return (
							<div key={id} style={{position: 'absolute', left: 0, top: 0, width: vw, height: vh, overflow: 'hidden', transformOrigin: '0 0', transform: `matrix(${m.a.toFixed(5)}, 0, ${m.c.toFixed(5)}, ${m.d.toFixed(5)}, ${m.ex.toFixed(2)}, ${m.fy.toFixed(2)})`}}>
								{i > 0 && <div style={{position: 'absolute', inset: 0, background: rgba(tk.c.surface, 0.18 * e)}} />}
								<Scene tk={tk} w={vw} h={vh} seed={seed} hide={ORDER.filter((o) => o !== id)} />
								<div style={{position: 'absolute', inset: 0, boxShadow: `inset 0 0 0 ${Math.max(3, tk.stroke.line) / Math.max(0.3, k)}px ${tk.series[0]}`, opacity: e}} />
							</div>
						);
					})}
					{shown &&
						ORDER.map((id, i) => {
							const m = mat(i);
							const [x, y] = at(m, vw, vh * 0.5);
							const o = Math.min(1, (e - 0.35) / 0.4);
							const lx = Math.min(x + 40, vw - 16);
							return (
								<React.Fragment key={`p${id}`}>
									<svg width={vw} height={vh} style={{position: 'absolute', left: 0, top: 0, opacity: o, overflow: 'visible'}}>
										<line x1={x} y1={y} x2={lx} y2={y} stroke={tk.series[0]} strokeWidth={tk.stroke.hair + 1} />
										<circle cx={x} cy={y} r={tk.stroke.line + 2} fill={tk.series[0]} />
									</svg>
									<div style={{position: 'absolute', right: 16, top: y, transform: 'translateY(-50%)', opacity: o}}>
										<Plate tk={tk}>{names[i] ?? id}</Plate>
									</div>
								</React.Fragment>
							);
						})}
				</Viewport>
			</Card>
		</div>
	);
};
