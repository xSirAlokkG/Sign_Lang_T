import type { Landmark } from './handLandmarker';

type FingerState = 'extended' | 'folded';

function dist(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function fingerExtended(lm: Landmark[], tip: number, pip: number, mcp: number): boolean {
  return dist(lm[tip], lm[0]) > dist(lm[pip], lm[0]) && lm[tip].y < lm[mcp].y;
}

function thumbExtended(lm: Landmark[]): boolean {
  return dist(lm[4], lm[0]) > dist(lm[3], lm[0]) && Math.abs(lm[4].x - lm[17].x) > Math.abs(lm[3].x - lm[17].x);
}

function getFingerStates(lm: Landmark[]): { thumb: boolean; index: boolean; middle: boolean; ring: boolean; pinky: boolean } {
  return {
    thumb: thumbExtended(lm),
    index: fingerExtended(lm, 8, 6, 5),
    middle: fingerExtended(lm, 12, 10, 9),
    ring: fingerExtended(lm, 16, 14, 13),
    pinky: fingerExtended(lm, 20, 18, 17),
  };
}

function inferFingerStates(lm: Landmark[]): Record<string, FingerState> {
  const fs = getFingerStates(lm);
  return {
    thumb: fs.thumb ? 'extended' : 'folded',
    index: fs.index ? 'extended' : 'folded',
    middle: fs.middle ? 'extended' : 'folded',
    ring: fs.ring ? 'extended' : 'folded',
    pinky: fs.pinky ? 'extended' : 'folded',
  };
}

const FINGER_LABELS: Record<string, string> = {
  thumb: 'Thumb',
  index: 'Index finger',
  middle: 'Middle finger',
  ring: 'Ring finger',
  pinky: 'Pinky',
};

const TARGET_STATES: Record<string, Record<string, FingerState>> = {
  GOODBYE: { thumb: 'extended', index: 'extended', middle: 'extended', ring: 'extended', pinky: 'extended' },
  NO: { thumb: 'extended', index: 'folded', middle: 'folded', ring: 'folded', pinky: 'extended' },
  PLEASE: { thumb: 'extended', index: 'extended', middle: 'extended', ring: 'extended', pinky: 'folded' },
  THANK_YOU: { thumb: 'extended', index: 'extended', middle: 'extended', ring: 'folded', pinky: 'folded' },
  WATER: { thumb: 'extended', index: 'extended', middle: 'extended', ring: 'folded', pinky: 'folded' },
  EAT: { thumb: 'folded', index: 'extended', middle: 'extended', ring: 'folded', pinky: 'folded' },
  SAD: { thumb: 'folded', index: 'folded', middle: 'folded', ring: 'extended', pinky: 'extended' },
  HAPPY: { thumb: 'extended', index: 'extended', middle: 'folded', ring: 'folded', pinky: 'extended' },
  I: { thumb: 'extended', index: 'folded', middle: 'folded', ring: 'folded', pinky: 'folded' },
  YOU: { thumb: 'folded', index: 'extended', middle: 'folded', ring: 'folded', pinky: 'folded' },
};

export type CoachFeedback = {
  hints: string[];
  correctCount: number;
  totalCount: number;
  accuracy: number;
  fingerResults: { finger: string; label: string; correct: boolean; expected: string; actual: string }[];
};

export function evaluateHand(
  landmarks: Landmark[] | undefined,
  targetGestureName: string,
): CoachFeedback | null {
  if (!landmarks || landmarks.length < 21) return null;
  const target = TARGET_STATES[targetGestureName];
  if (!target) return null;

  const actual = inferFingerStates(landmarks);
  const hints: string[] = [];
  const fingerResults: CoachFeedback['fingerResults'] = [];
  let correctCount = 0;
  let totalCount = 0;

  for (const [finger, expectedState] of Object.entries(target)) {
    totalCount++;
    const actualState = actual[finger];
    const correct = actualState === expectedState;
    if (correct) correctCount++;
    fingerResults.push({ finger, label: FINGER_LABELS[finger], correct, expected: expectedState, actual: actualState });
    if (!correct) {
      if (expectedState === 'extended') hints.push(`Extend your ${FINGER_LABELS[finger].toLowerCase()}.`);
      else hints.push(`Fold your ${FINGER_LABELS[finger].toLowerCase()}.`);
    }
  }

  const handWidth = dist(landmarks[0], landmarks[9]);
  if (handWidth > 0.35) hints.push('Move your hand farther from the camera.');
  else if (handWidth < 0.06) hints.push('Move your hand closer to the camera.');

  const zValues = landmarks.map((l) => l.z);
  const zRange = Math.max(...zValues) - Math.min(...zValues);
  if (zRange > 0.15) hints.push('Keep your hand steady.');

  const accuracy = totalCount > 0 ? correctCount / totalCount : 0;
  return { hints: hints.slice(0, 4), correctCount, totalCount, accuracy, fingerResults };
}
