import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileUp, Loader2, Upload, X } from 'lucide-react';
import { validateTMFiles, loadTeachableMachineModel, type TMLoadProgress, type GestureClassifier } from '@/lib/modelRegistry';

type Props = {
  currentClassifier: GestureClassifier | null;
  onClassifierChange: (c: GestureClassifier | null) => void;
  builtinLabels: string[];
  customLabels: string[];
};

export default function ModelManager({ currentClassifier, onClassifierChange, builtinLabels, customLabels }: Props) {
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [metadataFile, setMetadataFile] = useState<File | null>(null);
  const [weightsFile, setWeightsFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<TMLoadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const modelInputRef = useRef<HTMLInputElement | null>(null);
  const metadataInputRef = useRef<HTMLInputElement | null>(null);
  const weightsInputRef = useRef<HTMLInputElement | null>(null);

  const handleLoad = async () => {
    setError(null);
    setSuccess(null);
    if (!modelFile) {
      setError('Please select a model.json file.');
      return;
    }
    const validationError = validateTMFiles({ modelJson: modelFile, metadataJson: metadataFile || undefined, weightsBin: weightsFile || undefined });
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      const classifier = await loadTeachableMachineModel(
        { modelJson: modelFile, metadataJson: metadataFile || undefined, weightsBin: weightsFile || undefined },
        (p) => setProgress(p),
      );
      onClassifierChange(classifier);
      setSuccess(`Loaded "${classifier.name}" with ${classifier.labels.length} gesture labels.`);
    } catch (e) {
      setError((e as Error).message || 'Failed to load model.');
      setProgress({ stage: 'error', message: 'Load failed.', percent: 0 });
    }
  };

  const handleSwitchBuiltin = () => {
    onClassifierChange(null);
    setSuccess(null);
    setError(null);
    setProgress(null);
  };

  const stageColor = progress?.stage === 'error' ? 'text-red-600' : progress?.stage === 'ready' ? 'text-emerald-600' : 'text-sky-600';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <FileUp className="h-5 w-5 text-sky-600 dark:text-sky-400" />
        <h3 className="text-lg font-bold text-slate-950 dark:text-white">Recognition Model</h3>
      </div>

      {/* Current model status */}
      <div className="mb-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Active model</div>
            <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
              {currentClassifier ? currentClassifier.name : 'Built-in Rule-based'}
            </div>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${currentClassifier ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' : 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'}`}>
            {currentClassifier ? 'Custom' : 'Built-in'}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {currentClassifier
            ? `${customLabels.length} labels: ${customLabels.slice(0, 6).join(', ')}${customLabels.length > 6 ? '…' : ''}`
            : `${builtinLabels.length || 15} built-in gestures`}
        </div>
      </div>

      {/* Model switcher */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={handleSwitchBuiltin}
          disabled={!currentClassifier}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${!currentClassifier ? 'bg-sky-600 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'}`}
        >
          Built-in Model
        </button>
        <button
          onClick={() => modelInputRef.current?.click()}
          disabled={!!currentClassifier}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${currentClassifier ? 'bg-violet-600 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'}`}
        >
          Custom (Teachable Machine)
        </button>
      </div>

      {/* Upload section */}
      {!currentClassifier && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">model.json (required)</label>
            <button onClick={() => modelInputRef.current?.click()} className="flex w-full items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-600 transition hover:border-sky-400 hover:bg-sky-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-sky-950/30">
              <Upload className="h-4 w-4" />
              {modelFile ? modelFile.name : 'Choose model.json…'}
            </button>
            <input ref={modelInputRef} type="file" accept=".json" className="hidden" onChange={(e) => { setModelFile(e.target.files?.[0] ?? null); setError(null); setSuccess(null); }} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">metadata.json (optional, for labels)</label>
            <button onClick={() => metadataInputRef.current?.click()} className="flex w-full items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-600 transition hover:border-sky-400 hover:bg-sky-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-sky-950/30">
              <Upload className="h-4 w-4" />
              {metadataFile ? metadataFile.name : 'Choose metadata.json…'}
            </button>
            <input ref={metadataInputRef} type="file" accept=".json" className="hidden" onChange={(e) => { setMetadataFile(e.target.files?.[0] ?? null); setError(null); setSuccess(null); }} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">weights.bin (optional)</label>
            <button onClick={() => weightsInputRef.current?.click()} className="flex w-full items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-600 transition hover:border-sky-400 hover:bg-sky-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-sky-950/30">
              <Upload className="h-4 w-4" />
              {weightsFile ? weightsFile.name : 'Choose weights.bin…'}
            </button>
            <input ref={weightsInputRef} type="file" accept=".bin" className="hidden" onChange={(e) => { setWeightsFile(e.target.files?.[0] ?? null); setError(null); setSuccess(null); }} />
          </div>

          <button onClick={handleLoad} disabled={!modelFile || progress?.stage === 'loading' || progress?.stage === 'reading'} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50">
            {progress?.stage === 'loading' || progress?.stage === 'reading' ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</> : <><Upload className="h-4 w-4" /> Load Custom Model</>}
          </button>

          {/* Progress bar */}
          {progress && progress.stage !== 'ready' && progress.stage !== 'error' && (
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
              <div className="flex items-center justify-between text-xs">
                <span className={stageColor}>{progress.message}</span>
                <span className="font-semibold text-slate-500">{progress.percent}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${progress.percent}%` }} />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              <button onClick={() => setError(null)} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {success}
              <button onClick={() => setSuccess(null)} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
        <span className="font-semibold text-slate-600 dark:text-slate-300">How to export from Teachable Machine:</span>
        Export your model as "TensorFlow.js", download the files, then upload model.json, metadata.json, and weights.bin here. Labels are read automatically from metadata.json.
      </div>
    </div>
  );
}
