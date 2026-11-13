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

// 60s explainer, 1920x1080 @ 30fps, 1800 frames total.

const BG = '#0b1220';
const PANEL = '#141d30';
const LINE = '#26324a';
const TEXT = '#f2f4f8';
const MUTED = '#93a0b8';
const AMBER = '#f5b942';
const RED = '#ef4f4f';
const GREEN = '#3ecf8e';
const FONT = 'Inter, "Segoe UI", Helvetica, Arial, sans-serif';

const TOTAL = 1800;
const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const SCENES = [
  {from: 0, dur: 150},
  {from: 150, dur: 270},
  {from: 420, dur: 270},
  {from: 690, dur: 300},
  {from: 990, dur: 210},
  {from: 1200, dur: 240},
  {from: 1440, dur: 180},
  {from: 1620, dur: 180},
];

const CAPTIONS: {from: number; to: number; text: string}[] = [
  {from: 0, to: 80, text: 'In 2008, the global financial system came within days of collapse.'},
  {from: 80, to: 150, text: 'Here is how it happened.'},
  {from: 150, to: 290, text: 'It started with cheap money. After 2001, the Fed cut interest rates to one percent.'},
  {from: 290, to: 420, text: 'Borrowing was easy, and US home prices climbed more than 80% in six years.'},
  {from: 420, to: 560, text: 'Lenders chased volume, giving mortgages to borrowers with weak credit and little proof of income.'},
  {from: 560, to: 690, text: 'Teaser rates would jump later. These were subprime loans.'},
  {from: 690, to: 850, text: 'Lenders did not keep those loans. Wall Street bundled thousands of them into securities and sold them worldwide.'},
  {from: 850, to: 990, text: 'Rating agencies stamped many of them triple-A.'},
  {from: 990, to: 1100, text: 'Banks piled on debt: about thirty borrowed dollars for every dollar of their own.'},
  {from: 1100, to: 1200, text: 'At that leverage, a three percent loss wipes you out.'},
  {from: 1200, to: 1330, text: 'Then rates rose and payments reset. Borrowers defaulted, and home prices fell by more than a quarter.'},
  {from: 1330, to: 1440, text: 'The triple-A securities turned toxic.'},
  {from: 1440, to: 1530, text: 'Nobody knew who held the losses, so banks stopped lending to each other.'},
  {from: 1530, to: 1620, text: 'On September 15, 2008, Lehman Brothers went bankrupt, and panic spread worldwide.'},
  {from: 1620, to: 1710, text: 'Governments stepped in with bailouts. Nearly nine million American jobs were lost.'},
  {from: 1710, to: 1800, text: 'Cheap debt, hidden risk, too much leverage.'},
];

// ---------- helpers ----------

const ramp = (frame: number, start: number, dur = 15) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });

const usePop = (delay: number, damping = 14) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config: {damping, stiffness: 140}});
};

const Rise: React.FC<{
  at: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  dist?: number;
}> = ({at, children, style, dist = 30}) => {
  const frame = useCurrentFrame();
  const p = ramp(frame, at, 18);
  return (
    <div style={{opacity: p, transform: `translateY(${(1 - p) * dist}px)`, ...style}}>
      {children}
    </div>
  );
};

const Scene: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const frame = useCurrentFrame();
  const opacity = Math.min(
    interpolate(frame, [0, 12], [0, 1], CLAMP),
    interpolate(frame, [dur - 12, dur], [1, 0], CLAMP),
  );
  return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};

const StepLabel: React.FC<{text: string; color?: string}> = ({text, color = AMBER}) => {
  const frame = useCurrentFrame();
  const p = ramp(frame, 4, 16);
  return (
    <div
      style={{
        position: 'absolute',
        left: 96,
        top: 76,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        opacity: p,
        transform: `translateX(${(1 - p) * -30}px)`,
      }}
    >
      <div style={{width: 12, height: 44, background: color, borderRadius: 3}} />
      <div style={{fontSize: 40, fontWeight: 800, letterSpacing: 4, color}}>{text}</div>
    </div>
  );
};

const House: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <polygon points="50,8 96,48 84,48 84,92 16,92 16,48 4,48" fill={color} />
    <rect x="42" y="60" width="16" height="32" fill={BG} opacity={0.55} />
  </svg>
);

const Chart: React.FC<{
  values: number[];
  drawn: number; // how many segments are drawn (float, 0..values.length-1)
  split?: number; // index after which the line is red
  width: number;
  height: number;
  min: number;
  max: number;
  startYear: number;
}> = ({values, drawn, split = Infinity, width, height, min, max, startYear}) => {
  const n = values.length;
  const px = (i: number) => (i / (n - 1)) * width;
  const py = (v: number) => height - ((v - min) / (max - min)) * height;
  const d = Math.max(0, Math.min(n - 1, drawn));
  const pointAt = (t: number): [number, number] => {
    const i = Math.min(n - 2, Math.floor(t));
    const f = t - i;
    return [px(i) + (px(i + 1) - px(i)) * f, py(values[i] + (values[i + 1] - values[i]) * f)];
  };
  const build = (a: number, b: number) => {
    if (b <= a) return '';
    const pts: [number, number][] = [pointAt(a)];
    for (let i = Math.floor(a) + 1; i < b; i++) pts.push([px(i), py(values[i])]);
    pts.push(pointAt(b));
    return pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  };
  const s = Math.min(split, n - 1);
  const up = build(0, Math.min(d, s));
  const down = d > s ? build(s, d) : '';
  const tip = pointAt(d);
  const tipColor = d > s ? RED : AMBER;
  const gridVals = [0.25, 0.5, 0.75, 1];
  return (
    <svg width={width + 120} height={height + 80} viewBox={`-90 -20 ${width + 120} ${height + 80}`}>
      {gridVals.map((g) => (
        <g key={g}>
          <line x1={0} x2={width} y1={height - g * height} y2={height - g * height} stroke={LINE} strokeWidth={2} />
          <text x={-18} y={height - g * height + 9} fill={MUTED} fontSize={26} textAnchor="end" fontFamily={FONT}>
            {Math.round(min + g * (max - min))}
          </text>
        </g>
      ))}
      <line x1={0} x2={width} y1={height} y2={height} stroke={MUTED} strokeWidth={2} />
      {values.map((_, i) =>
        i % 2 === 0 ? (
          <text key={i} x={px(i)} y={height + 42} fill={MUTED} fontSize={26} textAnchor="middle" fontFamily={FONT}>
            {startYear + i}
          </text>
        ) : null,
      )}
      {up ? (
        <polyline points={up} fill="none" stroke={AMBER} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
      ) : null}
      {down ? (
        <polyline points={down} fill="none" stroke={RED} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
      ) : null}
      <circle cx={tip[0]} cy={tip[1]} r={14} fill={tipColor} />
      <circle cx={tip[0]} cy={tip[1]} r={26} fill={tipColor} opacity={0.25} />
    </svg>
  );
};

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = (frame * 0.25) % 80;
  return (
    <AbsoluteFill style={{background: BG}}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          backgroundPosition: `${-drift}px ${-drift}px`,
          opacity: 0.28,
        }}
      />
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse at center, transparent 45%, rgba(4,7,14,0.85) 100%)'}}
      />
    </AbsoluteFill>
  );
};

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: 8, background: LINE}}>
      <div style={{width: `${(frame / TOTAL) * 100}%`, height: '100%', background: AMBER}} />
      {SCENES.slice(1).map((s) => (
        <div
          key={s.from}
          style={{position: 'absolute', top: 0, left: `${(s.from / TOTAL) * 100}%`, width: 3, height: 8, background: BG}}
        />
      ))}
    </div>
  );
};

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const cap = CAPTIONS.find((c) => frame >= c.from && frame < c.to);
  if (!cap) return null;
  const opacity = Math.min(
    interpolate(frame, [cap.from, cap.from + 6], [0, 1], CLAMP),
    interpolate(frame, [cap.to - 6, cap.to], [1, 0], CLAMP),
  );
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 54,
        display: 'flex',
        justifyContent: 'center',
        opacity,
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          padding: '16px 34px',
          background: 'rgba(5,9,18,0.82)',
          borderRadius: 14,
          fontSize: 36,
          lineHeight: 1.3,
          fontWeight: 500,
          color: TEXT,
          textAlign: 'center',
        }}
      >
        {cap.text}
      </div>
    </div>
  );
};

// ---------- Scene 1: hook (150) ----------

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pop = usePop(14, 12);
  const vals = [60, 66, 63, 72, 70, 80, 78, 88, 84, 92, 74, 58, 62, 40, 30, 34, 18, 12];
  const draw = interpolate(frame, [0, 70], [0, vals.length - 1], {...CLAMP, easing: Easing.inOut(Easing.quad)});
  const n = vals.length;
  const pts: string[] = [];
  for (let i = 0; i <= Math.floor(draw); i++) pts.push(`${(i / (n - 1)) * 1920},${900 - vals[i] * 8}`);
  if (draw < n - 1) {
    const i = Math.floor(draw);
    const f = draw - i;
    pts.push(`${((i + f) / (n - 1)) * 1920},${900 - (vals[i] + (vals[i + 1] - vals[i]) * f) * 8}`);
  }
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: 0.45}}>
        <polyline points={pts.join(' ')} fill="none" stroke={RED} strokeWidth={10} strokeLinejoin="round" />
      </svg>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 150}}>
        <div
          style={{
            fontSize: 380,
            fontWeight: 900,
            color: TEXT,
            letterSpacing: -8,
            lineHeight: 1,
            transform: `scale(${0.6 + pop * 0.4})`,
            opacity: Math.min(1, pop * 1.5),
          }}
        >
          2008
        </div>
        <Rise at={40} style={{fontSize: 58, fontWeight: 600, color: TEXT, marginTop: 10}}>
          The year the financial system almost broke.
        </Rise>
        <Rise at={84} style={{fontSize: 64, fontWeight: 800, color: AMBER, marginTop: 28}}>
          How did it happen?
        </Rise>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Scene 2: cheap money (270) ----------

const BOOM = [100, 108, 117, 128, 146, 168, 184];
const BUST = [184, 180, 160, 148, 145, 139, 134];
const FULL = [...BOOM, ...BUST.slice(1)];

const CheapMoneyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const rate = interpolate(frame, [30, 120], [6.5, 1], {...CLAMP, easing: Easing.out(Easing.quad)});
  const drawn = interpolate(frame, [110, 220], [0, 6], {...CLAMP, easing: Easing.inOut(Easing.quad)});
  const badge = usePop(222);
  return (
    <AbsoluteFill>
      <StepLabel text="STEP 1 · CHEAP MONEY" />
      <Rise
        at={14}
        style={{
          position: 'absolute',
          left: 96,
          top: 220,
          width: 560,
          height: 600,
          background: PANEL,
          border: `2px solid ${LINE}`,
          borderRadius: 24,
          padding: 48,
          boxSizing: 'border-box',
        }}
      >
        <div style={{fontSize: 34, color: MUTED, fontWeight: 600}}>Fed interest rate</div>
        <div style={{fontSize: 190, fontWeight: 900, color: AMBER, lineHeight: 1.15, marginTop: 30}}>
          {rate.toFixed(1)}
          <span style={{fontSize: 100}}>%</span>
        </div>
        <div style={{fontSize: 32, color: MUTED, marginTop: 6}}>2000 → 2003</div>
        <div style={{height: 2, background: LINE, margin: '36px 0'}} />
        <Rise at={125} style={{fontSize: 40, fontWeight: 700, color: TEXT, lineHeight: 1.3}}>
          Borrowing has rarely been this cheap.
        </Rise>
      </Rise>
      <div style={{position: 'absolute', left: 760, top: 220, opacity: ramp(frame, 90)}}>
        <div style={{fontSize: 34, color: MUTED, fontWeight: 600, marginLeft: 90, marginBottom: 14}}>
          US home prices (index, 2000 = 100)
        </div>
        <Chart values={BOOM} drawn={drawn} width={920} height={500} min={80} max={200} startYear={2000} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 1500,
          top: 330,
          padding: '10px 30px',
          background: AMBER,
          color: BG,
          fontSize: 76,
          fontWeight: 900,
          borderRadius: 16,
          transform: `scale(${badge})`,
        }}
      >
        +84%
      </div>
    </AbsoluteFill>
  );
};

// ---------- Scene 3: risky loans (270) ----------

const RiskyLoansScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const checks = ['Proof of income', 'Down payment', 'Good credit'];
  const share = Math.round(interpolate(frame, [170, 235], [8, 20], CLAMP));
  const houses = new Array(24).fill(0);
  return (
    <AbsoluteFill>
      <StepLabel text="STEP 2 · RISKY LOANS" />
      <div style={{position: 'absolute', left: 96, top: 230, width: 760}}>
        <Rise at={12} style={{fontSize: 38, color: MUTED, fontWeight: 600, marginBottom: 26}}>
          What lenders stopped asking for
        </Rise>
        {checks.map((c, i) => {
          const at = 28 + i * 26;
          const strike = interpolate(frame, [at + 14, at + 30], [0, 100], CLAMP);
          return (
            <Rise key={c} at={at} style={{marginBottom: 26}}>
              <div style={{position: 'relative', display: 'inline-block', fontSize: 64, fontWeight: 800, color: TEXT}}>
                {c}
                <div
                  style={{
                    position: 'absolute',
                    left: -8,
                    top: '54%',
                    height: 8,
                    width: `calc(${strike}% + ${strike > 0 ? 16 : 0}px)`,
                    background: RED,
                    borderRadius: 4,
                  }}
                />
              </div>
            </Rise>
          );
        })}
        <Rise at={160} style={{marginTop: 34, display: 'flex', alignItems: 'center', gap: 28}}>
          <div style={{fontSize: 150, fontWeight: 900, color: AMBER, lineHeight: 1, width: 300}}>{share}%</div>
          <div style={{fontSize: 34, color: TEXT, lineHeight: 1.3, fontWeight: 600}}>
            subprime share of
            <br />
            new mortgages
            <br />
            <span style={{color: MUTED}}>up from 8% in 2003</span>
          </div>
        </Rise>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 980,
          top: 220,
          width: 860,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 22,
        }}
      >
        {houses.map((_, i) => {
          const at = 40 + i * 5;
          const s = spring({frame: frame - at, fps, config: {damping: 12, stiffness: 160}});
          const tick = spring({frame: frame - at - 12, fps, config: {damping: 12, stiffness: 180}});
          return (
            <div key={i} style={{width: 124, height: 140, position: 'relative', transform: `scale(${s})`}}>
              <House size={124} color={AMBER} />
              <div
                style={{
                  position: 'absolute',
                  right: -4,
                  bottom: 6,
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  background: GREEN,
                  color: BG,
                  fontSize: 32,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${tick})`,
                }}
              >
                ✓
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Scene 4: securitisation (300) ----------

const SecuritisationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nodes = [
    {title: 'Home loans', sub: 'Thousands of mortgages'},
    {title: 'Investment banks', sub: 'Buy and bundle them'},
    {title: 'MBS and CDOs', sub: 'Sliced into securities'},
    {title: 'Global investors', sub: 'Pension funds, banks, insurers'},
  ];
  const W = 340;
  const GAP = 122;
  const X0 = 96;
  const TOP = 300;
  const H = 280;
  const stamp = spring({frame: frame - 170, fps, config: {damping: 11, stiffness: 200}});
  return (
    <AbsoluteFill>
      <StepLabel text="STEP 3 · PACKAGE AND SELL" />
      {nodes.map((nd, i) => {
        const at = 16 + i * 34;
        const s = spring({frame: frame - at, fps, config: {damping: 14, stiffness: 140}});
        return (
          <div
            key={nd.title}
            style={{
              position: 'absolute',
              left: X0 + i * (W + GAP),
              top: TOP,
              width: W,
              height: H,
              boxSizing: 'border-box',
              background: PANEL,
              border: `3px solid ${i === 2 ? AMBER : LINE}`,
              borderRadius: 24,
              padding: 30,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              opacity: Math.min(1, s * 1.4),
              transform: `scale(${0.8 + s * 0.2})`,
            }}
          >
            <div style={{display: 'flex', gap: 6, marginBottom: 18, height: 64, alignItems: 'center'}}>
              {i === 0 ? (
                [0, 1, 2].map((k) => <House key={k} size={60} color={AMBER} />)
              ) : i === 1 ? (
                <div style={{fontSize: 56, fontWeight: 900, color: AMBER}}>$$$</div>
              ) : i === 2 ? (
                [0, 1, 2].map((k) => (
                  <div key={k} style={{width: 150 - k * 34, height: 16, background: AMBER, opacity: 1 - k * 0.28, borderRadius: 4, position: 'absolute', top: 44 + k * 22}} />
                ))
              ) : (
                <div style={{width: 62, height: 62, borderRadius: 31, border: `6px solid ${AMBER}`, boxSizing: 'border-box'}} />
              )}
            </div>
            <div style={{fontSize: 42, fontWeight: 800, color: TEXT}}>{nd.title}</div>
            <div style={{fontSize: 27, color: MUTED, marginTop: 10, lineHeight: 1.25}}>{nd.sub}</div>
          </div>
        );
      })}
      {[0, 1, 2].map((i) => {
        const at = 40 + i * 34;
        const p = ramp(frame, at, 16);
        const left = X0 + W + i * (W + GAP) + 10;
        const len = GAP - 20;
        return (
          <div key={i} style={{position: 'absolute', left, top: TOP + H / 2 - 20, width: len, height: 40}}>
            <div style={{position: 'absolute', left: 0, top: 17, height: 6, width: (len - 14) * p, background: MUTED}} />
            <div
              style={{
                position: 'absolute',
                left: len - 22,
                top: 4,
                width: 0,
                height: 0,
                borderTop: '16px solid transparent',
                borderBottom: '16px solid transparent',
                borderLeft: `22px solid ${MUTED}`,
                opacity: p,
              }}
            />
            {[0, 1].map((k) => {
              const t = ((frame * 2.2 + k * (len / 2)) % len) / len;
              return (
                <div
                  key={k}
                  style={{
                    position: 'absolute',
                    left: t * (len - 30),
                    top: 11,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    background: AMBER,
                    opacity: p * Math.sin(t * Math.PI),
                  }}
                />
              );
            })}
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: X0 + 2 * (W + GAP) + 60,
          top: TOP - 70,
          padding: '2px 26px',
          border: `8px solid ${RED}`,
          borderRadius: 14,
          color: RED,
          fontSize: 96,
          fontWeight: 900,
          letterSpacing: 6,
          background: 'rgba(11,18,32,0.9)',
          opacity: Math.min(1, stamp * 2),
          transform: `rotate(-10deg) scale(${3 - 2 * stamp})`,
        }}
      >
        AAA
      </div>
      <Rise at={215} style={{position: 'absolute', left: 96, right: 96, top: 660, textAlign: 'center', fontSize: 52, fontWeight: 700, color: TEXT}}>
        The risk did not disappear. It was <span style={{color: AMBER}}>passed along, and hidden.</span>
      </Rise>
    </AbsoluteFill>
  );
};

// ---------- Scene 5: leverage (210) ----------

const LeverageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const blocks = new Array(31).fill(0);
  const hit = ramp(frame, 122, 14);
  const ratio = Math.round(interpolate(frame, [22, 84], [0, 30], CLAMP));
  const minus = usePop(112, 11);
  return (
    <AbsoluteFill>
      <StepLabel text="STEP 4 · BORROW BIG" />
      <div style={{position: 'absolute', left: 96, top: 210, display: 'flex', alignItems: 'baseline', gap: 30}}>
        <div style={{fontSize: 210, fontWeight: 900, color: TEXT, lineHeight: 1}}>
          {ratio}
          <span style={{color: MUTED, fontSize: 120}}> to </span>1
        </div>
        <Rise at={50} style={{fontSize: 40, color: MUTED, fontWeight: 600}}>
          borrowed dollars per dollar of the bank's own money
        </Rise>
      </div>
      <div style={{position: 'absolute', left: 96, top: 500, display: 'flex', gap: 8}}>
        {blocks.map((_, i) => {
          const s = spring({frame: frame - (20 + i * 2), fps, config: {damping: 13, stiffness: 180}});
          const own = i === 0;
          return (
            <div
              key={i}
              style={{
                width: 48,
                height: 150,
                borderRadius: 8,
                boxSizing: 'border-box',
                background: own ? (hit > 0 ? `rgba(239,79,79,${1 - hit * 0.85})` : AMBER) : '#3a4763',
                border: own ? `4px solid ${hit > 0 ? RED : AMBER}` : '4px solid transparent',
                transform: `scaleY(${s})`,
                transformOrigin: 'bottom',
              }}
            />
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 96, top: 670, fontSize: 30, fontWeight: 700, color: hit > 0 ? RED : AMBER, opacity: ramp(frame, 30)}}>
        {hit > 0.5 ? 'Own money: gone' : 'Own money'}
      </div>
      <div style={{position: 'absolute', left: 430, top: 670, fontSize: 30, fontWeight: 700, color: MUTED, opacity: ramp(frame, 60)}}>
        Borrowed money (still owed in full)
      </div>
      <div
        style={{
          position: 'absolute',
          left: 1480,
          top: 230,
          padding: '6px 30px',
          background: RED,
          color: TEXT,
          borderRadius: 16,
          fontSize: 110,
          fontWeight: 900,
          transform: `scale(${minus}) rotate(4deg)`,
        }}
      >
        −3%
      </div>
      <Rise at={132} style={{position: 'absolute', left: 96, top: 750, fontSize: 54, fontWeight: 800, color: TEXT}}>
        A 3% loss, and the bank's own money is <span style={{color: RED}}>wiped out.</span>
      </Rise>
    </AbsoluteFill>
  );
};

// ---------- Scene 6: the bust (240) ----------

const BustScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const drawn = interpolate(frame, [24, 130], [6, 12], {...CLAMP, easing: Easing.inOut(Easing.quad)});
  const badge = usePop(132);
  const toxic = spring({frame: frame - 150, fps, config: {damping: 11, stiffness: 200}});
  const houses = new Array(8).fill(0);
  return (
    <AbsoluteFill>
      <StepLabel text="STEP 5 · THE BUBBLE BURSTS" color={RED} />
      <div style={{position: 'absolute', left: 30, top: 220}}>
        <div style={{fontSize: 34, color: MUTED, fontWeight: 600, marginLeft: 90, marginBottom: 14}}>
          US home prices (index, 2000 = 100)
        </div>
        <Chart values={FULL} drawn={drawn} split={6} width={980} height={500} min={80} max={200} startYear={2000} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 880,
          top: 300,
          padding: '10px 30px',
          background: RED,
          color: TEXT,
          fontSize: 76,
          fontWeight: 900,
          borderRadius: 16,
          transform: `scale(${badge})`,
        }}
      >
        −27%
      </div>
      <div style={{position: 'absolute', left: 1200, top: 250, width: 640}}>
        <Rise at={20} style={{fontSize: 38, color: MUTED, fontWeight: 600, marginBottom: 24}}>
          Payments reset. Borrowers default.
        </Rise>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 20}}>
          {houses.map((_, i) => {
            const flip = interpolate(frame, [40 + i * 11, 52 + i * 11], [0, 1], CLAMP);
            return (
              <div key={i} style={{transform: `rotate(${flip * (i % 2 ? 7 : -7)}deg) translateY(${flip * 8}px)`}}>
                <House size={140} color={flip > 0.5 ? RED : AMBER} />
              </div>
            );
          })}
        </div>
        <Rise at={70} style={{fontSize: 44, fontWeight: 900, letterSpacing: 6, color: RED, marginTop: 22}}>
          FORECLOSED
        </Rise>
        <div style={{position: 'relative', height: 150, marginTop: 30}}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 10,
              padding: '0 24px',
              border: `7px solid ${MUTED}`,
              borderRadius: 12,
              color: MUTED,
              fontSize: 80,
              fontWeight: 900,
              letterSpacing: 6,
              opacity: ramp(frame, 120) * (1 - Math.min(1, toxic) * 0.75),
            }}
          >
            AAA
          </div>
          <div
            style={{
              position: 'absolute',
              left: 150,
              top: 0,
              padding: '0 24px',
              border: `8px solid ${RED}`,
              borderRadius: 12,
              color: RED,
              background: 'rgba(11,18,32,0.92)',
              fontSize: 92,
              fontWeight: 900,
              letterSpacing: 6,
              opacity: Math.min(1, toxic * 2),
              transform: `rotate(-8deg) scale(${3 - 2 * toxic})`,
            }}
          >
            TOXIC
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Scene 7: panic (180) ----------

const PanicScene: React.FC = () => {
  const frame = useCurrentFrame();
  const dominoes = [
    {name: 'Bear Stearns', date: 'March: rescue sale'},
    {name: 'Fannie & Freddie', date: 'Sep 7: seized'},
    {name: 'Lehman Brothers', date: 'Sep 15: bankrupt'},
    {name: 'AIG', date: 'Sep 16: $85B rescue'},
    {name: 'WaMu', date: 'Sep 25: fails'},
  ];
  const FLOOR = 560;
  const DW = 96;
  const DH = 270;
  const X0 = 250;
  const STEP = 320;
  return (
    <AbsoluteFill>
      <StepLabel text="STEP 6 · PANIC" color={RED} />
      <div style={{position: 'absolute', left: 96, right: 96, top: FLOOR, height: 4, background: MUTED}} />
      {dominoes.map((d, i) => {
        const at = 22 + i * 16;
        const last = i === dominoes.length - 1;
        const angle = interpolate(frame, [at, at + 18], [0, last ? 90 : 62], {
          ...CLAMP,
          easing: Easing.in(Easing.quad),
        });
        const isLehman = i === 2;
        return (
          <React.Fragment key={d.name}>
            <div
              style={{
                position: 'absolute',
                left: X0 + i * STEP,
                top: FLOOR - DH,
                width: DW,
                height: DH,
                borderRadius: 12,
                background: isLehman ? RED : '#3a4763',
                border: `4px solid ${isLehman ? '#ff8a8a' : MUTED}`,
                boxSizing: 'border-box',
                transformOrigin: '100% 100%',
                transform: `rotate(${angle}deg)`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: X0 + i * STEP + DW / 2 - 150,
                top: FLOOR + 26,
                width: 300,
                textAlign: 'center',
                opacity: ramp(frame, 8 + i * 6),
              }}
            >
              <div style={{fontSize: 36, fontWeight: 800, color: isLehman ? RED : TEXT}}>{d.name}</div>
              <div style={{fontSize: 26, color: MUTED, marginTop: 6}}>{d.date}</div>
            </div>
          </React.Fragment>
        );
      })}
      <Rise at={84} style={{position: 'absolute', left: 96, right: 96, top: 720, textAlign: 'center', fontSize: 58, fontWeight: 800, color: TEXT}}>
        September 15, 2008: <span style={{color: RED}}>Lehman Brothers goes bankrupt</span>
      </Rise>
      <Rise at={104} style={{position: 'absolute', left: 96, right: 96, top: 810, textAlign: 'center', fontSize: 40, fontWeight: 600, color: MUTED}}>
        Banks stop lending to each other. Credit freezes.
      </Rise>
    </AbsoluteFill>
  );
};

// ---------- Scene 8: aftermath (180) ----------

const AftermathScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const stats = [
    {value: (p: number) => `$${Math.round(700 * p)}B`, label: 'US bank bailout', color: AMBER},
    {value: (p: number) => `${(8.7 * p).toFixed(1)}M`, label: 'US jobs lost', color: RED},
    {value: (p: number) => `−${Math.round(54 * p)}%`, label: 'Dow Jones, peak to trough', color: RED},
  ];
  const parts = ['Cheap debt', '+', 'Hidden risk', '+', 'Too much leverage', '=', '2008'];
  const out = interpolate(frame, [165, 180], [1, 0], CLAMP);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <StepLabel text="THE AFTERMATH" />
      <div style={{position: 'absolute', left: 96, right: 96, top: 220, display: 'flex', gap: 36}}>
        {stats.map((s, i) => {
          const at = 12 + i * 12;
          const pop = spring({frame: frame - at, fps, config: {damping: 14, stiffness: 140}});
          const p = interpolate(frame, [at, at + 36], [0, 1], {...CLAMP, easing: Easing.out(Easing.cubic)});
          return (
            <div
              key={s.label}
              style={{
                flex: 1,
                height: 320,
                background: PANEL,
                border: `2px solid ${LINE}`,
                borderRadius: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: Math.min(1, pop * 1.4),
                transform: `translateY(${(1 - pop) * 40}px)`,
              }}
            >
              <div style={{fontSize: 130, fontWeight: 900, color: s.color, lineHeight: 1.1}}>{s.value(p)}</div>
              <div style={{fontSize: 34, fontWeight: 600, color: MUTED, marginTop: 12}}>{s.label}</div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 96,
          right: 96,
          top: 640,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 26,
        }}
      >
        {parts.map((t, i) => {
          const pop = spring({frame: frame - (84 + i * 9), fps, config: {damping: 13, stiffness: 170}});
          const op = t === '+' || t === '=';
          const final = i === parts.length - 1;
          return (
            <div
              key={i}
              style={{
                fontSize: final ? 96 : op ? 64 : 56,
                fontWeight: 900,
                color: final ? RED : op ? MUTED : TEXT,
                opacity: Math.min(1, pop * 1.5),
                transform: `scale(${0.6 + pop * 0.4})`,
              }}
            >
              {t}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- composition ----------

const SCENE_COMPONENTS: React.FC[] = [
  HookScene,
  CheapMoneyScene,
  RiskyLoansScene,
  SecuritisationScene,
  LeverageScene,
  BustScene,
  PanicScene,
  AftermathScene,
];

export const CrisisBaseline: React.FC = () => {
  return (
    <AbsoluteFill style={{background: BG, fontFamily: FONT, color: TEXT}}>
      <Background />
      {SCENES.map((s, i) => {
        const Comp = SCENE_COMPONENTS[i];
        return (
          <Sequence key={s.from} from={s.from} durationInFrames={s.dur}>
            <Scene dur={s.dur}>
              <Comp />
            </Scene>
          </Sequence>
        );
      })}
      <Captions />
      <ProgressBar />
    </AbsoluteFill>
  );
};
