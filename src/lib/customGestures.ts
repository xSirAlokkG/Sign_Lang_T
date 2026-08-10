import { supabase } from '@/lib/supabase';
import type { Landmark } from '@/lib/handLandmarker';
import { classifyGesture, type Classification } from '@/lib/gestures';

export type FingerState = 'extended' | 'folded' | 'any';

export type CustomGestureRule = {
  id: string;
  label: string;
  name: string;
  thumb: FingerState;
  index: FingerState;
  middle: FingerState;
  ring: FingerState;
  pinky: FingerState;
  fingers_spread: boolean;
  confidence: number;
  created_at: string;
  updated_at: string;
};

export type NewRule = {
  label: string;
  name: string;
  thumb: FingerState;
  index: FingerState;
  middle: FingerState;
  ring: FingerState;
  pinky: FingerState;
  fingers_spread: boolean;
  confidence: number;
};

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

function matchesState(extended: boolean, state: FingerState): boolean {
  if (state === 'any') return true;
  if (state === 'extended') return extended;
  return !extended;
}

function checkSpread(lm: Landmark[], f: boolean[]): boolean {
  const extendedTips: number[] = [];
  for (let i = 1; i < 5; i++) {
    if (f[i]) extendedTips.push(FINGER_TIPS[i]);
  }
  if (extendedTips.length < 2) return true;
  for (let i = 0; i < extendedTips.length - 1; i++) {
    if (dist(lm[extendedTips[i]], lm[extendedTips[i + 1]]) < 0.06) return false;
  }
  return true;
}

export function classifyWithCustomRules(lm: Landmark[], rules: CustomGestureRule[]): Classification | null {
  const f = fingerStates(lm);
  const thumb = thumbExtended(lm);
  const states = [thumb, f[1], f[2], f[3], f[4]];
  const keys: (keyof CustomGestureRule)[] = ['thumb', 'index', 'middle', 'ring', 'pinky'];

  for (const rule of rules) {
    let match = true;
    for (let i = 0; i < 5; i++) {
      if (!matchesState(states[i], rule[keys[i]] as FingerState)) {
        match = false;
        break;
      }
    }
    if (match && rule.fingers_spread && !checkSpread(lm, f)) match = false;
    if (match) return { name: rule.name, confidence: rule.confidence };
  }
  return null;
}

export function classifyWithCustom(lm: Landmark[], rules: CustomGestureRule[]): Classification | null {
  const custom = classifyWithCustomRules(lm, rules);
  if (custom) return custom;
  return classifyGesture(lm);
}

export async function fetchRules(): Promise<CustomGestureRule[]> {
  const { data, error } = await supabase
    .from('custom_gesture_rules')
    .select('*')
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as CustomGestureRule[];
}

export async function createRule(rule: NewRule): Promise<CustomGestureRule | null> {
  const { data, error } = await supabase
    .from('custom_gesture_rules')
    .insert(rule)
    .select()
    .single();
  if (error || !data) return null;
  return data as CustomGestureRule;
}

export async function updateRule(id: string, rule: NewRule): Promise<CustomGestureRule | null> {
  const { data, error } = await supabase
    .from('custom_gesture_rules')
    .update({ ...rule, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error || !data) return null;
  return data as CustomGestureRule;
}

export async function deleteRule(id: string): Promise<boolean> {
  const { error } = await supabase.from('custom_gesture_rules').delete().eq('id', id);
  return !error;
}

export function labelToName(label: string): string {
  return label.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
}
