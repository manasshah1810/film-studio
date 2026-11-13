import React from 'react';
import type {CSSProperties, ReactNode} from 'react';
import {
	AbsoluteFill,
	Sequence,
	interpolate,
	interpolateColors,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

// 1080x1920, 30fps, 1350 frames (45s)
export const NOKIA_BASELINE_DURATION = 1350;

const C = {
	navy: '#060B1F',
	navy2: '#0D1A45',
	blue: '#2F6BFF',
	sky: '#7FB0FF',
	white: '#FFFFFF',
	dim: 'rgba(255,255,255,0.62)',
	red: '#FF4D4D',
	amber: '#FFB547',
	green: '#3DDC84',
	card: 'rgba(255,255,255,0.07)',
	line: 'rgba(255,255,255,0.16)',
};

const FONT =
	'"Helvetica Neue", Helvetica, "Segoe UI", Roboto, Arial, sans-serif';

const CLAMP = {
	extrapolateLeft: 'clamp',
	extrapolateRight: 'clamp',
} as const;

const SCENES = {
	hook: {from: 0, dur: 150},
	peak: {from: 150, dur: 195},
	shift: {from: 345, dur: 180},
	r1: {from: 525, dur: 180},
	r2: {from: 705, dur: 180},
	r3: {from: 885, dur: 180},
	fall: {from: 1065, dur: 180},
	lesson: {from: 1245, dur: 105},
};

// ---------- helpers ----------

const useSpring = (delay = 0, damping = 200) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: frame - delay, fps, config: {damping}});
};

const Scene: React.FC<{dur: number; hold?: boolean; children: ReactNode}> = ({
	dur,
	hold,
	children,
}) => {
	const frame = useCurrentFrame();
	const fadeIn = interpolate(frame, [0, 8], [0, 1], CLAMP);
	const fadeOut = hold
		? 1
		: interpolate(frame, [dur - 8, dur], [1, 0], CLAMP);
	return (
		<AbsoluteFill
			style={{opacity: Math.min(fadeIn, fadeOut), fontFamily: FONT}}
		>
			{children}
		</AbsoluteFill>
	);
};

const Words: React.FC<{
	text: string;
	delay?: number;
	stagger?: number;
	style?: CSSProperties;
	highlight?: string[];
	highlightColor?: string;
}> = ({text, delay = 0, stagger = 4, style, highlight = [], highlightColor}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<div
			style={{
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'center',
				color: C.white,
				fontWeight: 800,
				lineHeight: 1.08,
				letterSpacing: -1.5,
				...style,
			}}
		>
			{text.split(' ').map((w, i) => {
				const s = spring({
					frame: frame - delay - i * stagger,
					fps,
					config: {damping: 200},
				});
				const clean = w.replace(/[.,:]/g, '');
				return (
					<span
						key={i}
						style={{
							display: 'inline-block',
							marginRight: '0.26em',
							opacity: s,
							transform: `translateY(${(1 - s) * 46}px)`,
							color: highlight.includes(clean)
								? highlightColor ?? C.sky
								: undefined,
						}}
					>
						{w}
					</span>
				);
			})}
		</div>
	);
};

const Kicker: React.FC<{children: ReactNode; delay?: number; color?: string}> = ({
	children,
	delay = 0,
	color = C.sky,
}) => {
	const s = useSpring(delay);
	return (
		<div
			style={{
				fontSize: 38,
				fontWeight: 700,
				letterSpacing: 8,
				textTransform: 'uppercase',
				color,
				opacity: s,
				transform: `translateY(${(1 - s) * 20}px)`,
				textAlign: 'center',
			}}
		>
			{children}
		</div>
	);
};

const Caption: React.FC<{children: ReactNode; delay?: number; top?: number}> = ({
	children,
	delay = 0,
	top = 1330,
}) => {
	const s = useSpring(delay);
	return (
		<div
			style={{
				position: 'absolute',
				top,
				left: 80,
				right: 80,
				textAlign: 'center',
				fontSize: 56,
				fontWeight: 700,
				lineHeight: 1.2,
				color: C.white,
				opacity: s,
				transform: `translateY(${(1 - s) * 30}px)`,
			}}
		>
			{children}
		</div>
	);
};

// ---------- drawn phones ----------

const BrickPhone: React.FC<{scale?: number; snake?: boolean}> = ({
	scale = 1,
	snake = true,
}) => {
	const frame = useCurrentFrame();
	const screenW = 216;
	return (
		<div
			style={{
				width: 300,
				height: 620,
				borderRadius: '70px 70px 90px 90px',
				background: 'linear-gradient(160deg, #2B3F7A 0%, #131E45 100%)',
				border: '4px solid rgba(255,255,255,0.18)',
				boxShadow: '0 40px 90px rgba(0,0,0,0.55)',
				transform: `scale(${scale})`,
				position: 'relative',
				flexShrink: 0,
			}}
		>
			<div
				style={{
					position: 'absolute',
					top: 34,
					left: 110,
					width: 80,
					height: 10,
					borderRadius: 5,
					background: 'rgba(0,0,0,0.45)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 70,
					left: 42,
					width: screenW,
					height: 170,
					borderRadius: 14,
					background: '#A9C77B',
					overflow: 'hidden',
					boxShadow: 'inset 0 0 18px rgba(0,0,0,0.35)',
				}}
			>
				{snake
					? [0, 1, 2, 3, 4, 5].map((i) => {
							const x = (((frame * 3 - i * 20) % (screenW + 40)) + screenW + 40) %
								(screenW + 40);
							return (
								<div
									key={i}
									style={{
										position: 'absolute',
										left: x - 20,
										top: 80,
										width: 16,
										height: 16,
										background: '#24331A',
									}}
								/>
							);
					  })
					: null}
				<div
					style={{
						position: 'absolute',
						left: 150,
						top: 36,
						width: 12,
						height: 12,
						background: '#24331A',
						opacity: snake ? 1 : 0,
					}}
				/>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 262,
					left: 100,
					width: 100,
					height: 44,
					borderRadius: 22,
					background: 'rgba(255,255,255,0.2)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 330,
					left: 42,
					width: 216,
					display: 'flex',
					flexWrap: 'wrap',
					gap: 12,
				}}
			>
				{new Array(12).fill(0).map((_, i) => (
					<div
						key={i}
						style={{
							width: 64,
							height: 46,
							borderRadius: 16,
							background: 'rgba(255,255,255,0.16)',
							border: '2px solid rgba(255,255,255,0.1)',
						}}
					/>
				))}
			</div>
		</div>
	);
};

const TouchPhone: React.FC = () => {
	const frame = useCurrentFrame();
	const ripple = (frame % 45) / 45;
	return (
		<div
			style={{
				width: 330,
				height: 660,
				borderRadius: 54,
				background: '#05070F',
				border: '5px solid rgba(255,255,255,0.35)',
				boxShadow: `0 0 120px ${C.blue}AA, 0 40px 90px rgba(0,0,0,0.6)`,
				position: 'relative',
				flexShrink: 0,
			}}
		>
			<div
				style={{
					position: 'absolute',
					inset: 14,
					borderRadius: 42,
					background: `linear-gradient(165deg, ${C.blue} 0%, #7A3CFF 100%)`,
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						display: 'flex',
						flexWrap: 'wrap',
						gap: 20,
						padding: '60px 26px',
					}}
				>
					{new Array(12).fill(0).map((_, i) => (
						<div
							key={i}
							style={{
								width: 66,
								height: 66,
								borderRadius: 18,
								background: `rgba(255,255,255,${0.28 + (i % 3) * 0.14})`,
							}}
						/>
					))}
				</div>
				<div
					style={{
						position: 'absolute',
						left: 151 - 70,
						top: 420,
						width: 140,
						height: 140,
						borderRadius: 70,
						border: '5px solid rgba(255,255,255,0.9)',
						opacity: 1 - ripple,
						transform: `scale(${0.3 + ripple})`,
					}}
				/>
			</div>
		</div>
	);
};

// ---------- scenes ----------

const Hook: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const phoneIn = spring({frame: frame - 4, fps, config: {damping: 14}});
	const drop = spring({frame: frame - 82, fps, config: {damping: 200}});
	const punch = spring({frame: frame - 84, fps, config: {damping: 11}});
	return (
		<Scene dur={SCENES.hook.dur}>
			<div style={{position: 'absolute', top: 290, left: 70, right: 70}}>
				<Words
					text="Nokia had HALF the smartphone market."
					delay={6}
					highlight={['HALF']}
					style={{fontSize: 112}}
				/>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 800,
					left: 0,
					right: 0,
					display: 'flex',
					justifyContent: 'center',
					opacity: phoneIn * (1 - drop * 0.75),
					transform: `translateY(${(1 - phoneIn) * 200 + drop * 260}px) rotate(${
						drop * 24
					}deg)`,
				}}
			>
				<BrickPhone scale={0.92} />
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1010,
					left: 60,
					right: 60,
					textAlign: 'center',
					fontSize: 124,
					fontWeight: 900,
					letterSpacing: -2,
					lineHeight: 1.05,
					color: C.red,
					opacity: Math.min(1, punch * 1.5),
					transform: `scale(${0.6 + punch * 0.4}) rotate(-4deg)`,
					textShadow: '0 12px 50px rgba(0,0,0,0.8)',
				}}
			>
				6 years later:
				<br />
				gone.
			</div>
		</Scene>
	);
};

const Chip: React.FC<{delay: number; from: 'left' | 'right'; children: ReactNode}> = ({
	delay,
	from,
	children,
}) => {
	const s = useSpring(delay, 16);
	const dir = from === 'left' ? -1 : 1;
	return (
		<div
			style={{
				padding: '26px 40px',
				borderRadius: 28,
				background: C.card,
				border: `2px solid ${C.line}`,
				color: C.white,
				fontSize: 48,
				fontWeight: 700,
				textAlign: 'center',
				opacity: Math.min(1, s),
				transform: `translateX(${(1 - s) * 300 * dir}px)`,
			}}
		>
			{children}
		</div>
	);
};

const Peak: React.FC = () => {
	const frame = useCurrentFrame();
	const count = Math.round(interpolate(frame, [10, 55], [0, 40], CLAMP));
	const numIn = useSpring(6, 14);
	const float = Math.sin(frame / 14) * 10;
	const phoneIn = useSpring(20);
	return (
		<Scene dur={SCENES.peak.dur}>
			<div style={{position: 'absolute', top: 270, left: 0, right: 0}}>
				<Kicker>The peak, 2007</Kicker>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 330,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontSize: 330,
					fontWeight: 900,
					letterSpacing: -10,
					color: C.white,
					transform: `scale(${0.7 + numIn * 0.3})`,
					opacity: Math.min(1, numIn),
					textShadow: `0 0 90px ${C.blue}`,
				}}
			>
				{count}
				<span style={{color: C.sky, fontSize: 210}}>%</span>
			</div>
			<Caption delay={30} top={700}>
				of all phones sold on Earth
			</Caption>
			<div
				style={{
					position: 'absolute',
					top: 830,
					left: 0,
					right: 0,
					display: 'flex',
					justifyContent: 'center',
					opacity: phoneIn,
					transform: `translateY(${(1 - phoneIn) * 120 + float}px)`,
				}}
			>
				<BrickPhone scale={0.72} />
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1330,
					left: 90,
					right: 90,
					display: 'flex',
					flexDirection: 'column',
					gap: 24,
				}}
			>
				<Chip delay={70} from="left">
					<span style={{color: C.sky}}>#1</span> phone maker for 14 years
				</Chip>
				<Chip delay={100} from="right">
					Nokia 1100: <span style={{color: C.sky}}>250M+</span> sold
				</Chip>
			</div>
		</Scene>
	);
};

const Shift: React.FC = () => {
	const touchIn = useSpring(25, 16);
	const dimT = useSpring(40);
	return (
		<Scene dur={SCENES.shift.dur}>
			<div style={{position: 'absolute', top: 270, left: 0, right: 0}}>
				<Kicker>January 2007</Kicker>
			</div>
			<div style={{position: 'absolute', top: 350, left: 70, right: 70}}>
				<Words
					text="A phone with no keys."
					delay={8}
					highlight={['no', 'keys']}
					style={{fontSize: 108}}
				/>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 640,
					left: 0,
					right: 0,
					height: 680,
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					gap: 50,
				}}
			>
				<div
					style={{
						opacity: 1 - dimT * 0.6,
						transform: `scale(${1 - dimT * 0.14}) rotate(${-dimT * 5}deg)`,
						filter: `grayscale(${dimT})`,
					}}
				>
					<BrickPhone scale={0.82} snake={false} />
				</div>
				<div
					style={{
						opacity: Math.min(1, touchIn),
						transform: `translateX(${(1 - touchIn) * 600}px)`,
					}}
				>
					<TouchPhone />
				</div>
			</div>
			<Caption delay={75} top={1350}>
				Nokia saw a gadget.
				<br />
				<span style={{color: C.sky}}>It was a computer.</span>
			</Caption>
		</Scene>
	);
};

const ReasonHeader: React.FC<{n: string; title: string}> = ({n, title}) => {
	const s = useSpring(2, 14);
	return (
		<>
			<div
				style={{
					position: 'absolute',
					top: 250,
					left: 80,
					fontSize: 190,
					fontWeight: 900,
					letterSpacing: -6,
					color: 'transparent',
					WebkitTextStroke: `4px ${C.blue}`,
					opacity: Math.min(1, s),
					transform: `translateX(${(1 - s) * -160}px)`,
				}}
			>
				{n}
			</div>
			<div style={{position: 'absolute', top: 470, left: 80, right: 80}}>
				<Words
					text={title}
					delay={10}
					style={{fontSize: 104, justifyContent: 'flex-start'}}
				/>
			</div>
		</>
	);
};

const BLOCKS = [
	{label: 'Symbian core', w: 620, color: C.blue},
	{label: 'Keypad UI', w: 540, color: '#3F58C9'},
	{label: 'Touch layer', w: 470, color: '#6A4BD6'},
	{label: 'Patch', w: 330, color: C.amber},
	{label: 'Patch', w: 250, color: C.red},
];

const Reason1: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const landed = BLOCKS.filter((_, i) => frame > 30 + i * 22).length;
	const sway = Math.sin(frame / 7) * landed * 0.5;
	return (
		<Scene dur={SCENES.r1.dur}>
			<ReasonHeader n="01" title="Old software" />
			<div
				style={{
					position: 'absolute',
					top: 690,
					left: 0,
					right: 0,
					height: 600,
					display: 'flex',
					flexDirection: 'column-reverse',
					alignItems: 'center',
					gap: 12,
					transformOrigin: '50% 100%',
					transform: `rotate(${sway}deg)`,
				}}
			>
				{BLOCKS.map((b, i) => {
					const s = spring({
						frame: frame - 26 - i * 22,
						fps,
						config: {damping: 13},
					});
					return (
						<div
							key={i}
							style={{
								width: b.w,
								height: 104,
								borderRadius: 20,
								background: b.color,
								color: i === 3 ? '#1A1200' : C.white,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: 44,
								fontWeight: 800,
								opacity: Math.min(1, s * 2),
								transform: `translateY(${(1 - s) * -420}px) translateX(${
									(i % 2 === 0 ? 1 : -1) * i * 14
								}px) rotate(${(i % 2 === 0 ? 1 : -1) * i * 0.9}deg)`,
								boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
							}}
						>
							{b.label}
						</div>
					);
				})}
			</div>
			<Caption delay={120} top={1350}>
				Built for keys.
				<br />
				<span style={{color: C.red}}>Touch was patched on.</span>
			</Caption>
		</Scene>
	);
};

const TIERS = ['Executives', 'Managers', 'Engineers'];
const MESSAGES = [
	{text: "We're behind.", color: C.red},
	{text: 'Some delays.', color: C.amber},
	{text: 'All good!', color: C.green},
];

const Reason2: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	// bubble climbs from tier index 2 (bottom) to 0 (top)
	const climb1 = spring({frame: frame - 62, fps, config: {damping: 200}});
	const climb2 = spring({frame: frame - 100, fps, config: {damping: 200}});
	const level = climb1 + climb2; // 0..2
	const stage = Math.min(2, Math.round(level));
	const msg = MESSAGES[stage];
	const bubbleIn = spring({frame: frame - 34, fps, config: {damping: 13}});
	const tierH = 170;
	const gap = 26;
	const top0 = 720;
	const bubbleY = top0 + (2 - level) * (tierH + gap) + 35;
	return (
		<Scene dur={SCENES.r2.dur}>
			<ReasonHeader n="02" title="A culture of fear" />
			{TIERS.map((t, i) => {
				const s = spring({frame: frame - 14 - i * 5, fps, config: {damping: 200}});
				return (
					<div
						key={t}
						style={{
							position: 'absolute',
							top: top0 + i * (tierH + gap),
							left: 80,
							right: 80,
							height: tierH,
							borderRadius: 28,
							background: C.card,
							border: `2px solid ${C.line}`,
							display: 'flex',
							alignItems: 'center',
							paddingLeft: 44,
							fontSize: 46,
							fontWeight: 700,
							color: C.dim,
							opacity: s,
							transform: `translateX(${(1 - s) * -80}px)`,
						}}
					>
						{t}
					</div>
				);
			})}
			<div
				style={{
					position: 'absolute',
					top: bubbleY,
					right: 120,
					height: 100,
					padding: '0 40px',
					borderRadius: 50,
					background: msg.color,
					color: '#0A0F1F',
					fontSize: 46,
					fontWeight: 900,
					display: 'flex',
					alignItems: 'center',
					opacity: Math.min(1, bubbleIn),
					transform: `scale(${0.5 + bubbleIn * 0.5})`,
					boxShadow: `0 0 60px ${msg.color}88`,
				}}
			>
				{msg.text}
			</div>
			<Caption delay={128} top={1350}>
				Bad news never
				<br />
				<span style={{color: C.red}}>reached the top.</span>
			</Caption>
		</Scene>
	);
};

const Reason3: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const inA = spring({frame: frame - 16, fps, config: {damping: 15}});
	const inB = spring({frame: frame - 24, fps, config: {damping: 15}});
	const strike = interpolate(frame, [60, 74], [0, 1], CLAMP);
	const stamp = spring({frame: frame - 80, fps, config: {damping: 10}});
	const bar = interpolate(frame, [112, 150], [0, 1], CLAMP);
	const cardBase: CSSProperties = {
		width: 430,
		height: 400,
		borderRadius: 36,
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: 58,
		fontWeight: 900,
		color: C.white,
		textAlign: 'center',
		position: 'relative',
		lineHeight: 1.1,
	};
	return (
		<Scene dur={SCENES.r3.dur}>
			<ReasonHeader n="03" title="The wrong bet" />
			<div
				style={{
					position: 'absolute',
					top: 700,
					left: 80,
					right: 80,
					display: 'flex',
					justifyContent: 'space-between',
				}}
			>
				<div
					style={{
						...cardBase,
						background: C.card,
						border: `3px solid ${C.line}`,
						opacity: Math.min(1, inA) * (1 - strike * 0.55),
						transform: `translateY(${(1 - inA) * 200}px) scale(${1 - strike * 0.06})`,
					}}
				>
					Android
					<div
						style={{
							position: 'absolute',
							left: 30,
							top: 196,
							height: 10,
							borderRadius: 5,
							width: 370 * strike,
							background: C.red,
							transform: 'rotate(-14deg)',
							transformOrigin: '0 50%',
						}}
					/>
				</div>
				<div
					style={{
						...cardBase,
						background: `linear-gradient(160deg, ${C.blue}, #1B3FB0)`,
						border: '3px solid rgba(255,255,255,0.4)',
						opacity: Math.min(1, inB),
						transform: `translateY(${(1 - inB) * 200}px) scale(${1 + strike * 0.04})`,
						boxShadow: `0 0 ${strike * 90}px ${C.blue}`,
					}}
				>
					Windows
					<br />
					Phone
					<div
						style={{
							position: 'absolute',
							bottom: -30,
							right: -14,
							padding: '12px 24px',
							borderRadius: 14,
							background: C.white,
							color: C.navy,
							fontSize: 34,
							letterSpacing: 2,
							opacity: Math.min(1, stamp),
							transform: `scale(${2 - stamp}) rotate(-8deg)`,
						}}
					>
						CHOSEN 2011
					</div>
				</div>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1215,
					left: 80,
					right: 80,
					height: 40,
					borderRadius: 20,
					background: C.card,
					border: `2px solid ${C.line}`,
					overflow: 'hidden',
					opacity: interpolate(frame, [104, 114], [0, 1], CLAMP),
				}}
			>
				<div
					style={{
						width: `${bar * 3.6}%`,
						height: '100%',
						background: C.red,
					}}
				/>
			</div>
			<Caption delay={112} top={1300}>
				Windows Phone stayed
				<br />
				<span style={{color: C.red}}>under 4% of the market.</span>
			</Caption>
		</Scene>
	);
};

const SHARE = [49, 44, 39, 33, 16, 5, 3];
const YEARS = ['07', '08', '09', '10', '11', '12', '13'];
const px = (i: number) => 90 + i * 120;
const py = (v: number) => 610 - (v / 50) * 520;

const Fall: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const progress = interpolate(frame, [18, 93], [0, 1], CLAMP);
	const d = SHARE.map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i)} ${py(v)}`).join(' ');
	const area = `${d} L${px(6)} 610 L${px(0)} 610 Z`;
	const clipW = 90 + progress * 730;
	const endLabel = spring({frame: frame - 92, fps, config: {damping: 11}});
	const card = spring({frame: frame - 105, fps, config: {damping: 16}});
	return (
		<Scene dur={SCENES.fall.dur}>
			<div style={{position: 'absolute', top: 270, left: 0, right: 0}}>
				<Kicker color={C.white}>Nokia smartphone share</Kicker>
			</div>
			<svg
				viewBox="0 0 900 700"
				style={{position: 'absolute', top: 360, left: 90, width: 900, height: 700}}
			>
				<defs>
					<linearGradient id="nokiaFallArea" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={C.red} stopOpacity={0.45} />
						<stop offset="100%" stopColor={C.red} stopOpacity={0} />
					</linearGradient>
					<clipPath id="nokiaFallClip">
						<rect x={0} y={0} width={clipW} height={700} />
					</clipPath>
				</defs>
				{[0, 25, 50].map((v) => (
					<g key={v}>
						<line
							x1={90}
							x2={830}
							y1={py(v)}
							y2={py(v)}
							stroke={C.line}
							strokeWidth={2}
						/>
						<text
							x={70}
							y={py(v) + 10}
							fill={C.dim}
							fontSize={28}
							fontFamily={FONT}
							textAnchor="end"
						>
							{v}%
						</text>
					</g>
				))}
				{YEARS.map((y, i) => (
					<text
						key={y}
						x={px(i)}
						y={662}
						fill={C.dim}
						fontSize={30}
						fontFamily={FONT}
						textAnchor="middle"
					>
						'{y}
					</text>
				))}
				<path d={area} fill="url(#nokiaFallArea)" clipPath="url(#nokiaFallClip)" />
				<path
					d={d}
					fill="none"
					stroke={C.white}
					strokeWidth={10}
					strokeLinecap="round"
					strokeLinejoin="round"
					clipPath="url(#nokiaFallClip)"
				/>
				{SHARE.map((v, i) => {
					const on = interpolate(progress, [i / 6 - 0.02, i / 6 + 0.04], [0, 1], CLAMP);
					return (
						<circle
							key={i}
							cx={px(i)}
							cy={py(v)}
							r={13 * on}
							fill={i >= 4 ? C.red : C.white}
							stroke={C.navy}
							strokeWidth={4}
						/>
					);
				})}
				<text
					x={px(0) + 24}
					y={py(49) - 26}
					fill={C.white}
					fontSize={64}
					fontWeight={900}
					fontFamily={FONT}
					opacity={interpolate(frame, [10, 22], [0, 1], CLAMP)}
				>
					49%
				</text>
				<text
					x={px(6)}
					y={py(3) - 44}
					fill={C.red}
					fontSize={90 * Math.min(1.2, endLabel)}
					fontWeight={900}
					fontFamily={FONT}
					textAnchor="middle"
					opacity={Math.min(1, endLabel)}
				>
					3%
				</text>
			</svg>
			<div
				style={{
					position: 'absolute',
					top: 1085,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontSize: 28,
					color: C.dim,
				}}
			>
				approximate, analyst estimates
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1180,
					left: 80,
					right: 80,
					padding: '44px 40px',
					borderRadius: 36,
					background: 'rgba(0,0,0,0.4)',
					border: `3px solid ${C.red}`,
					textAlign: 'center',
					color: C.white,
					fontSize: 54,
					fontWeight: 800,
					lineHeight: 1.2,
					opacity: Math.min(1, card),
					transform: `translateY(${(1 - card) * 160}px)`,
				}}
			>
				<span style={{color: C.red}}>2013:</span> phone business
				<br />
				sold to Microsoft for €5.4B
			</div>
		</Scene>
	);
};

const Lesson: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const wipe = interpolate(frame, [42, 62], [0, 1], CLAMP);
	const pill = spring({frame: frame - 56, fps, config: {damping: 13}});
	const pulse = 1 + Math.sin(frame / 6) * 0.025;
	return (
		<Scene dur={SCENES.lesson.dur} hold>
			<div style={{position: 'absolute', top: 400, left: 0, right: 0}}>
				<Kicker delay={2}>The lesson</Kicker>
			</div>
			<div style={{position: 'absolute', top: 520, left: 70, right: 70}}>
				<Words
					text="What made you win won't keep you winning."
					delay={6}
					stagger={3}
					highlight={['win', 'winning']}
					style={{fontSize: 122}}
				/>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1130,
					left: 240,
					width: 600 * wipe,
					height: 12,
					borderRadius: 6,
					background: C.blue,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 1260,
					left: 0,
					right: 0,
					display: 'flex',
					justifyContent: 'center',
					opacity: Math.min(1, pill),
					transform: `scale(${(0.7 + pill * 0.3) * pulse})`,
				}}
			>
				<div
					style={{
						padding: '34px 60px',
						borderRadius: 70,
						background: C.blue,
						color: C.white,
						fontSize: 48,
						fontWeight: 800,
						boxShadow: `0 0 80px ${C.blue}AA`,
					}}
				>
					Follow for more business stories
				</div>
			</div>
		</Scene>
	);
};

// ---------- root ----------

const Backdrop: React.FC = () => {
	const frame = useCurrentFrame();
	const f = SCENES.fall.from;
	const l = SCENES.lesson.from;
	const top = interpolateColors(
		frame,
		[0, f - 10, f + 25, l - 10, l + 15],
		[C.navy2, C.navy2, '#4A0D16', '#4A0D16', C.navy2]
	);
	const bottom = interpolateColors(
		frame,
		[0, f - 10, f + 25, l - 10, l + 15],
		[C.navy, C.navy, '#12040A', '#12040A', C.navy]
	);
	const drift = (frame * 0.6) % 120;
	return (
		<AbsoluteFill
			style={{background: `linear-gradient(180deg, ${top} 0%, ${bottom} 70%)`}}
		>
			<AbsoluteFill
				style={{
					backgroundImage:
						'linear-gradient(rgba(255,255,255,0.045) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.045) 2px, transparent 2px)',
					backgroundSize: '120px 120px',
					backgroundPosition: `0px ${drift}px`,
				}}
			/>
			<AbsoluteFill
				style={{
					background:
						'radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(0,0,0,0.6) 100%)',
				}}
			/>
		</AbsoluteFill>
	);
};

const ProgressBar: React.FC = () => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const total = Math.min(durationInFrames, NOKIA_BASELINE_DURATION);
	const p = interpolate(frame, [0, total - 1], [0, 100], CLAMP);
	return (
		<div
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				height: 10,
				background: 'rgba(255,255,255,0.12)',
			}}
		>
			<div style={{width: `${p}%`, height: '100%', background: C.blue}} />
		</div>
	);
};

export const NokiaBaseline: React.FC = () => {
	return (
		<AbsoluteFill style={{backgroundColor: C.navy, fontFamily: FONT}}>
			<Backdrop />
			<Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.dur}>
				<Hook />
			</Sequence>
			<Sequence from={SCENES.peak.from} durationInFrames={SCENES.peak.dur}>
				<Peak />
			</Sequence>
			<Sequence from={SCENES.shift.from} durationInFrames={SCENES.shift.dur}>
				<Shift />
			</Sequence>
			<Sequence from={SCENES.r1.from} durationInFrames={SCENES.r1.dur}>
				<Reason1 />
			</Sequence>
			<Sequence from={SCENES.r2.from} durationInFrames={SCENES.r2.dur}>
				<Reason2 />
			</Sequence>
			<Sequence from={SCENES.r3.from} durationInFrames={SCENES.r3.dur}>
				<Reason3 />
			</Sequence>
			<Sequence from={SCENES.fall.from} durationInFrames={SCENES.fall.dur}>
				<Fall />
			</Sequence>
			<Sequence from={SCENES.lesson.from} durationInFrames={SCENES.lesson.dur}>
				<Lesson />
			</Sequence>
			<ProgressBar />
		</AbsoluteFill>
	);
};
