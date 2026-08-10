import { useEffect, useState } from 'react';
import { getVoices, onVoicesChanged, type VoiceInfo } from '@/lib/tts';
import { LANGUAGES, langToBcp47, speak, stopSpeaking, type TTSOptions } from '@/lib/tts';
import { Volume2, VolumeX } from 'lucide-react';

type Props = {
  options: TTSOptions;
  setOptions: (o: TTSOptions) => void;
  onSpeak: () => void;
  disabled?: boolean;
  compact?: boolean;
};

export default function SpeechControls({ options, setOptions, onSpeak, disabled, compact }: Props) {
  const [voices, setVoices] = useState<VoiceInfo[]>(getVoices());

  useEffect(() => {
    const update = () => setVoices(getVoices());
    update();
    return onVoicesChanged(update);
  }, []);

  const langVoices = voices.filter((v) => v.lang.startsWith(options.lang.split('-')[0]));

  return (
    <div className={`space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${compact ? '' : 'shadow-sm'}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={onSpeak}
          disabled={disabled}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Volume2 className="h-4 w-4" /> Speak
        </button>
        <button
          onClick={stopSpeaking}
          className="rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <VolumeX className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Language</label>
          <select
            value={options.lang.split('-')[0]}
            onChange={(e) => setOptions({ ...options, lang: langToBcp47(e.target.value), voiceURI: null })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Voice</label>
          <select
            value={options.voiceURI ?? ''}
            onChange={(e) => setOptions({ ...options, voiceURI: e.target.value || null })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          >
            <option value="">Auto</option>
            {langVoices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Speed: {options.rate.toFixed(1)}x</label>
          <input type="range" min={0.5} max={2} step={0.1} value={options.rate} onChange={(e) => setOptions({ ...options, rate: parseFloat(e.target.value) })} className="w-full accent-sky-600" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Pitch: {options.pitch.toFixed(1)}</label>
          <input type="range" min={0} max={2} step={0.1} value={options.pitch} onChange={(e) => setOptions({ ...options, pitch: parseFloat(e.target.value) })} className="w-full accent-sky-600" />
        </div>
      </div>
    </div>
  );
}
