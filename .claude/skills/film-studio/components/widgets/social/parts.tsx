import React from 'react';
import {accentFill, initials, txt, type SocialTokens} from './tokens';

/** Generic glyphs on a 24 unit grid. No platform logos: these are neutral social icons. */
const GLYPH = {
	heart: 'M12 21 C5 15.5 2 12.3 2 8.6 C2 5.6 4.4 3.3 7.3 3.3 C9.2 3.3 10.9 4.3 12 5.9 C13.1 4.3 14.8 3.3 16.7 3.3 C19.6 3.3 22 5.6 22 8.6 C22 12.3 19 15.5 12 21 Z',
	comment: 'M4 4.5 H20 Q21.5 4.5 21.5 6 V15 Q21.5 16.5 20 16.5 H10 L5.5 20.5 V16.5 H4 Q2.5 16.5 2.5 15 V6 Q2.5 4.5 4 4.5 Z',
	share: 'M3 11.5 L21 3.5 L14.5 21 L11.5 13.5 Z M11.5 13.5 L21 3.5',
	play: 'M7 4.5 L20 12 L7 19.5 Z',
	pause: 'M6.5 4.5 H10 V19.5 H6.5 Z M14 4.5 H17.5 V19.5 H14 Z',
	send: 'M12 20 V5 M5.5 11 L12 4.5 L18.5 11',
	check: 'M4.5 12.5 L9.5 17.5 L19.5 6.5',
	spark: 'M12 2 C12.8 8 16 11.2 22 12 C16 12.8 12.8 16 12 22 C11.2 16 8 12.8 2 12 C8 11.2 11.2 8 12 2 Z',
	minus: 'M6 12 H18',
	down: 'M12 4 V19 M5.5 13 L12 19.5 L18.5 13',
} as const;
export type GlyphId = keyof typeof GLYPH;
const STROKED = new Set<GlyphId>(['share', 'send', 'check', 'minus', 'down']);

export const Glyph: React.FC<{id: GlyphId; size: number; color: string; fill?: boolean; style?: React.CSSProperties}> = ({id, size, color, fill, style}) => {
	const stroked = STROKED.has(id) && !fill;
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', overflow: 'visible', ...style}}>
			<path d={GLYPH[id]} fill={stroked || fill === false ? 'none' : color} stroke={color} strokeWidth={stroked ? 2.6 : fill === false ? 2 : 0} strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
};

/** Initials avatar: a circle in primary or highlight (seeded by the name) with the best-contrast text role. */
export const Avatar: React.FC<{tk: SocialTokens; name: string; size: number; style?: React.CSSProperties}> = ({tk, name, size, style}) => {
	const fill = accentFill(name);
	return (
		<div
			style={{
				width: size,
				height: size,
				flex: 'none',
				borderRadius: size / 2,
				background: tk.c[fill],
				border: tk.border.w ? `${Math.max(2, tk.border.w * 0.7)}px solid ${tk.border.color}` : 'none',
				boxSizing: 'border-box',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				...style,
			}}
		>
			<span style={{...txt(tk, 'display', size * 0.34, tk.on(fill).hex), lineHeight: 1, overflow: 'visible'}}>{initials(name)}</span>
		</div>
	);
};

/** The pointer: ink arrow with a surface keyline so it reads on any fill. */
export const Cursor: React.FC<{tk: SocialTokens; x: number; y: number; scale?: number}> = ({tk, x, y, scale = 1}) => (
	<svg width={72} height={84} viewBox="0 0 24 28" style={{position: 'absolute', left: x - 6, top: y - 3, transform: `scale(${scale})`, transformOrigin: '6px 3px', overflow: 'visible'}}>
		<path d="M2 1 L2 21 L7.2 16.4 L10.6 24.6 L14 23.2 L10.6 15.2 L17.6 15.2 Z" fill={tk.c.ink} stroke={tk.c.surface} strokeWidth={1.6} strokeLinejoin="round" />
	</svg>
);
