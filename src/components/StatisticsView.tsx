import { useEffect, useMemo, useState } from 'react';
import { Award, BarChart3, Calendar, CheckCircle2, Clock, Flame, Target, TrendingUp } from 'lucide-react';
import { useProgress, useQuizScores } from '@/lib/useProgress';
import { GUIDE_GESTURES } from '@/lib/gestureGuide';
import type { QuizScore } from '@/lib/useProgress';

export default function StatisticsView() {
  const { progress, loading } = useProgress();
  const { scores } = useQuizScores();
  const [streak, setStreak] = useState(0);

  const progressList = Object.values(progress);

  const stats = useMemo(() => {
    const completed = progressList.filter((p) => p.status === 'completed');
    const completionPct = GUIDE_GESTURES.length > 0 ? Math.round((completed.length / GUIDE_GESTURES.length) * 100) : 0;
    const totalPracticeMs = progressList.reduce((sum, p) => sum + (p.practice_time_ms ?? 0), 0);
    const avgAccuracy = completed.length > 0 ? completed.reduce((sum, p) => sum + p.accuracy, 0) / completed.length : 0;

    // Most difficult (lowest accuracy among completed)
    const sortedByAccuracy = [...completed].sort((a, b) => a.accuracy - b.accuracy);
    const mostDifficult = sortedByAccuracy.slice(0, 3);

    // Fastest recognized (highest accuracy)
    const fastest = [...completed].sort((a, b) => b.accuracy - a.accuracy).slice(0, 3);

    // Quiz stats
    const quizCorrect = scores.filter((s) => s.correct).length;
    const quizAvgAccuracy = scores.length > 0 ? scores.reduce((sum, s) => sum + s.accuracy, 0) / scores.length : 0;

    return {
      completedCount: completed.length,
      completionPct,
      totalPracticeMs,
      avgAccuracy,
      mostDifficult,
      fastest,
      quizCorrect,
      quizTotal: scores.length,
      quizAvgAccuracy,
    };
  }, [progressList, scores]);

  // Daily streak calculation
  useEffect(() => {
    const days = new Set<string>();
    progressList.forEach((p) => {
      const d = new Date(p.updated_at);
      days.add(d.toDateString());
    });
    scores.forEach((s: QuizScore) => {
      const d = new Date(s.created_at);
      days.add(d.toDateString());
    });
    let streakCount = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const check = new Date(today);
      check.setDate(check.getDate() - i);
      if (days.has(check.toDateString())) streakCount++;
      else if (i > 0) break;
    }
    setStreak(streakCount);
  }, [progressList, scores]);

  if (loading) return <div className="py-16 text-center text-sm text-slate-400">Loading statistics…</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Statistics</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Track your learning progress, accuracy, and quiz performance.</p>

      {/* Top stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-wide">Completed</span></div>
          <div className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{stats.completedCount}<span className="text-lg text-slate-400">/{GUIDE_GESTURES.length}</span></div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stats.completionPct}% complete</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400"><Flame className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-wide">Daily Streak</span></div>
          <div className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{streak}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">days in a row</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400"><Target className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-wide">Avg Accuracy</span></div>
          <div className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{(stats.avgAccuracy * 100).toFixed(0)}%</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">across completed signs</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400"><Clock className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-wide">Practice Time</span></div>
          <div className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{(stats.totalPracticeMs / 1000 / 60).toFixed(1)}m</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">total practice</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><BarChart3 className="h-4 w-4" /> Completion</div>
        <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-teal-500 transition-all" style={{ width: `${stats.completionPct}%` }} />
        </div>
        <div className="mt-1 text-right text-xs font-semibold text-sky-600 dark:text-sky-400">{stats.completionPct}%</div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Most difficult */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><TrendingUp className="h-4 w-4 rotate-180" /> Most Difficult</div>
          {stats.mostDifficult.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Complete some lessons to see data.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {stats.mostDifficult.map((p) => (
                <div key={p.gesture_name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{p.gesture_name.replace(/_/g, ' ')}</span>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{(p.accuracy * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fastest */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><TrendingUp className="h-4 w-4" /> Fastest Recognized</div>
          {stats.fastest.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Complete some lessons to see data.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {stats.fastest.map((p) => (
                <div key={p.gesture_name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{p.gesture_name.replace(/_/g, ' ')}</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{(p.accuracy * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quiz stats */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><Award className="h-4 w-4" /> Quiz Performance</div>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <div><div className="text-2xl font-bold text-slate-950 dark:text-white">{stats.quizCorrect}</div><div className="text-xs text-slate-500 dark:text-slate-400">correct</div></div>
          <div><div className="text-2xl font-bold text-slate-950 dark:text-white">{stats.quizTotal}</div><div className="text-xs text-slate-500 dark:text-slate-400">total</div></div>
          <div><div className="text-2xl font-bold text-slate-950 dark:text-white">{(stats.quizAvgAccuracy * 100).toFixed(0)}%</div><div className="text-xs text-slate-500 dark:text-slate-400">avg accuracy</div></div>
        </div>
      </div>
    </div>
  );
}
