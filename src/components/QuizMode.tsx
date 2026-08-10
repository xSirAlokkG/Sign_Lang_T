import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Clock, Shuffle, Trophy, X, Zap } from 'lucide-react';
import { GUIDE_GESTURES, type GuideGesture } from '@/lib/gestureGuide';
import type { Classification } from '@/lib/gestures';
import { speak } from '@/lib/tts';

type Props = {
  current: Classification | null;
  onClose: () => void;
  onScore: (score: { gesture_name: string; correct: boolean; accuracy: number; time_ms: number }) => void;
};

const QUESTION_TIME_MS = 15000;

export default function QuizMode({ current, onClose, onScore }: Props) {
  const [questions] = useState<GuideGesture[]>(() => {
    const shuffled = [...GUIDE_GESTURES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
  });
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_MS);
  const [results, setResults] = useState<{ name: string; correct: boolean; accuracy: number }[]>([]);
  const lockTimer = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const questionStart = useRef(performance.now());

  const question = questions[qIndex];

  useEffect(() => {
    setLocked(false);
    setTimeLeft(QUESTION_TIME_MS);
    questionStart.current = performance.now();
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 100) {
          window.clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return t - 100;
      });
    }, 100);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [qIndex]);

  function handleTimeout() {
    setLocked(true);
    setResults((prev) => [...prev, { name: question.name, correct: false, accuracy: 0 }]);
    if (lockTimer.current) window.clearTimeout(lockTimer.current);
    lockTimer.current = window.setTimeout(() => nextQuestion(), 1500);
  }

  useEffect(() => {
    if (!current || locked) return;
    const correct = current.name === question.name;
    if (correct && current.confidence >= 0.55) {
      setLocked(true);
      const elapsed = performance.now() - questionStart.current;
      const acc = Math.min(1, current.confidence);
      setScore((s) => s + Math.round(100 * (1 - elapsed / QUESTION_TIME_MS) * 0.5 + 50));
      setAttempts((a) => a + 1);
      setResults((prev) => [...prev, { name: question.name, correct: true, accuracy: acc }]);
      onScore({ gesture_name: question.name, correct: true, accuracy: acc, time_ms: Math.round(elapsed) });
      speak('Correct', { rate: 1, pitch: 1, voiceURI: null, lang: 'en-US' });
      if (timerRef.current) window.clearInterval(timerRef.current);
      lockTimer.current = window.setTimeout(() => nextQuestion(), 1200);
    }
  }, [current, locked, question]);

  function nextQuestion() {
    if (qIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setQIndex((i) => i + 1);
    }
  }

  function skipQuestion() {
    if (locked) return;
    setLocked(true);
    setResults((prev) => [...prev, { name: question.name, correct: false, accuracy: 0 }]);
    onScore({ gesture_name: question.name, correct: false, accuracy: 0, time_ms: QUESTION_TIME_MS });
    if (timerRef.current) window.clearInterval(timerRef.current);
    lockTimer.current = window.setTimeout(() => nextQuestion(), 800);
  }

  const timePct = useMemo(() => (timeLeft / QUESTION_TIME_MS) * 100, [timeLeft]);

  if (finished) {
    const correctCount = results.filter((r) => r.correct).length;
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
            <Trophy className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Quiz complete!</h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400">You scored {score} points with {correctCount}/{questions.length} correct.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {results.map((r, i) => (
              <span key={i} className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${r.correct ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'}`}>
                {r.correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </span>
            ))}
          </div>
          <button onClick={onClose} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white transition hover:bg-sky-700">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onClose} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
          <ArrowLeft className="h-4 w-4" /> Exit quiz
        </button>
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold text-slate-700 dark:text-slate-200">Score: {score}</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500 dark:text-slate-400">Q{qIndex + 1}/{questions.length}</span>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
            <Zap className="h-4 w-4" /> Show this sign
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white">{question.display}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{question.description}</p>
        </div>

        {/* Timer */}
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Time left</span>
            <span>{(timeLeft / 1000).toFixed(1)}s</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className={`h-full rounded-full transition-all ${timePct < 25 ? 'bg-red-500' : timePct < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${timePct}%` }} />
          </div>
        </div>

        {/* Detected */}
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Detected</div>
          <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
            {locked ? (results[results.length - 1]?.correct ? 'Correct!' : 'Time up or skipped') : (current ? current.name.replace(/_/g, ' ') : 'Waiting for your hand…')}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button onClick={skipQuestion} disabled={locked} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            <Shuffle className="h-4 w-4" /> Skip
          </button>
          {locked && <span className="text-sm text-emerald-600 dark:text-emerald-400">Moving to next…</span>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {results.map((r, i) => (
          <span key={i} className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${r.correct ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'}`}>
            {r.correct ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          </span>
        ))}
      </div>
    </div>
  );
}
