import { useState } from 'react';
import { ArrowRight, Camera, Eye, Hand, Lightbulb, Sparkles, X } from 'lucide-react';

type Props = {
  onComplete: () => void;
};

const SLIDES = [
  {
    icon: Hand,
    title: 'Welcome to SignSpeak',
    body: 'Learn sign language through interactive lessons, real-time AI coaching, and live translation. Everything works right in your browser.',
    color: 'text-sky-600 dark:text-sky-400',
  },
  {
    icon: Camera,
    title: 'Camera Permission',
    body: 'SignSpeak needs your camera to recognize hand signs. When you start, your browser will ask for permission. Allow it to begin. Your video never leaves your device.',
    color: 'text-teal-600 dark:text-teal-400',
  },
  {
    icon: Sparkles,
    title: 'How Recognition Works',
    body: 'Our AI tracks 21 landmarks on your hand in real time. It compares your hand shape to known signs and shows the best match with a confidence score.',
    color: 'text-amber-600 dark:text-amber-400',
  },
  {
    icon: Eye,
    title: 'How to Practice',
    body: 'Open Learn mode, pick a sign, and study the steps. Then tap Practice. The AI coach watches your hand and gives live tips like "Extend your index finger."',
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Lightbulb,
    title: 'Lighting Tips',
    body: 'For best results, face a window or lamp. Keep your hand well-lit and centered in the frame. Avoid backlighting or very dark rooms.',
    color: 'text-violet-600 dark:text-violet-400',
  },
];

export default function Onboarding({ onComplete }: Props) {
  const [slide, setSlide] = useState(0);
  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
        <div className="flex justify-end">
          <button onClick={onComplete} aria-label="Skip onboarding" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 ${current.color}`}>
            <Icon className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{current.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{current.body}</p>
        </div>

        {/* Dots */}
        <div className="mt-8 flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} className={`h-2 rounded-full transition-all ${i === slide ? 'w-8 bg-sky-600' : 'w-2 bg-slate-300 dark:bg-slate-700'}`} />
          ))}
        </div>

        <div className="mt-6 flex justify-between">
          <button onClick={() => setSlide((s) => Math.max(0, s - 1))} disabled={slide === 0} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Back
          </button>
          {isLast ? (
            <button onClick={onComplete} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">
              Get Started <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={() => setSlide((s) => s + 1)} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
