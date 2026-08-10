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
  lockUntil: number;
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
    lockUntil: 0,
  };
}

const STABLE_MS = 500;
const GAP_MS = 1200;
const SMOOTH_WINDOW = 10;
const COOLDOWN_MS = 500;
const LOCK_MS = 1000;

export function addDetection(
  state: SentenceState,
  det: Classification | null,
  now: number,
  threshold: number,
): { state: SentenceState; added: string | null; smoothed: Classification | null } {
  if (now < state.lockUntil && state.lockedGesture) {
    const locked = { name: state.lockedGesture, confidence: threshold };
    return { state: { ...state, recent: [...state.recent, ...(det ? [det] : [])].slice(-SMOOTH_WINDOW) }, added: null, smoothed: locked };
  }

  const recent = [...state.recent, ...(det ? [det] : [])].slice(-SMOOTH_WINDOW);

  if (recent.length < 4) {
    return { state: { ...state, recent }, added: null, smoothed: det };
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
    best && majorityRatio >= 0.6 && avgConf >= threshold
      ? { name: best.name, confidence: Math.min(1, avgConf) }
      : null;

  if (!smoothed || smoothed.confidence < threshold) {
    if (state.lastGesture && now - state.lastTime > GAP_MS) {
      return {
        state: { ...state, recent: [], lastGesture: null, stableStart: null, stableGesture: null, lockedGesture: null, lockUntil: 0 },
        added: null,
        smoothed: null,
      };
    }
    return { state: { ...state, recent }, added: null, smoothed: null };
  }

  if (smoothed.name === state.lastGesture) {
    if (state.stableStart === null) {
      return {
        state: { ...state, recent, stableStart: now, stableGesture: smoothed.name, lastTime: now },
        added: null,
        smoothed,
      };
    }
    if (now - state.stableStart >= STABLE_MS && state.stableGesture === smoothed.name) {
      if (now - state.lastTime < COOLDOWN_MS) {
        return { state: { ...state, recent, lastTime: now }, added: null, smoothed };
      }
      const word = smoothed.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const newWords =
        state.words.length > 0 && state.words[state.words.length - 1].toLowerCase() === word.toLowerCase()
          ? state.words
          : [...state.words, word];
      return {
        state: {
          ...state,
          words: newWords,
          lastTime: now,
          stableStart: now + GAP_MS,
          stableGesture: null,
          lastGesture: smoothed.name,
          recent: [],
          lockedGesture: smoothed.name,
          lockUntil: now + LOCK_MS,
        },
        added: word,
        smoothed,
      };
    }
    return { state: { ...state, recent, lastTime: now }, added: null, smoothed };
  }

  return {
    state: { ...state, recent, lastGesture: smoothed.name, stableStart: null, stableGesture: null, lastTime: now, lockedGesture: null, lockUntil: 0 },
    added: null,
    smoothed,
  };
}

export function buildSentence(words: string[]): string {
  if (words.length === 0) return '';
  let s = words.join(' ');
  s = s.replace(/\b([A-Za-z]+)\s+\1\b/gi, '$1');
  let formatted = s.toLowerCase();
  if (formatted.length > 0) formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  if (!/[.!?]$/.test(formatted)) formatted += '.';
  return formatted;
}

export function clearSentence(state: SentenceState): SentenceState {
  return { ...createSentenceState(), words: [] };
}

export function undoLastWord(state: SentenceState): SentenceState {
  return { ...state, words: state.words.slice(0, -1) };
}

export type { Landmark };
