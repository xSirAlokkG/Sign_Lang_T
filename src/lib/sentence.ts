import type { Landmark } from './handLandmarker';
import type { Classification } from './gestures';

export type SentenceState = {
  words: string[];
  lastGesture: string | null;
  lastTime: number;
  stableStart: number | null;
  stableGesture: string | null;
  recent: Classification[];
  lockedGesture: string | null;
  phase: 'IDLE' | 'DETECTING' | 'STABLE' | 'CONFIRMED' | 'COOLDOWN';
};

export function createSentenceState(): SentenceState {
  return {
    words: [],
    lastGesture: null,
    lastTime: 0,
    stableStart: null,
    stableGesture: null,
    recent: [],
    lockedGesture: null,
    phase: 'IDLE',
  };
}

const STABLE_MS = 500;
const SMOOTH_WINDOW = 8;
const MIN_BUFFER = 5;
const MAJORITY_RATIO = 0.6;

export function addDetection(
  state: SentenceState,
  det: Classification | null,
  now: number,
  threshold: number,
): { state: SentenceState; added: string | null; smoothed: Classification | null } {
  if (state.lockedGesture) {
    if (det && det.name !== state.lockedGesture) {
      return {
        state: {
          ...state,
          lockedGesture: null,
          recent: [det],
          stableStart: null,
          stableGesture: null,
          lastGesture: det.name,
          lastTime: now,
          phase: 'DETECTING',
        },
        added: null,
        smoothed: det,
      };
    }
    return {
      state: { ...state, recent: [...state.recent, ...(det ? [det] : [])].slice(-SMOOTH_WINDOW), phase: 'COOLDOWN' },
      added: null,
      smoothed: { name: state.lockedGesture, confidence: threshold },
    };
  }

  const recent = [...state.recent, ...(det ? [det] : [])].slice(-SMOOTH_WINDOW);

  if (recent.length < MIN_BUFFER) {
    return { state: { ...state, recent, phase: 'DETECTING' }, added: null, smoothed: det };
  }

  const counts = new Map<string, { name: string; total: number; confSum: number }>();
  for (const item of recent) {
    const entry = counts.get(item.name) ?? { name: item.name, total: 0, confSum: 0 };
    entry.total += 1;
    entry.confSum += item.confidence;
    counts.set(item.name, entry);
  }
  let best: { name: string; total: number; confSum: number } | null = null;
  for (const entry of counts.values()) {
    if (!best || entry.total > best.total || (entry.total === best.total && entry.confSum > best.confSum)) best = entry;
  }
  const avgConf = best ? best.confSum / best.total : 0;
  const majorityRatio = best ? best.total / recent.length : 0;

  const smoothed: Classification | null =
    best && majorityRatio >= MAJORITY_RATIO && avgConf >= threshold
      ? { name: best.name, confidence: Math.min(1, avgConf) }
      : null;

  if (!smoothed || smoothed.confidence < threshold) {
    return { state: { ...state, recent, phase: 'DETECTING' }, added: null, smoothed: null };
  }

  if (smoothed.name === state.lastGesture) {
    if (state.stableStart === null) {
      return {
        state: { ...state, recent, stableStart: now, stableGesture: smoothed.name, lastTime: now, phase: 'STABLE' },
        added: null,
        smoothed,
      };
    }
    if (now - state.stableStart >= STABLE_MS && state.stableGesture === smoothed.name) {
      const word = smoothed.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const lastWord = state.words[state.words.length - 1];
      if (word === lastWord) {
        return {
          state: {
            ...state,
            lastTime: now,
            stableStart: null,
            stableGesture: null,
            recent: [],
            lockedGesture: smoothed.name,
            phase: 'CONFIRMED',
          },
          added: null,
          smoothed,
        };
      }
      return {
        state: {
          ...state,
          words: [...state.words, word],
          lastTime: now,
          stableStart: null,
          stableGesture: null,
          lastGesture: smoothed.name,
          recent: [],
          lockedGesture: smoothed.name,
          phase: 'CONFIRMED',
        },
        added: word,
        smoothed,
      };
    }
    return { state: { ...state, recent, lastTime: now, phase: 'STABLE' }, added: null, smoothed };
  }

  return {
    state: { ...state, recent, lastGesture: smoothed.name, stableStart: null, stableGesture: null, lastTime: now, phase: 'DETECTING' },
    added: null,
    smoothed,
  };
}

export function buildSentence(words: string[]): string {
  if (words.length === 0) return '';
  return words.join(' ');
}

export function clearSentence(state: SentenceState): SentenceState {
  return { ...createSentenceState(), words: [] };
}

export function undoLastWord(state: SentenceState): SentenceState {
  return { ...state, words: state.words.slice(0, -1) };
}

export type { Landmark };
