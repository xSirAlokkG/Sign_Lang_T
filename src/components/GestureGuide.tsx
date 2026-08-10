import { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Play, Search, Star, X } from 'lucide-react';
import { GUIDE_CATEGORIES, GUIDE_GESTURES, type GuideCategory, type GuideGesture } from '@/lib/gestureGuide';

type Props = {
  onClose: () => void;
  onPractice: (gesture: GuideGesture) => void;
  bookmarks: Set<string>;
  onToggleBookmark: (name: string) => void;
  progress: Record<string, { status: string; accuracy: number }>;
};

function HandIllustration({ gesture, size = 'md' }: { gesture: GuideGesture; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'h-56' : size === 'sm' ? 'h-28' : 'h-40';
  return (
    <div className={`relative flex ${dims} items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-sky-50 via-white to-teal-50 dark:from-sky-950/40 dark:via-slate-800 dark:to-teal-950/30`}>
      <div className="relative flex flex-col items-center">
        {/* Palm */}
        <div className="relative">
          <div className="h-16 w-14 rounded-t-[42%] rounded-b-2xl border-2 border-sky-500/50 bg-sky-300/15 dark:bg-sky-300/5" />
          {/* Fingers */}
          {gesture.fingerCues && gesture.fingerCues.length > 0 ? (
            gesture.fingerCues.map((cue, i) => {
              const isExtended = cue.state === 'extended' || cue.state === 'spread';
              const spread = cue.state === 'spread';
              const left = -18 + i * 12 + (spread ? (i - 2) * 4 : 0);
              return (
                <div
                  key={cue.label}
                  className={`absolute -top-12 h-12 w-2.5 rounded-full border-2 ${isExtended ? 'border-sky-500 bg-sky-400/30' : 'border-slate-400 bg-slate-300/20'}`}
                  style={{ left: `${left}px`, transform: isExtended ? 'none' : 'scaleY(0.3) translateY(8px)' }}
                  title={cue.label}
                />
              );
            })
          ) : (
            <>
              <div className="absolute -top-10 left-1 h-10 w-2.5 rounded-full border-2 border-sky-500/50 bg-sky-300/15" />
              <div className="absolute -top-12 left-4 h-12 w-2.5 rounded-full border-2 border-sky-500/50 bg-sky-300/15" />
              <div className="absolute -top-12 left-7 h-12 w-2.5 rounded-full border-2 border-sky-500/50 bg-sky-300/15" />
              <div className="absolute -top-11 left-10 h-11 w-2.5 rounded-full border-2 border-sky-500/50 bg-sky-300/15" />
              <div className="absolute -top-9 left-13 h-9 w-2.5 rounded-full border-2 border-sky-500/50 bg-sky-300/15" />
            </>
          )}
        </div>
        {/* Motion arrow */}
        {gesture.type === 'Dynamic' && (
          <div className="mt-2 flex items-center gap-1 text-sky-500">
            <svg className="h-4 w-4 motion-safe:animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] font-medium">Motion</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ gesture, onPractice, bookmarks, onToggleBookmark, progress }: { gesture: GuideGesture; onPractice: (g: GuideGesture) => void; bookmarks: Set<string>; onToggleBookmark: (n: string) => void; progress: Record<string, { status: string; accuracy: number }> }) {
  const isBookmarked = bookmarks.has(gesture.name);
  const prog = progress[gesture.name];
  return (
    <div className="mt-3 border-t border-slate-200 pt-3 text-sm dark:border-slate-700">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><span className="font-semibold text-slate-900 dark:text-white">Hand:</span> {gesture.hand}</div>
        <div><span className="font-semibold text-slate-900 dark:text-white">Palm:</span> {gesture.palm}</div>
        <div className="sm:col-span-2"><span className="font-semibold text-slate-900 dark:text-white">Finger positions:</span> {gesture.fingers}</div>
        <div className="sm:col-span-2"><span className="font-semibold text-slate-900 dark:text-white">Movement:</span> {gesture.motion}</div>
      </div>
      <div className="mt-3">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">Step by step</div>
        <ol className="list-inside list-decimal space-y-1 text-slate-700 dark:text-slate-300">
          {gesture.steps.map((step, i) => <li key={i}>{step}</li>)}
        </ol>
      </div>
      <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        <span className="font-semibold">Common mistakes:</span> {gesture.mistakes.join(' ')}
      </div>
      <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
        <span className="font-semibold">Tips:</span> {gesture.tips.join(' ')}
      </div>
      {prog && (
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Your progress: <span className="font-semibold text-slate-700 dark:text-slate-200">{prog.status === 'completed' ? 'Completed' : 'In progress'}</span>
          {prog.accuracy > 0 && <> · Best accuracy: {(prog.accuracy * 100).toFixed(0)}%</>}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => onPractice(gesture)} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-700">
          <Play className="h-3.5 w-3.5" /> Practice this sign
        </button>
        <button onClick={() => onToggleBookmark(gesture.name)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${isBookmarked ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300' : 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'}`}>
          <Star className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} /> {isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </button>
        {gesture.similar.length > 0 && <span className="text-xs text-slate-500 dark:text-slate-400">Similar: {gesture.similar.join(', ')}</span>}
      </div>
    </div>
  );
}

export default function GestureGuide({ onClose, onPractice, bookmarks, onToggleBookmark, progress }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GuideCategory | 'All'>('All');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);

  const filtered = useMemo(() => GUIDE_GESTURES.filter((gesture) => {
    const matchesCategory = category === 'All' || gesture.category === category;
    const matchesBookmark = !onlyBookmarks || bookmarks.has(gesture.name);
    const needle = query.trim().toLowerCase();
    return matchesCategory && matchesBookmark && (!needle || `${gesture.display} ${gesture.description} ${gesture.category}`.toLowerCase().includes(needle));
  }), [category, query, onlyBookmarks, bookmarks]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-950 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sky-600 dark:text-sky-400"><BookOpen className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[0.2em]">Learn by doing</span></div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Gesture guide</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">Every card shows the hand shape, palm direction, finger positions, motion, and common mistakes. Open a card to practice it in front of the camera.</p>
          </div>
          <button onClick={onClose} aria-label="Close gesture guide" className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search signs, words, or categories" aria-label="Search signs" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-sky-500 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Gesture categories">
            {(['All', ...GUIDE_CATEGORIES] as const).map((item) => (
              <button key={item} onClick={() => setCategory(item)} role="tab" aria-selected={category === item} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition ${category === item ? 'bg-sky-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{item}</button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button onClick={() => setOnlyBookmarks((b) => !b)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${onlyBookmarks ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <Star className={`h-3.5 w-3.5 ${onlyBookmarks ? 'fill-amber-400' : ''}`} /> Favorites only
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((gesture) => {
            const isExpanded = expanded === gesture.name;
            const isBookmarked = bookmarks.has(gesture.name);
            return (
              <article key={gesture.name} className={`rounded-2xl border bg-white p-3 shadow-sm transition dark:bg-slate-900 ${isExpanded ? 'border-sky-300 shadow-sky-100/60 dark:border-sky-700' : 'border-slate-200 dark:border-slate-800'}`}>
                <HandIllustration gesture={gesture} />
                <button onClick={() => setExpanded(isExpanded ? null : gesture.name)} aria-expanded={isExpanded} className="mt-3 flex w-full items-start justify-between gap-3 text-left">
                  <span>
                    <span className="block text-lg font-bold text-slate-950 dark:text-white">{gesture.display}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">{gesture.description}</span>
                  </span>
                  {isExpanded ? <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-sky-600" /> : <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400" />}
                </button>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-semibold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">{gesture.type}</span>
                  <span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-semibold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">{gesture.hand}</span>
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">{gesture.difficulty}</span>
                  <button onClick={() => onToggleBookmark(gesture.name)} aria-label="Bookmark" className="ml-auto">
                    <Star className={`h-4 w-4 ${isBookmarked ? 'fill-amber-400 text-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                  </button>
                </div>
                {isExpanded && <Detail gesture={gesture} onPractice={onPractice} bookmarks={bookmarks} onToggleBookmark={onToggleBookmark} progress={progress} />}
              </article>
            );
          })}
        </div>
        {filtered.length === 0 && <div className="py-16 text-center text-sm text-slate-500">No gestures match that search.</div>}
      </div>
    </div>
  );
}
