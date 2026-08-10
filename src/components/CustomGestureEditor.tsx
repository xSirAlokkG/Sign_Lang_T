import { useEffect, useState } from 'react';
import { Check, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react';
import {
  fetchRules, createRule, updateRule, deleteRule, labelToName,
  type CustomGestureRule, type NewRule, type FingerState,
} from '@/lib/customGestures';

const FINGER_NAMES = ['thumb', 'index', 'middle', 'ring', 'pinky'] as const;
const FINGER_LABELS: Record<typeof FINGER_NAMES[number], string> = {
  thumb: 'Thumb',
  index: 'Index',
  middle: 'Middle',
  ring: 'Ring',
  pinky: 'Pinky',
};

const STATE_OPTIONS: FingerState[] = ['extended', 'folded', 'any'];

function stateColor(state: FingerState): string {
  if (state === 'extended') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
  if (state === 'folded') return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
  return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
}

const emptyRule: NewRule = {
  label: '', name: '', thumb: 'any', index: 'any', middle: 'any', ring: 'any', pinky: 'any',
  fingers_spread: false, confidence: 0.82,
};

export default function CustomGestureEditor() {
  const [rules, setRules] = useState<CustomGestureRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CustomGestureRule | null>(null);
  const [draft, setDraft] = useState<NewRule>(emptyRule);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const r = await fetchRules();
      if (mounted) { setRules(r); setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const startCreate = () => {
    setEditing(null);
    setDraft(emptyRule);
    setShowForm(true);
    setError(null);
  };

  const startEdit = (r: CustomGestureRule) => {
    setEditing(r);
    setDraft({
      label: r.label, name: r.name, thumb: r.thumb, index: r.index, middle: r.middle,
      ring: r.ring, pinky: r.pinky, fingers_spread: r.fingers_spread, confidence: r.confidence,
    });
    setShowForm(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!draft.label.trim()) { setError('Please enter a label like "Victory".'); return; }
    const name = labelToName(draft.label);
    const rule = { ...draft, name };
    if (editing) {
      const updated = await updateRule(editing.id, rule);
      if (updated) setRules((prev) => prev.map((r) => (r.id === editing.id ? updated : r)));
    } else {
      const created = await createRule(rule);
      if (created) setRules((prev) => [...prev, created]);
    }
    setShowForm(false);
    setEditing(null);
    setDraft(emptyRule);
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteRule(id);
    if (ok) setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const cycleFinger = (finger: typeof FINGER_NAMES[number], current: FingerState) => {
    const idx = STATE_OPTIONS.indexOf(current);
    const next = STATE_OPTIONS[(idx + 1) % STATE_OPTIONS.length];
    setDraft((d) => ({ ...d, [finger]: next }));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-950 dark:text-white">Custom Signs</h3>
        </div>
        <button onClick={startCreate} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-600">
          <Plus className="h-4 w-4" /> New Sign
        </button>
      </div>

      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        Define your own signs by choosing which fingers are extended or folded. For example, set index + middle to "extended" and turn on "fingers spread" to create a Victory sign.
      </p>

      {loading ? (
        <p className="py-4 text-center text-sm text-slate-400">Loading…</p>
      ) : rules.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
          <Sparkles className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No custom signs yet. Click "New Sign" to create one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{r.label}</div>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {FINGER_NAMES.map((fn) => (
                    <span key={fn} className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${stateColor(r[fn] as FingerState)}`}>
                      {FINGER_LABELS[fn]}: {r[fn]}
                    </span>
                  ))}
                  {r.fingers_spread && (
                    <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">spread</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(r)} aria-label="Edit" className="rounded p-1.5 text-slate-500 transition hover:bg-slate-200 dark:hover:bg-slate-700">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(r.id)} aria-label="Delete" className="rounded p-1.5 text-red-500 transition hover:bg-red-100 dark:hover:bg-red-900/30">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{editing ? 'Edit Sign' : 'New Custom Sign'}</h4>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Sign Name (what it means)</label>
              <input
                type="text"
                value={draft.label}
                onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                placeholder="e.g. Victory, Peace, Three"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">Finger Positions</label>
              <p className="mb-2 text-[11px] text-slate-400">Tap a finger to cycle: Extended → Folded → Any</p>
              <div className="flex flex-wrap gap-2">
                {FINGER_NAMES.map((fn) => (
                  <button
                    key={fn}
                    onClick={() => cycleFinger(fn, draft[fn] as FingerState)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${stateColor(draft[fn] as FingerState)}`}
                  >
                    {FINGER_LABELS[fn]}
                    <span className="ml-1 opacity-60">· {draft[fn]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.fingers_spread}
                  onChange={(e) => setDraft((d) => ({ ...d, fingers_spread: e.target.checked }))}
                  className="h-4 w-4 accent-sky-600"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Require space between extended fingers</span>
              </label>
              <p className="mt-1 ml-6 text-[11px] text-slate-400">Turn this on for signs like Victory where the index and middle fingers must be apart.</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Confidence: {(draft.confidence * 100).toFixed(0)}%</label>
              <input
                type="range"
                min={0.5}
                max={0.95}
                step={0.01}
                value={draft.confidence}
                onChange={(e) => setDraft((d) => ({ ...d, confidence: parseFloat(e.target.value) }))}
                className="w-full accent-amber-500"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}

            <button
              onClick={handleSave}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-semibold text-white transition hover:bg-amber-600"
            >
              <Check className="h-4 w-4" /> {editing ? 'Save Changes' : 'Create Sign'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
