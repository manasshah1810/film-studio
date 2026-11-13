import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// 1080x1920 @ 30fps, 900 frames total.

const W = 1080;
const H = 1920;
const TABLE_Y = 1200;
const TABLE_EDGE = 760;
const OBJ_START_X = 640;
const PUSH_FRAMES = 22;
const PUSH_DIST = 150;
const NUDGE_DIST = 12;

const INK = '#1B1B3A';
const CAT = '#2B2D42';
const CAT_LIGHT = '#F8F7F2';
const FONT =
  '"Arial Black", "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif';

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

/* ----------------------------- Objects ----------------------------- */
// All objects are drawn with their bottom-center at (0,0).

const Mug: React.FC = () => (
  <g>
    <path
      d="M 45 -95 Q 95 -95 95 -60 Q 95 -25 45 -25"
      fill="none"
      stroke="#E63946"
      strokeWidth={16}
    />
    <rect x={-50} y={-120} width={100} height={120} rx={12} fill="#E63946" />
    <rect x={-50} y={-120} width={100} height={18} rx={9} fill="#B82633" />
    <rect x={-34} y={-90} width={12} height={60} rx={6} fill="#FF8A93" />
  </g>
);

const ToyMouse: React.FC = () => (
  <g>
    <path
      d="M -55 -18 Q -100 -10 -95 -45 Q -92 -62 -112 -60"
      fill="none"
      stroke="#FF8FA3"
      strokeWidth={7}
      strokeLinecap="round"
    />
    <ellipse cx={0} cy={-32} rx={62} ry={32} fill="#F8F7F2" />
    <circle cx={22} cy={-62} r={18} fill="#F8F7F2" />
    <circle cx={22} cy={-62} r={10} fill="#FF8FA3" />
    <circle cx={40} cy={-36} r={6} fill={INK} />
    <circle cx={61} cy={-28} r={7} fill="#FF8FA3" />
  </g>
);

const Glass: React.FC = () => (
  <g>
    <path d="M -42 -130 L 42 -130 L 34 0 L -34 0 Z" fill="#FFFFFF" opacity={0.55} />
    <path d="M -39 -85 L 39 -85 L 34 0 L -34 0 Z" fill="#4CC9F0" opacity={0.9} />
    <path
      d="M -42 -130 L 42 -130 L 34 0 L -34 0 Z"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={6}
      strokeLinejoin="round"
    />
  </g>
);

const Plant: React.FC = () => (
  <g>
    <ellipse cx={-28} cy={-120} rx={18} ry={44} fill="#52B788" transform="rotate(-28 -28 -120)" />
    <ellipse cx={28} cy={-120} rx={18} ry={44} fill="#52B788" transform="rotate(28 28 -120)" />
    <ellipse cx={0} cy={-135} rx={18} ry={50} fill="#74C69D" />
    <path d="M -48 -80 L 48 -80 L 36 0 L -36 0 Z" fill="#F4A261" />
    <rect x={-54} y={-92} width={108} height={22} rx={8} fill="#E76F51" />
  </g>
);

const FollowPill: React.FC = () => (
  <g>
    <rect x={-120} y={-90} width={240} height={90} rx={45} fill="#E63946" />
    <text
      x={0}
      y={-30}
      textAnchor="middle"
      fontFamily={FONT}
      fontWeight={900}
      fontSize={44}
      fill="#FFFFFF"
    >
      FOLLOW
    </text>
  </g>
);

/* ------------------------------- Cat ------------------------------- */

const Cat: React.FC<{
  frame: number;
  pawX: number;
  pawY: number;
  lookX: number; // -1..1
  lookY: number; // -1..1
  pupil: number; // 0 (slit) .. 1 (wide)
  headTilt: number; // degrees
}> = ({frame, pawX, pawY, lookX, lookY, pupil, headTilt}) => {
  const wag = Math.sin(frame / 7) * 9;
  const blinkPhase = frame % 80;
  const blink = interpolate(blinkPhase, [70, 74, 78], [1, 0.08, 1], clamp);
  const breathe = 1 + Math.sin(frame / 14) * 0.008;
  const eye = (cx: number) => (
    <g transform={`translate(${cx} 800) scale(1 ${blink})`}>
      <ellipse cx={0} cy={0} rx={32} ry={36} fill="#D9ED92" />
      <ellipse
        cx={lookX * 12}
        cy={lookY * 10}
        rx={8 + pupil * 14}
        ry={26}
        fill="#101018"
      />
      <circle cx={lookX * 12 - 6} cy={lookY * 10 - 12} r={6} fill="#FFFFFF" />
    </g>
  );
  return (
    <g>
      {/* tail */}
      <g transform={`rotate(${wag} 210 1165)`}>
        <path
          d="M 210 1165 Q 50 1175 78 985"
          fill="none"
          stroke={CAT}
          strokeWidth={42}
          strokeLinecap="round"
        />
        <path
          d="M 72 1020 Q 70 1000 78 985"
          fill="none"
          stroke={CAT_LIGHT}
          strokeWidth={42}
          strokeLinecap="round"
        />
      </g>
      {/* body */}
      <g transform={`translate(330 ${TABLE_Y}) scale(1 ${breathe}) translate(-330 ${-TABLE_Y})`}>
        <ellipse cx={330} cy={1040} rx={150} ry={166} fill={CAT} />
        <ellipse cx={400} cy={1030} rx={62} ry={96} fill={CAT_LIGHT} />
      </g>
      {/* resting paws */}
      <ellipse cx={330} cy={1184} rx={50} ry={22} fill={CAT_LIGHT} />
      {/* reaching arm */}
      <line
        x1={440}
        y1={1010}
        x2={pawX}
        y2={pawY}
        stroke={CAT}
        strokeWidth={54}
        strokeLinecap="round"
      />
      <circle cx={pawX} cy={pawY} r={30} fill={CAT_LIGHT} />
      {/* head */}
      <g transform={`rotate(${headTilt} 410 900)`}>
        <polygon points="305,745 322,612 405,700" fill={CAT} />
        <polygon points="425,695 508,612 520,750" fill={CAT} />
        <polygon points="328,718 336,655 378,700" fill="#FF8FA3" />
        <polygon points="452,698 494,655 500,720" fill="#FF8FA3" />
        <ellipse cx={410} cy={810} rx={132} ry={118} fill={CAT} />
        {eye(362)}
        {eye(462)}
        <path d="M 400 846 L 424 846 L 412 860 Z" fill="#FF8FA3" />
        <path
          d="M 412 860 Q 412 878 394 878 M 412 860 Q 412 878 430 878"
          fill="none"
          stroke={CAT_LIGHT}
          strokeWidth={5}
          strokeLinecap="round"
        />
        <g stroke={CAT_LIGHT} strokeWidth={4} strokeLinecap="round" opacity={0.9}>
          <line x1={340} y1={858} x2={250} y2={846} />
          <line x1={340} y1={872} x2={254} y2={884} />
          <line x1={484} y1={858} x2={574} y2={846} />
          <line x1={484} y1={872} x2={570} y2={884} />
        </g>
      </g>
    </g>
  );
};

/* ----------------------------- Captions ----------------------------- */

const Caption: React.FC<{
  badge?: string;
  title: string;
  subtitle?: string;
  color: string;
  accent: string;
  titleSize?: number;
  subDelay?: number;
}> = ({badge, title, subtitle, color, accent, titleSize = 104, subDelay = 22}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = title.split(' ');
  const badgeS = spring({frame, fps, config: {damping: 10, stiffness: 160}});
  const subS = spring({frame: frame - subDelay, fps, config: {damping: 14}});
  return (
    <div
      style={{
        position: 'absolute',
        top: 230,
        left: 70,
        right: 70,
        fontFamily: FONT,
        color,
        textAlign: 'center',
      }}
    >
      {badge ? (
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            background: accent,
            color: INK,
            fontSize: 76,
            fontWeight: 900,
            lineHeight: '120px',
            margin: '0 auto 24px',
            transform: `scale(${badgeS}) rotate(${(1 - badgeS) * -40}deg)`,
          }}
        >
          {badge}
        </div>
      ) : null}
      <div
        style={{
          fontSize: titleSize,
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: -2,
          textTransform: 'uppercase',
        }}
      >
        {words.map((w, i) => {
          const s = spring({
            frame: frame - 2 - i * 3,
            fps,
            config: {damping: 11, stiffness: 180},
          });
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                marginRight: '0.24em',
                opacity: interpolate(s, [0, 0.4], [0, 1], clamp),
                transform: `translateY(${(1 - s) * 50}px) scale(${0.6 + 0.4 * s})`,
                color: i === 0 && !badge ? accent : color,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
      {subtitle ? (
        <div
          style={{
            marginTop: 28,
            fontFamily: '"Helvetica Neue", Helvetica, Arial, system-ui, sans-serif',
            fontSize: 50,
            fontWeight: 700,
            lineHeight: 1.25,
            opacity: subS,
            transform: `translateY(${(1 - subS) * 30}px)`,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
};

/* ---------------------------- Table scene ---------------------------- */

const TableScene: React.FC<{
  bg: string;
  object?: React.ReactNode;
  objHalfW?: number;
  nudges?: number[];
  pushAt?: number; // omit for no push
  lookAtCamera?: boolean;
  pupil?: number;
  children?: React.ReactNode;
}> = ({
  bg,
  object,
  objHalfW = 50,
  nudges = [],
  pushAt,
  lookAtCamera = false,
  pupil = 0.5,
  children,
}) => {
  const frame = useCurrentFrame();
  const hasPush = pushAt !== undefined;
  const pAt = pushAt ?? 100000;
  const fallAt = pAt + PUSH_FRAMES;
  const crashAt = fallAt + 24;

  // Object motion
  let objX = OBJ_START_X;
  let wobble = 0;
  let reach = 0;
  for (const n of nudges) {
    objX += NUDGE_DIST * interpolate(frame, [n, n + 4], [0, 1], clamp);
    const dt = frame - n;
    if (dt >= 0 && dt < 20) {
      wobble += Math.sin(dt * 0.9) * 7 * (1 - dt / 20);
    }
    reach = Math.max(reach, interpolate(frame, [n - 9, n, n + 9], [0, 1, 0], clamp));
  }
  objX +=
    PUSH_DIST *
    interpolate(frame, [pAt, fallAt], [0, 1], {
      ...clamp,
      easing: Easing.in(Easing.quad),
    });
  if (hasPush) {
    reach = Math.max(
      reach,
      interpolate(frame, [pAt - 10, pAt, fallAt, fallAt + 16], [0, 1, 1, 0], clamp),
    );
  }
  const t = Math.max(0, frame - fallAt);
  const fallX = objX + t * 5;
  const fallY = TABLE_Y + 1.1 * t * t;
  const rot = wobble + interpolate(frame, [fallAt - 6, fallAt], [0, 14], clamp) + t * 7;

  // Paw
  const restX = 452;
  const restY = 1176;
  const targetX = Math.min(objX, TABLE_EDGE + 30) - objHalfW - 22;
  const targetY = 1128;
  const pawX = restX + (targetX - restX) * reach;
  const pawY = restY + (targetY - restY) * reach - Math.sin(reach * Math.PI) * 30;

  // Eyes
  const falling = t > 0 && t < 30;
  const lookX = lookAtCamera ? 0 : falling ? 1 : 0.8;
  const lookY = lookAtCamera
    ? 0
    : falling
      ? interpolate(t, [0, 20], [0.6, 1], clamp)
      : 0.7;

  // Camera
  const zoom = interpolate(frame, [0, 180], [1, 1.05], clamp);
  const shakeT = frame - crashAt;
  const shaking = hasPush && shakeT >= 0 && shakeT < 10;
  const shakeX = shaking ? Math.sin(shakeT * 2.4) * 14 * (1 - shakeT / 10) : 0;
  const shakeY = shaking ? Math.cos(shakeT * 3.1) * 10 * (1 - shakeT / 10) : 0;
  const crashS = interpolate(shakeT, [0, 4, 16, 22], [0, 1.15, 1, 0], clamp);

  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `translate(${shakeX}px, ${shakeY}px) scale(${zoom})`,
          transformOrigin: '50% 62%',
        }}
      >
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {/* soft blob behind cat */}
          <circle cx={380} cy={1000} r={430} fill="#FFFFFF" opacity={0.14} />
          {/* table */}
          <rect x={590} y={TABLE_Y + 40} width={60} height={H} fill="#CDB58A" />
          <rect x={-40} y={TABLE_Y} width={TABLE_EDGE + 40} height={56} rx={16} fill="#FFF3D6" />
          <rect x={-40} y={TABLE_Y + 38} width={TABLE_EDGE + 40} height={18} rx={9} fill="#E0C9A0" />
          <Cat
            frame={frame}
            pawX={pawX}
            pawY={pawY}
            lookX={lookX}
            lookY={lookY}
            pupil={pupil}
            headTilt={reach * 6}
          />
          {object ? (
            <g transform={`translate(${fallX} ${fallY}) rotate(${rot})`}>{object}</g>
          ) : null}
          {/* crash burst */}
          {hasPush && crashS > 0 ? (
            <g transform={`translate(800 1470) scale(${crashS}) rotate(-8)`}>
              <polygon
                points="0,-110 34,-48 104,-70 76,-8 140,30 70,48 84,116 22,74 -30,124 -40,56 -112,62 -70,8 -128,-40 -56,-46 -60,-112 -14,-60"
                fill="#FFFFFF"
                stroke={INK}
                strokeWidth={8}
                strokeLinejoin="round"
              />
              <text
                x={0}
                y={22}
                textAnchor="middle"
                fontFamily={FONT}
                fontWeight={900}
                fontSize={46}
                fill="#E63946"
              >
                CRASH!
              </text>
            </g>
          ) : null}
          {/* tap labels */}
          {nudges.map((n, i) => {
            const o = interpolate(frame, [n, n + 3, n + 14, n + 20], [0, 1, 1, 0], clamp);
            if (o <= 0) {
              return null;
            }
            return (
              <text
                key={i}
                x={600 + i * 40}
                y={1010 - i * 46 - (frame - n) * 1.5}
                fontFamily={FONT}
                fontWeight={900}
                fontSize={48}
                fill="#FFFFFF"
                opacity={o}
                transform={`rotate(${-10 + i * 8} ${600 + i * 40} ${1010 - i * 46})`}
              >
                tap
              </text>
            );
          })}
        </svg>
      </AbsoluteFill>
      {children}
    </AbsoluteFill>
  );
};

/* --------------------------- Scene extras --------------------------- */

const HumanReaction: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - at, fps, config: {damping: 9, stiffness: 200}});
  const hearts = [0, 1, 2];
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 560,
          top: 880,
          padding: '22px 44px',
          background: '#FFFFFF',
          color: '#E63946',
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 84,
          borderRadius: 40,
          border: `8px solid ${INK}`,
          transform: `scale(${s}) rotate(${6 - s * 2}deg)`,
          transformOrigin: '100% 100%',
        }}
      >
        NOOO!
      </div>
      {hearts.map((i) => {
        const start = at + 18 + i * 10;
        const p = interpolate(frame, [start, start + 45], [0, 1], clamp);
        if (p <= 0 || p >= 1) {
          return null;
        }
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 250 + i * 110 + Math.sin(p * 6 + i) * 18,
              top: 700 - p * 180,
              fontSize: 70,
              color: '#FFFFFF',
              opacity: interpolate(p, [0, 0.2, 0.7, 1], [0, 1, 1, 0]),
              transform: `scale(${0.6 + p * 0.6})`,
            }}
          >
            {'♥'}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Trajectory: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 22], [0, 1], clamp);
  const labelO = interpolate(frame, [at + 16, at + 26], [0, 1], clamp);
  const len = 620;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <mask id="cats-traj-mask">
            <path
              d="M 800 1090 Q 900 1180 915 1640"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={30}
              strokeDasharray={len}
              strokeDashoffset={len * (1 - p)}
            />
          </mask>
        </defs>
        <path
          d="M 800 1090 Q 900 1180 915 1640"
          fill="none"
          stroke="#FFD23F"
          strokeWidth={10}
          strokeDasharray="22 20"
          strokeLinecap="round"
          mask="url(#cats-traj-mask)"
        />
        <g opacity={labelO}>
          <rect x={620} y={1330} width={270} height={84} rx={20} fill="#FFD23F" />
          <text
            x={755}
            y={1388}
            textAnchor="middle"
            fontFamily={FONT}
            fontWeight={900}
            fontSize={46}
            fill={INK}
          >
            9.8 m/s²
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const Recap: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const chips = [
    {label: 'Instinct', color: '#2EC4B6'},
    {label: 'Attention', color: '#FF6B6B'},
    {label: 'Boredom', color: '#5E60CE'},
  ];
  const tipS = spring({frame: frame - 62, fps, config: {damping: 13}});
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <div
        style={{
          position: 'absolute',
          top: 400,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        {chips.map((c, i) => {
          const s = spring({
            frame: frame - 18 - i * 10,
            fps,
            config: {damping: 10, stiffness: 170},
          });
          return (
            <div
              key={c.label}
              style={{
                background: c.color,
                color: '#FFFFFF',
                fontSize: 50,
                fontWeight: 900,
                padding: '22px 30px',
                borderRadius: 28,
                transform: `scale(${s}) rotate(${(i - 1) * 3}deg)`,
              }}
            >
              {c.label}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 560,
          left: 600,
          right: 60,
          background: '#FFFFFF',
          color: INK,
          borderRadius: 32,
          border: `8px solid ${INK}`,
          padding: '28px 30px',
          fontFamily: '"Helvetica Neue", Helvetica, Arial, system-ui, sans-serif',
          fontSize: 44,
          fontWeight: 800,
          lineHeight: 1.25,
          opacity: tipS,
          transform: `translateY(${(1 - tipS) * 80}px) rotate(2deg)`,
        }}
      >
        <span style={{color: '#E63946'}}>THE FIX:</span> more playtime, fewer
        things on the edge.
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------ Video ------------------------------ */

export const CatsBaseline: React.FC = () => {
  return (
    <AbsoluteFill style={{background: INK}}>
      {/* 1. Hook: 0-90 */}
      <Sequence durationInFrames={90}>
        <TableScene bg="#FFD23F" object={<Mug />} pushAt={40} lookAtCamera pupil={0.35}>
          <Caption
            title="Why do cats knock things off tables?"
            color={INK}
            accent="#E63946"
            titleSize={112}
          />
        </TableScene>
      </Sequence>

      {/* 2. Hunter instinct: 90-270 */}
      <Sequence from={90} durationInFrames={180}>
        <TableScene
          bg="#2EC4B6"
          object={<ToyMouse />}
          objHalfW={62}
          nudges={[50, 75]}
          pushAt={110}
          pupil={1}
        >
          <Caption
            badge="1"
            title="Hunter instinct"
            subtitle={'Paws poke "prey" to check if it\'s alive.'}
            color="#FFFFFF"
            accent="#FFD23F"
          />
        </TableScene>
      </Sequence>

      {/* 3. Attention: 270-450 */}
      <Sequence from={270} durationInFrames={180}>
        <TableScene
          bg="#FF6B6B"
          object={<Glass />}
          objHalfW={42}
          pushAt={70}
          lookAtCamera
          pupil={0.3}
        >
          <Caption
            badge="2"
            title="It works on you"
            subtitle="You gasp. You run over. Free attention."
            color="#FFFFFF"
            accent="#FFD23F"
          />
          <HumanReaction at={112} />
        </TableScene>
      </Sequence>

      {/* 4. Gravity research: 450-630 */}
      <Sequence from={450} durationInFrames={180}>
        <TableScene
          bg="#5E60CE"
          object={<Plant />}
          objHalfW={54}
          nudges={[55]}
          pushAt={85}
          pupil={0.8}
        >
          <Caption
            badge="3"
            title="Gravity research"
            subtitle="Bored cats run experiments. Result: it falls. Every time."
            color="#FFFFFF"
            accent="#FFD23F"
          />
          <Trajectory at={107} />
        </TableScene>
      </Sequence>

      {/* 5. Recap: 630-780 */}
      <Sequence from={630} durationInFrames={150}>
        <TableScene bg="#A8DADC" lookAtCamera pupil={0.6}>
          <Caption title="So it's not spite" color={INK} accent="#E63946" titleSize={96} />
          <Recap />
        </TableScene>
      </Sequence>

      {/* 6. CTA: 780-900 */}
      <Sequence from={780} durationInFrames={120}>
        <TableScene
          bg="#FFD23F"
          object={<FollowPill />}
          objHalfW={120}
          pushAt={62}
          lookAtCamera
          pupil={0.35}
        >
          <Caption
            title="Not a jerk. A tiny scientist."
            subtitle="Follow before it's gone."
            color={INK}
            accent="#E63946"
            titleSize={104}
            subDelay={30}
          />
        </TableScene>
      </Sequence>
    </AbsoluteFill>
  );
};
