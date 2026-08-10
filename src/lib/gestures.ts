import type { Landmark } from './handLandmarker';

export type GestureLabel = {
  name: string;
  display: string;
  category: 'greeting' | 'response' | 'politeness' | 'courtesy' | 'emergency' | 'basic_need' | 'emotion' | 'command' | 'sentence';
};

export const GESTURE_LABELS: GestureLabel[] = [
  { name: 'HELLO', display: 'Hello', category: 'greeting' },
  { name: 'GOODBYE', display: 'Goodbye', category: 'greeting' },
  { name: 'YES', display: 'Yes', category: 'response' },
  { name: 'NO', display: 'No', category: 'response' },
  { name: 'PLEASE', display: 'Please', category: 'politeness' },
  { name: 'THANK_YOU', display: 'Thank You', category: 'courtesy' },
  { name: 'HELP', display: 'Help', category: 'emergency' },
  { name: 'WATER', display: 'Water', category: 'basic_need' },
  { name: 'EAT', display: 'Eat', category: 'basic_need' },
  { name: 'LOVE', display: 'Love', category: 'emotion' },
  { name: 'SAD', display: 'Sad', category: 'emotion' },
  { name: 'HAPPY', display: 'Happy', category: 'emotion' },
  { name: 'STOP', display: 'Stop', category: 'command' },
  { name: 'I', display: 'I', category: 'sentence' },
  { name: 'YOU', display: 'You', category: 'sentence' },
];

export const GESTURE_NAMES = GESTURE_LABELS.map((g) => g.name);

const FINGER_TIPS = [4, 8, 12, 16, 20];
const FINGER_PIPS = [3, 6, 10, 14, 18];
const FINGER_MCPS = [2, 5, 9, 13, 17];

function dist(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function fingerExtended(lm: Landmark[], tip: number, pip: number, mcp: number): boolean {
  return dist(lm[tip], lm[0]) > dist(lm[pip], lm[0]) && lm[tip].y < lm[mcp].y;
}

function fingerStates(lm: Landmark[]): boolean[] {
  return FINGER_TIPS.map((t, i) => fingerExtended(lm, t, FINGER_PIPS[i], FINGER_MCPS[i]));
}

function thumbExtended(lm: Landmark[]): boolean {
  return dist(lm[4], lm[0]) > dist(lm[3], lm[0]) && Math.abs(lm[4].x - lm[17].x) > Math.abs(lm[3].x - lm[17].x);
}

type StaticRule = {
  name: string;
  confidence: number;
  test: (lm: Landmark[], f: boolean[], thumb: boolean) => boolean;
};

const STATIC_RULES: StaticRule[] = [
  { name: 'LOVE', confidence: 0.88, test: (_lm, f, thumb) => thumb && f[1] && !f[2] && !f[3] && f[4] },
  { name: 'STOP', confidence: 0.87, test: (_lm, f, thumb) => !thumb && f[1] && f[2] && f[3] && f[4] },
  { name: 'WATER', confidence: 0.86, test: (lm, f, thumb) => thumb && f[1] && !f[2] && !f[3] && !f[4] && dist(lm[8], lm[12]) > 0.08 },
  { name: 'YES', confidence: 0.85, test: (_lm, f, thumb) => !thumb && !f[1] && !f[2] && !f[3] && !f[4] },
  { name: 'NO', confidence: 0.84, test: (_lm, f, thumb) => thumb && !f[1] && !f[2] && !f[3] && f[4] },
  { name: 'YOU', confidence: 0.85, test: (_lm, f, thumb) => !thumb && f[1] && !f[2] && !f[3] && !f[4] },
  { name: 'I', confidence: 0.82, test: (_lm, f, thumb) => thumb && !f[1] && !f[2] && !f[3] && !f[4] },
  { name: 'PLEASE', confidence: 0.83, test: (_lm, f, thumb) => thumb && f[1] && f[2] && f[3] && f[4] },
  { name: 'THANK_YOU', confidence: 0.84, test: (lm, f, thumb) => thumb && f[1] && f[2] && !f[3] && !f[4] && dist(lm[8], lm[12]) < 0.12 },
  { name: 'HELP', confidence: 0.82, test: (_lm, f, thumb) => !thumb && !f[1] && f[2] && f[3] && f[4] },
  { name: 'EAT', confidence: 0.83, test: (_lm, f, thumb) => !thumb && f[1] && f[2] && !f[3] && !f[4] },
  { name: 'HAPPY', confidence: 0.82, test: (_lm, f, thumb) => thumb && f[1] && !f[2] && !f[3] && f[4] },
  { name: 'SAD', confidence: 0.80, test: (_lm, f, thumb) => !thumb && !f[1] && !f[2] && f[3] && f[4] },
  { name: 'GOODBYE', confidence: 0.85, test: (_lm, f, thumb) => thumb && f[1] && f[2] && f[3] && f[4] },
  { name: 'HELLO', confidence: 0.86, test: (lm, f, thumb) => thumb && f[1] && f[2] && f[3] && f[4] && dist(lm[8], lm[12]) > 0.1 },
];

export type Classification = { name: string; confidence: number };

export function classifyGesture(lm: Landmark[]): Classification | null {
  const f = fingerStates(lm);
  const thumb = thumbExtended(lm);
  for (const rule of STATIC_RULES) {
    if (rule.test(lm, f, thumb)) return { name: rule.name, confidence: rule.confidence };
  }
  return null;
}

export function gestureDisplay(name: string): string {
  return GESTURE_LABELS.find((g) => g.name === name)?.display ?? name;
}
