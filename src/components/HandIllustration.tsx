type FingerState = 'extended' | 'folded' | 'curled' | 'together';

type Props = {
  gestureName: string;
  size?: 'sm' | 'md' | 'lg';
};

const GESTURE_SHAPES: Record<string, { thumb: FingerState; index: FingerState; middle: FingerState; ring: FingerState; pinky: FingerState; label: string }> = {
  HELLO: { thumb: 'extended', index: 'extended', middle: 'extended', ring: 'extended', pinky: 'extended', label: 'Open hand, wave' },
  GOODBYE: { thumb: 'extended', index: 'extended', middle: 'extended', ring: 'extended', pinky: 'extended', label: 'Open hand, wave' },
  YES: { thumb: 'folded', index: 'folded', middle: 'folded', ring: 'folded', pinky: 'folded', label: 'Fist, nod' },
  NO: { thumb: 'extended', index: 'folded', middle: 'folded', ring: 'folded', pinky: 'extended', label: 'Thumb + pinky' },
  PLEASE: { thumb: 'extended', index: 'extended', middle: 'extended', ring: 'extended', pinky: 'extended', label: 'Flat hand, circle' },
  THANK_YOU: { thumb: 'extended', index: 'extended', middle: 'extended', ring: 'folded', pinky: 'folded', label: 'Chin forward' },
  HELP: { thumb: 'folded', index: 'folded', middle: 'extended', ring: 'extended', pinky: 'extended', label: 'Fist on palm' },
  WATER: { thumb: 'extended', index: 'extended', middle: 'extended', ring: 'folded', pinky: 'folded', label: 'W shape, chin' },
  EAT: { thumb: 'folded', index: 'extended', middle: 'extended', ring: 'folded', pinky: 'folded', label: 'Fingertips to mouth' },
  LOVE: { thumb: 'extended', index: 'extended', middle: 'folded', ring: 'folded', pinky: 'extended', label: 'I-L-Y shape' },
  SAD: { thumb: 'folded', index: 'folded', middle: 'folded', ring: 'extended', pinky: 'extended', label: 'Slide down face' },
  HAPPY: { thumb: 'extended', index: 'extended', middle: 'folded', ring: 'folded', pinky: 'extended', label: 'I-L-Y shape' },
  STOP: { thumb: 'folded', index: 'extended', middle: 'extended', ring: 'extended', pinky: 'extended', label: 'Open palm forward' },
  I: { thumb: 'extended', index: 'folded', middle: 'folded', ring: 'folded', pinky: 'folded', label: 'Thumb to self' },
  YOU: { thumb: 'folded', index: 'extended', middle: 'folded', ring: 'folded', pinky: 'folded', label: 'Index points out' },
};

function Finger({ state, x, baseY, length, isThumb }: { state: FingerState; x: number; baseY: number; length: number; isThumb?: boolean }) {
  if (state === 'folded' || state === 'curled') {
    return (
      <g>
        <circle cx={x} cy={baseY - 4} r={5} fill="#fbbf24" stroke="#d97706" strokeWidth={1.5} />
        <circle cx={x} cy={baseY + 2} r={4} fill="#fcd34d" stroke="#d97706" strokeWidth={1} opacity={0.6} />
      </g>
    );
  }
  const tipY = baseY - length;
  const midY = baseY - length * 0.55;
  const path = isThumb
    ? `M ${x} ${baseY} Q ${x - 3} ${midY} ${x} ${tipY}`
    : `M ${x} ${baseY} Q ${x - 2} ${midY} ${x} ${tipY}`;
  return (
    <g>
      <path d={path} stroke="#fbbf24" strokeWidth={isThumb ? 7 : 6} strokeLinecap="round" fill="none" />
      <circle cx={x} cy={tipY} r={4} fill="#fcd34d" stroke="#d97706" strokeWidth={1.5} />
    </g>
  );
}

export default function HandIllustration({ gestureName, size = 'md' }: Props) {
  const shape = GESTURE_SHAPES[gestureName];
  const dim = size === 'lg' ? 200 : size === 'sm' ? 100 : 140;
  const palmW = 36;
  const palmH = 42;
  const palmX = 50;
  const palmY = 70;
  const fingerLen = size === 'lg' ? 52 : size === 'sm' ? 28 : 38;
  const thumbLen = fingerLen * 0.7;

  if (!shape) {
    return (
      <div className="flex items-center justify-center" style={{ height: dim }}>
        <span className="text-xs text-slate-400">No illustration</span>
      </div>
    );
  }

  const fingerX = [palmX - 14, palmX - 5, palmX + 4, palmX + 13, palmX + 20];
  const fingerStates = [shape.thumb, shape.index, shape.middle, shape.ring, shape.pinky];
  const fingerLens = [thumbLen, fingerLen, fingerLen * 1.05, fingerLen * 0.95, fingerLen * 0.8];

  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: dim }}>
      <svg viewBox="0 0 100 100" width={dim} height={dim} className="drop-shadow-sm">
        {/* Palm */}
        <ellipse cx={palmX} cy={palmY} rx={palmW / 2} ry={palmH / 2} fill="#fbbf24" stroke="#d97706" strokeWidth={2} />
        {/* Wrist */}
        <rect x={palmX - 12} y={palmY + 16} width={24} height={14} rx={6} fill="#fbbf24" stroke="#d97706" strokeWidth={2} />
        {/* Fingers */}
        {fingerStates.map((fs, i) => (
          <Finger
            key={i}
            state={fs}
            x={fingerX[i]}
            baseY={palmY - palmH / 2 + 4}
            length={fingerLens[i]}
            isThumb={i === 0}
          />
        ))}
      </svg>
      <span className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">{shape.label}</span>
    </div>
  );
}
