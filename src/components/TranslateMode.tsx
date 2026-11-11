import { useEffect, useMemo, useState } from 'react';
import { Bug, Camera, CameraOff, Copy, Download, Eye, Hand, Maximize, Minimize, Moon, Pencil, Play, RefreshCw, Sun, Trash2, Type, Undo2, Volume2, VolumeX, X, Zap } from 'lucide-react';
import type { RecognitionState } from '@/hooks/useRecognition';
import { gestureDisplay } from '@/lib/gestures';
import { speak, stopSpeaking, type TTSOptions } from '@/lib/tts';
import { supabase, type Transcript } from '@/lib/supabase';
import HandOverlay from '@/components/HandOverlay';
import SpeechControls from '@/components/SpeechControls';
import ModelManager from '@/components/ModelManager';
import HandIllustration from '@/components/HandIllustration';
import CustomGestureEditor from '@/components/CustomGestureEditor';

type Props = {
  recognition: RecognitionState;
  ttsOpts: TTSOptions;
  setTtsOpts: (o: TTSOptions) => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
  highContrast: boolean;
  setHighContrast: (c: boolean) => void;
  largeText: boolean;
  setLargeText: (l: boolean) => void;
  autoSpeak: boolean;
  setAutoSpeak: (a: boolean) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
  fullscreen: boolean;
  toggleFullscreen: () => void;
};

type CameraStatus = {
  hand: 'ok' | 'none' | 'many' | 'close' | 'outside';
  distance: 'ok' | 'close' | 'far';
};

function evaluateCameraStatus(hands: RecognitionState['hands']): CameraStatus | null {
  if (hands.length === 0) return { hand: 'none', distance: 'ok' };
  if (hands.length > 1) return { hand: 'many', distance: 'ok' };
  const h = hands[0];
  const xs = h.landmarks.map((l) => l.x);
  const ys = h.landmarks.map((l) => l.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  if (minX < 0.04 || maxX > 0.96 || minY < 0.04 || maxY > 0.96) return { hand: 'outside', distance: 'ok' };
  const width = maxX - minX;
  if (width > 0.7) return { hand: 'close', distance: 'close' };
  if (width < 0.12) return { hand: 'ok', distance: 'far' };
  return { hand: 'ok', distance: 'ok' };
}

export default function TranslateMode({
  recognition,
  ttsOpts,
  setTtsOpts,
  darkMode,
  setDarkMode,
  highContrast,
  setHighContrast,
  largeText,
  setLargeText,
  autoSpeak,
  setAutoSpeak,
  muted,
  setMuted,
  fullscreen,
  toggleFullscreen,
}: Props) {
  const {
    active, error, modelError, hands, currentGesture, smoothedGesture, confidence, sentenceText,
    fps, inferenceMs, threshold, setThreshold, facingMode, switchCamera, start, stop, videoRef,
    clearSentence, undoWord, classifier, setClassifier, classifierLabels, modelSource, reloadRules,
    debug, showDebug, setShowDebug,
    reconnect,
  } = recognition;

  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [lastSpoken, setLastSpoken] = useState('');

  useEffect(() => {
    reconnect();
  }, [reconnect]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('transcripts').select('*').order('created_at', { ascending: false }).limit(50);
      if (mounted && data) setTranscripts(data as Transcript[]);
      if (mounted) setLoadingHistory(false);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (autoSpeak && !muted && sentenceText && sentenceText !== lastSpoken) {
      setLastSpoken(sentenceText);
      speak(sentenceText, ttsOpts);
    }
  }, [sentenceText, autoSpeak, muted, ttsOpts, lastSpoken]);

  const cameraStatus = useMemo(() => evaluateCameraStatus(hands), [hands]);

  const statusItems = cameraStatus
    ? [
        { label: 'Hand detected', ok: cameraStatus.hand === 'ok' },
        { label: 'Distance good', ok: cameraStatus.distance === 'ok' },
        { label: 'In frame', ok: cameraStatus.hand !== 'outside' },
        { label: 'Single hand', ok: cameraStatus.hand !== 'many' },
      ]
    : [];

  const handleSpeak = () => {
    if (sentenceText && !muted) {
      stopSpeaking();
      speak(sentenceText, ttsOpts);
    }
  };

  const handleSave = async () => {
    if (!sentenceText.trim()) return;
    setSaving(true);
    const langCode = ttsOpts.lang.split('-')[0];
    const { data } = await supabase.from('transcripts').insert({ text: sentenceText, language: langCode }).select().single();
    if (data) setTranscripts((prev) => [data as Transcript, ...prev]);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setTranscripts((prev) => prev.filter((t) => t.id !== id));
    await supabase.from('transcripts').delete().eq('id', id);
  };

  const handleStartEdit = (t: Transcript) => { setEditingId(t.id); setEditText(t.text); };
  const handleSaveEdit = async (id: string) => {
    setTranscripts((prev) => prev.map((t) => (t.id === id ? { ...t, text: editText } : t)));
    await supabase.from('transcripts').update({ text: editText }).eq('id', id);
    setEditingId(null);
  };

  const exportTxt = () => {
    const content = transcripts.map((t) => `[${t.created_at}] ${t.text}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'transcripts.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const content = 'timestamp,text,language\n' + transcripts.map((t) => `"${t.created_at}","${t.text.replace(/"/g, '""')}",${t.language}`).join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'transcripts.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Camera */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-black dark:border-slate-800">
            <video ref={videoRef} playsInline muted className="h-full w-full object-contain" style={{ transform: 'scaleX(-1)' }} />
            {active && <HandOverlay videoRef={videoRef} hands={hands} width={1280} height={720} showLabels />}

            {!active && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900 text-white">
                {error ? (
                  <div className="max-w-xs text-center">
                    <CameraOff className="mx-auto mb-2 h-8 w-8 text-red-400" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                ) : modelError ? (
                  <div className="max-w-xs text-center">
                    <CameraOff className="mx-auto mb-2 h-8 w-8 text-amber-400" />
                    <p className="text-sm text-amber-400">Could not load the hand model. Check your connection and reload.</p>
                  </div>
                ) : (
                  <>
                    <Camera className="h-10 w-10 text-slate-400" />
                    <p className="text-sm text-slate-300">Camera is off. Press Start to begin translating.</p>
                  </>
                )}
                <button type="button" onClick={start} className="rounded-lg bg-sky-600 px-6 py-2.5 font-semibold text-white shadow-lg transition hover:bg-sky-700">
                  Start Camera
                </button>
              </div>
            )}

            {active && (
              <>
                <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 rounded-lg bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                    <span className={`h-2 w-2 rounded-full ${fps > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                    {fps} FPS · {inferenceMs.toFixed(0)}ms
                  </div>
                  {statusItems.length > 0 && (
                    <div className="rounded-lg bg-black/50 px-3 py-2 text-[11px] backdrop-blur-sm">
                      {statusItems.map((s) => (
                        <div key={s.label} className="flex items-center gap-1.5 py-0.5 text-white">
                          <span className={s.ok ? 'text-emerald-400' : 'text-red-400'}>{s.ok ? '✓' : '✗'}</span>{s.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="absolute right-3 top-3 flex gap-2">
                  <button type="button" onClick={switchCamera} className="rounded-lg bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black/70">
                    {facingMode === 'user' ? 'Front' : 'Rear'}
                  </button>
                  <button type="button" onClick={stop} className="rounded-lg bg-red-500/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-red-600">
                    Stop
                  </button>
                </div>
                {currentGesture && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-xl bg-black/70 px-4 py-2.5 backdrop-blur-md">
                    <HandIllustration gestureName={currentGesture} size="sm" />
                    <div>
                      <div className="text-lg font-bold text-white">{gestureDisplay(currentGesture)}</div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-sky-300">{confidence > 0 ? `${(confidence * 100).toFixed(0)}% confidence` : ''}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-400">{modelSource === 'custom' ? 'Custom model' : 'Built-in'}</span>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowDebug(!showDebug)}
                  className="absolute bottom-3 right-3 rounded-lg bg-black/50 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black/70"
                >
                  <Bug className="h-3.5 w-3.5 inline" /> Debug
                </button>
              </>
            )}
          </div>

          {/* Debug panel */}
          {showDebug && active && (
            <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4 text-xs dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Debug Info</span>
                <button type="button" onClick={() => setShowDebug(false)} className="text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
                <div>Camera: <span className={debug.cameraActive ? 'text-emerald-600' : 'text-red-500'}>{debug.cameraActive ? 'Active' : 'Off'}</span></div>
                <div>Model: <span className={debug.modelLoaded ? 'text-emerald-600' : 'text-red-500'}>{debug.modelLoaded ? 'Loaded' : 'Loading'}</span></div>
                <div>Hand detected: <span className={debug.handDetected ? 'text-emerald-600' : 'text-slate-400'}>{debug.handDetected ? 'Yes' : 'No'}</span></div>
                <div>Hand count: {debug.handCount}</div>
                <div>FPS: {debug.fps}</div>
                <div>Inference: {debug.inferenceMs.toFixed(0)}ms</div>
                <div>Status: {debug.predictionStatus}</div>
                <div>Confirmed: {debug.confirmedGesture || '—'}</div>
              </div>
              {debug.topPredictions.length > 0 && (
                <div className="mt-2">
                  <div className="font-semibold text-slate-600 dark:text-slate-400">Top predictions:</div>
                  {debug.topPredictions.map((p, i) => (
                    <div key={i} className="flex justify-between font-mono">
                      <span>{p.name}</span>
                      <span className={p.confidence >= threshold ? 'text-emerald-600' : 'text-slate-400'}>{(p.confidence * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Camera warnings */}
          {active && cameraStatus && cameraStatus.hand !== 'ok' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              {cameraStatus.hand === 'none' && 'No hand detected. Move your hand into the camera view.'}
              {cameraStatus.hand === 'many' && 'Multiple hands detected. Use one hand for clearer recognition.'}
              {cameraStatus.hand === 'close' && 'Hand too close. Move back so your whole hand fits in the frame.'}
              {cameraStatus.hand === 'outside' && 'Hand outside frame. Center your hand in the camera view.'}
            </div>
          )}

          {/* Live Sentence */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <Type className="h-4 w-4" /> Live Sentence
              </h2>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={undoWord} disabled={!sentenceText} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  <Undo2 className="h-3.5 w-3.5" /> Undo
                </button>
                <button type="button" onClick={handleSpeak} disabled={!sentenceText || muted} className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50">
                  <Volume2 className="h-3.5 w-3.5" /> Speak
                </button>
                <button type="button" onClick={handleSave} disabled={!sentenceText || saving} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={clearSentence} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  <Trash2 className="h-3.5 w-3.5" /> Clear
                </button>
              </div>
            </div>
            <div className="min-h-[3rem] rounded-lg bg-slate-50 p-3 text-lg text-slate-900 dark:bg-slate-800/50 dark:text-white">
              {sentenceText || <span className="text-slate-400">Show a hand sign to begin building a sentence…</span>}
            </div>
          </div>

          {/* Threshold + toggles */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <Zap className="h-4 w-4" /> Confidence Threshold
              </h2>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{(threshold * 100).toFixed(0)}%</span>
            </div>
            <input type="range" min={0.5} max={0.95} step={0.01} value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))} className="w-full accent-sky-600" aria-label="Confidence threshold" />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Gestures below this confidence are ignored. 85% is recommended for stable demos.</p>
          </div>

          {/* Model manager */}
          <ModelManager currentClassifier={classifier} onClassifierChange={setClassifier} builtinLabels={[]} customLabels={classifierLabels} />

          {/* Custom gesture editor */}
          <CustomGestureEditor />

          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <button type="button" onClick={() => setAutoSpeak(!autoSpeak)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${autoSpeak ? 'bg-sky-600 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'}`}>
              <Volume2 className="h-3.5 w-3.5" /> Auto-speak {autoSpeak ? 'on' : 'off'}
            </button>
            <button type="button" onClick={() => setMuted(!muted)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${muted ? 'bg-red-600 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'}`}>
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />} {muted ? 'Muted' : 'Sound on'}
            </button>
            <button type="button" onClick={() => setHighContrast(!highContrast)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${highContrast ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'}`}>
              <Eye className="h-3.5 w-3.5" /> High contrast
            </button>
            <button type="button" onClick={() => setLargeText(!largeText)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${largeText ? 'bg-sky-600 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'}`}>
              <Type className="h-3.5 w-3.5" /> Large text
            </button>
            <button type="button" onClick={() => setDarkMode(!darkMode)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />} {darkMode ? 'Light' : 'Dark'}
            </button>
            <button type="button" onClick={toggleFullscreen} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              {fullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />} Fullscreen
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <SpeechControls options={ttsOpts} setOptions={setTtsOpts} onSpeak={handleSpeak} disabled={!sentenceText || muted} compact />

          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <RefreshCw className="h-4 w-4" /> Saved Transcripts
              </h2>
              <div className="flex gap-1.5">
                <button type="button" onClick={exportTxt} disabled={transcripts.length === 0} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  <Download className="h-3.5 w-3.5" /> TXT
                </button>
                <button type="button" onClick={exportCsv} disabled={transcripts.length === 0} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  <Download className="h-3.5 w-3.5" /> CSV
                </button>
              </div>
            </div>
            {loadingHistory ? (
              <p className="py-4 text-center text-sm text-slate-400">Loading…</p>
            ) : transcripts.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">No saved transcripts yet.</p>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {transcripts.map((t) => (
                  <div key={t.id} className="group rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                    {editingId === t.id ? (
                      <div className="space-y-2">
                        <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" rows={2} />
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleSaveEdit(t.id)} className="rounded-lg bg-sky-600 px-3 py-1 text-xs font-semibold text-white">Save</button>
                          <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-slate-900 dark:text-white">{t.text}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-slate-400">{new Date(t.created_at).toLocaleString()} · {t.language}</span>
                          <div className="flex flex-wrap gap-1 opacity-0 transition group-hover:opacity-100">
                            <button type="button" onClick={() => { if (!muted) speak(t.text, ttsOpts); }} disabled={muted} aria-label="Replay" className="rounded px-1.5 py-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-700 dark:hover:text-white"><Play className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => navigator.clipboard?.writeText(t.text).catch(() => {})} aria-label="Copy" className="rounded px-1.5 py-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"><Copy className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => handleStartEdit(t)} aria-label="Edit" className="rounded px-1.5 py-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => handleDelete(t.id)} aria-label="Delete" className="rounded px-1.5 py-0.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
