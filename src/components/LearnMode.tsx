import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Clock, Play, Search, Shuffle, Star, Trophy, X } from 'lucide-react';
import { GUIDE_GESTURES, type GuideCategory, type GuideGesture } from '@/lib/gestureGuide';
import type { Classification } from '@/lib/gestures';
import { speak } from '@/lib/tts';
import HandIllustration from '@/components/HandIllustration';

type Props = {
  initialGesture: GuideGesture | null;
  current: Classification | null;
  onClose: () => void;
  onPractice: (g: GuideGesture) => void;
  bookmarks: Set<string>;
  onToggleBookmark: (n: string) => void;
  progress: Record<string, { status: string; accuracy: number }>;
};

export default function LearnMode({ initialGesture, current, onClose, onPractice, bookmarks, onToggleBookmark, progress }: Props) {
  const [selected, setSelected] = useState<GuideGesture | null>(initialGesture);
  const [category, setCategory] = useState<GuideCategory | 'All'>('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (initialGesture) setSelected(initialGesture);
  }, [initialGesture]);

  const filtered = useMemo(() => GUIDE_GESTURES.filter((g) => {
    const matchCat = category === 'All' || g.category === category;
    const needle = query.trim().toLowerCase();
    return matchCat && (!needle || `${g.display} ${g.description} ${g.category}`.toLowerCase().includes(needle));
  }), [category, query]);

  const categories: (GuideCategory | 'All')[] = ['All', 'Greetings', 'Common Words', 'Politeness', 'Emergency', 'Basic Needs', 'Emotions', 'Sentence'];

  const completedCount = Object.values(progress).filter((p) => p.status === 'completed').length;
  const totalCount = GUIDE_GESTURES.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  if (selected) {
    const idx = GUIDE_GESTURES.findIndex((g) => g.name === selected.name);
    const prev = GUIDE_GESTURES[(idx - 1 + GUIDE_GESTURES.length) % GUIDE_GESTURES.length];
    const next = GUIDE_GESTURES[(idx + 1) % GUIDE_GESTURES.length];
    const isBookmarked = bookmarks.has(selected.name);
    const prog = progress[selected.name];

    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <button onClick={() => setSelected(null)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800 dark:hover:text-slate-200">
          <ArrowLeft className="h-4 w-4" /> Back to lessons
        </button>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">{selected.category}</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{selected.display}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{selected.description}</p>
            </div>
            <button onClick={() => onToggleBookmark(selected.name)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800">
              <Star className={`h-5 w-5 ${isBookmarked ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>
          </div>

          {/* Hand illustration */}
          <div className="mt-5 flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 via-white to-sky-50 dark:from-amber-950/30 dark:via-slate-800 dark:to-sky-950/30">
            <HandIllustration gestureName={selected.name} size="lg" />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Step by step</div>
              <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-700 dark:text-slate-300">
                {selected.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Details</div>
                <div className="mt-1 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  <div><span className="font-semibold">Hand:</span> {selected.hand}</div>
                  <div><span className="font-semibold">Palm:</span> {selected.palm}</div>
                  <div><span className="font-semibold">Fingers:</span> {selected.fingers}</div>
                  <div><span className="font-semibold">Motion:</span> {selected.motion}</div>
                  <div><span className="font-semibold">Type:</span> {selected.type}</div>
                  <div><span className="font-semibold">Difficulty:</span> {selected.difficulty}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <span className="font-semibold">Common mistakes:</span> {selected.mistakes.join(' ')}
          </div>
          <div className="mt-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
            <span className="font-semibold">Tips:</span> {selected.tips.join(' ')}
          </div>

          {prog && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              {prog.status === 'completed' ? <><Check className="h-4 w-4 text-emerald-500" /> Completed</> : <><Clock className="h-4 w-4" /> In progress</>}
              {prog.accuracy > 0 && <span>· Best accuracy: {(prog.accuracy * 100).toFixed(0)}%</span>}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button onClick={() => onPractice(selected)} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700">
              <Play className="h-4 w-4" /> Practice this sign
            </button>
            <button onClick={() => setSelected(prev)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button onClick={() => setSelected(next)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Next <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={() => setSelected(GUIDE_GESTURES[Math.floor(Math.random() * GUIDE_GESTURES.length)])} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <Shuffle className="h-4 w-4" /> Random
            </button>
          </div>

          {selected.similar.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Related gestures</div>
              <div className="flex flex-wrap gap-2">
                {selected.similar.map((name) => {
                  const g = GUIDE_GESTURES.find((x) => x.name === name);
                  if (!g) return null;
                  return (
                    <button key={name} onClick={() => setSelected(g)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                      {g.display}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Learn Sign Language</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Browse lessons by category, study each sign, and practice with real-time AI feedback.</p>
      </div>

      {/* Progress bar */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700 dark:text-slate-200">Your progress</span>
          <span className="text-slate-500 dark:text-slate-400">{completedCount} / {totalCount} completed</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-teal-500 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="mt-1 text-right text-xs font-semibold text-sky-600 dark:text-sky-400">{progressPct}%</div>
      </div>

      {/* Search + categories */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search signs…" aria-label="Search gestures" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-sky-500 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition ${category === cat ? 'bg-sky-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Gesture grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((g) => {
          const prog = progress[g.name];
          const isBookmarked = bookmarks.has(g.name);
          return (
            <button key={g.name} onClick={() => setSelected(g)} className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-sky-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700">
              <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 via-white to-sky-50 dark:from-amber-950/20 dark:via-slate-800 dark:to-sky-950/20">
                <HandIllustration gestureName={g.name} size="sm" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-slate-950 dark:text-white">{g.display}</span>
                <div className="flex gap-1">
                  {isBookmarked && <Star className="h-4 w-4 fill-amber-400 text-amber-500" />}
                  {prog?.status === 'completed' && <Check className="h-4 w-4 text-emerald-500" />}
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{g.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">{g.category}</span>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">{g.difficulty}</span>
              </div>
            </button>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="py-16 text-center text-sm text-slate-500">No gestures match that search.</div>}
    </div>
  );
}
