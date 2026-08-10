export type TTSOptions = {
  rate: number;
  pitch: number;
  voiceURI: string | null;
  lang: string;
};

export type VoiceInfo = {
  name: string;
  lang: string;
  voiceURI: string;
};

export function getVoices(): VoiceInfo[] {
  if (typeof speechSynthesis === 'undefined') return [];
  return speechSynthesis.getVoices().map((v) => ({ name: v.name, lang: v.lang, voiceURI: v.voiceURI }));
}

export function onVoicesChanged(cb: () => void): () => void {
  if (typeof speechSynthesis === 'undefined') return () => {};
  speechSynthesis.onvoiceschanged = cb;
  return () => { speechSynthesis.onvoiceschanged = null; };
}

export function speak(text: string, opts: TTSOptions): void {
  if (typeof speechSynthesis === 'undefined' || !text.trim()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = opts.rate;
  u.pitch = opts.pitch;
  u.lang = opts.lang;
  if (opts.voiceURI) {
    const v = speechSynthesis.getVoices().find((x) => x.voiceURI === opts.voiceURI);
    if (v) u.voice = v;
  }
  speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}

export const LANGUAGES = [
  { code: 'en', label: 'English', bcp47: 'en-US' },
  { code: 'hi', label: 'Hindi', bcp47: 'hi-IN' },
  { code: 'es', label: 'Spanish', bcp47: 'es-ES' },
  { code: 'fr', label: 'French', bcp47: 'fr-FR' },
  { code: 'ar', label: 'Arabic', bcp47: 'ar-SA' },
  { code: 'ja', label: 'Japanese', bcp47: 'ja-JP' },
  { code: 'zh', label: 'Chinese', bcp47: 'zh-CN' },
];

export function langToBcp47(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.bcp47 ?? 'en-US';
}

export function langLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? 'English';
}
