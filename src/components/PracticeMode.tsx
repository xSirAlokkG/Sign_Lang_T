import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, RotateCcw, Trophy, X, Zap } from 'lucide-react';
import type { GuideGesture } from '@/lib/gestureGuide';
import { GUIDE_GESTURES } from '@/lib/gestureGuide';
import type { Classification } from '@/lib/gestures';
import { evaluateHand, type CoachFeedback } from '@/lib/coach';
import { speak } from '@/lib/tts';
import type { HandResult } from '@/lib/handLandmarker';

type Props = {
  target: GuideGesture;
  current: Classification | null;
  hands: HandResult[];
  onClose: () => void;
  onNext: (gesture: GuideGesture) => void;
  onPrev: () => void;
  index: number;
  total: number;
  onCompleted: (gestureName: string, accuracy: number) => void;
  onPracticeTime: (gestureName: string, ms: number) => void;
};

const HOLD_MS = 900;
const PASS_THRESHOLD = 0.6;

export default function PracticeMode({
  target,
  current,
  hands,
  onClose,
  onNext,
  onPrev,
  index,
  total,
  onCompleted,
  onPracticeTime,
}: Props) {
  const [attempts, setAttempts] = useState<{ name: string; correct: boolean; confidence: number }[]>([]);
  const [locked, setLocked] = useState(false);
  const [passed, setPassed] = useState(false);
  const [coach, setCoach] = useState<CoachFeedback | null>(null);
  const lockTimer = useRef<number | null>(null);
  const startTime = useRef(performance.now());

  const accuracy = useMemo(() => {
    if (attempts.length === 0) return 0;
    return Math.round((attempts.filter((a) => a.correct).length / attempts.length) * 100);
  }, [attempts]);

  useEffect(() => {
    setAttempts([]);
    setLocked(false);
    setPassed(false);
    setCoach(null);
    startTime.current = performance.now();
    if (lockTimer.current) window.clearTimeout(lockTimer.current);
  }, [target.name]);

  useEffect(() => {
    const primaryHand = hands[0];
    if (primaryHand) {
      const feedback = evaluateHand(primaryHand.landmarks, target.name);
      setCoach(feedback);
    } else {
      setCoach(null);
    }

    if (!current || locked || passed) return;
    const correct = current.name === target.name;
    setAttempts((prev) => [...prev.slice(-9), { name: current.name, correct, confidence: current.confidence }]);
    if (correct && current.confidence >= PASS_THRESHOLD) {
      setLocked(true);
      lockTimer.current = window.setTimeout(() => {
        setPassed(true);
        onPracticeTime(target.name, performance.now() - startTime.current);
        onCompleted(target.name, current.confidence);
        speak('Nice work', { rate: 1, pitch: 1, voiceURI: null, lang: 'en-US' });
      }, HOLD_MS);
    }
    return () => {
      if (lockTimer.current) window.clearTimeout(lockTimer.current);
    };
  }, [current, target, locked, passed, hands, onCompleted, onPracticeTime]);

  const nextGesture = useMemo(() => {
    const idx = GUIDE_GESTURES.findIndex((g) => g.name === target.name);
    return GUIDE_GESTURES[(idx + 1) % GUIDE_GESTURES.length];
  }, [target.name]);

  const isMatch = current?.name === target.name;
  const overlayColor = coach ? (coach.accuracy > 0.7 ? '#10b981' : coach.accuracy > 0.4 ? '#f59e0b' : '#ef4444') : '#38bdf8';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-950 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">AI Practice Coach</div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">{target.display}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{target.description}</p>
          </div>
          <button onClick={onClose} aria-label="Exit practice" className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Hand</div>
            <div className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{target.hand}</div>
            <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Palm</div>
            <div className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{target.palm}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fingers</div>
            <div className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{target.fingers}</div>
            <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Movement</div>
            <div className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{target.motion}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Steps</div>
            <ol className="mt-1 list-inside list-decimal space-y-0.5 text-xs text-slate-700 dark:text-slate-300">
              {target.steps.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>
        </div>

        {/* AI Coach feedback */}
        {coach && coach.hints.length > 0 && !passed && (
          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950/30">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-sky-300">
              <Zap className="h-4 w-4" /> Live coaching
            </div>
            <div className="space-y-1">
              {coach.hints.map((hint, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-sky-900 dark:text-sky-100">
                  <span className="mt-0.5 text-sky-500">→</span> {hint}
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {coach.fingerResults.map((fr) => (
                <span key={fr.finger} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${fr.correct ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'}`}>
                  {fr.correct ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {fr.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          {passed ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"><Trophy className="h-7 w-7" /></div>
              <div>
                <div className="text-lg font-bold text-slate-950 dark:text-white">Great job!</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">You held {target.display} for {HOLD_MS / 1000} second.</div>
              </div>
              <button onClick={() => onNext(nextGesture)} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">Next sign <ChevronRight className="h-4 w-4" /></button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${isMatch ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {isMatch ? <Check className="h-6 w-6" /> : '?'}
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Detected</div>
                    <div className="text-base font-semibold text-slate-950 dark:text-white">{current ? current.name.replace(/_/g, ' ') : 'Waiting for hand'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Accuracy</div>
                  <div className={`text-2xl font-bold ${accuracy >= 70 ? 'text-emerald-600 dark:text-emerald-400' : accuracy >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>{accuracy}%</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Hold the sign for {HOLD_MS / 1000}s to pass</span>
                  <span>{index + 1} / {total}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full rounded-full transition-all ${isMatch ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} style={{ width: locked ? '100%' : isMatch ? '50%' : '8%' }} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {attempts.slice(-10).map((attempt, i) => (
                  <span key={i} className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${attempt.correct ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'}`}>
                    {attempt.correct ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  </span>
                ))}
                {attempts.length === 0 && <span className="text-xs text-slate-400">Show the sign to the camera to begin.</span>}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button onClick={onPrev} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><ChevronLeft className="h-4 w-4" /> Previous</button>
                <button onClick={() => { setAttempts([]); setLocked(false); setPassed(false); startTime.current = performance.now(); }} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200"><RotateCcw className="h-3.5 w-3.5" /> Reset</button>
                <button onClick={() => onNext(nextGesture)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Skip <ChevronRight className="h-4 w-4" /></button>
              </div>
            </>
          )}
        </div>

        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <span className="font-semibold">Tip:</span> {target.tips.join(' ')}
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Overlay color: <span style={{ color: overlayColor }}>●</span> {coach ? (coach.accuracy > 0.7 ? 'green = correct' : coach.accuracy > 0.4 ? 'yellow = close' : 'red = incorrect') : ''}
        </div>
      </div>
    </div>
  );
}
