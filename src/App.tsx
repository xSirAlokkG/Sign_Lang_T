import { useEffect, useMemo, useState } from 'react';
import { BookOpen, BarChart3, Camera, Hand, History, Home, Languages, Moon, Settings as SettingsIcon, Sun, Zap } from 'lucide-react';
import { useRecognition } from '@/hooks/useRecognition';
import { useProgress, useBookmarks, useQuizScores } from '@/lib/useProgress';
import { GUIDE_GESTURES, type GuideGesture } from '@/lib/gestureGuide';
import type { TTSOptions } from '@/lib/tts';
import { supabase, type Transcript } from '@/lib/supabase';
import LearnMode from '@/components/LearnMode';
import TranslateMode from '@/components/TranslateMode';
import PracticeMode from '@/components/PracticeMode';
import QuizMode from '@/components/QuizMode';
import GestureGuide from '@/components/GestureGuide';
import Onboarding from '@/components/Onboarding';
import StatisticsView from '@/components/StatisticsView';

type Tab = 'home' | 'learn' | 'translate' | 'practice' | 'history' | 'statistics' | 'settings';

const ONBOARDING_KEY = 'signspeak_onboarded';

export default function App() {
  const recognition = useRecognition();
  const { progress, markCompleted, addPracticeTime } = useProgress();
  const { bookmarks, toggle: toggleBookmark } = useBookmarks();
  const { addScore } = useQuizScores();

  const [tab, setTab] = useState<Tab>('home');
  const [darkMode, setDarkMode] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [practiceTarget, setPracticeTarget] = useState<GuideGesture | null>(null);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [learnGesture, setLearnGesture] = useState<GuideGesture | null>(null);
  const [quizActive, setQuizActive] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);

  const [ttsOpts, setTtsOpts] = useState<TTSOptions>({
    rate: 1,
    pitch: 1,
    voiceURI: null,
    lang: 'en-US',
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.classList.toggle('large-text', largeText);
  }, [largeText]);

  useEffect(() => {
    const onboarded = localStorage.getItem(ONBOARDING_KEY);
    if (!onboarded) setShowOnboarding(true);
  }, []);

  useEffect(() => {
    const onboarded = localStorage.getItem(ONBOARDING_KEY);
    if (onboarded && !recognition.active) {
      recognition.start();
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from('transcripts').select('*').order('created_at', { ascending: false }).limit(50);
      if (mounted && data) setTranscripts(data as Transcript[]);
    })();
    return () => { mounted = false; };
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setFullscreen(false);
    }
  };

  const startPractice = (gesture: GuideGesture) => {
    setShowGuide(false);
    const idx = GUIDE_GESTURES.findIndex((g) => g.name === gesture.name);
    setPracticeIndex(idx >= 0 ? idx : 0);
    setPracticeTarget(gesture);
    setTab('translate');
    if (!recognition.active) recognition.start();
  };

  const nextPractice = (gesture: GuideGesture) => {
    const idx = GUIDE_GESTURES.findIndex((g) => g.name === gesture.name);
    setPracticeIndex(idx >= 0 ? idx : 0);
    setPracticeTarget(gesture);
  };

  const prevPractice = () => {
    const idx = (practiceIndex - 1 + GUIDE_GESTURES.length) % GUIDE_GESTURES.length;
    setPracticeIndex(idx);
    setPracticeTarget(GUIDE_GESTURES[idx]);
  };

  const currentClassification = recognition.smoothedGesture
    ? { name: recognition.smoothedGesture, confidence: recognition.confidence }
    : recognition.currentGesture
      ? { name: recognition.currentGesture, confidence: recognition.confidence }
      : null;

  const navItems: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'translate', label: 'Translate', icon: Languages },
    { id: 'practice', label: 'Practice', icon: Camera },
    { id: 'history', label: 'History', icon: History },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const completedCount = Object.values(progress).filter((p) => p.status === 'completed').length;
  const progressPct = Math.round((completedCount / GUIDE_GESTURES.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button onClick={() => setTab('home')} className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
              <Hand className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">SignSpeak</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sign language learning & translation</p>
            </div>
          </button>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowGuide(true)} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <BookOpen className="h-4 w-4" /> <span className="hidden sm:inline">Guide</span>
            </button>
            <button onClick={() => setDarkMode(!darkMode)} aria-label="Toggle dark mode" className="rounded-lg border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pb-20 lg:pb-6">
        {tab === 'home' && (
          <div className="mx-auto max-w-6xl px-4 py-8">
            {/* Hero */}
            <div className="rounded-3xl bg-gradient-to-br from-sky-600 to-teal-600 p-8 text-white shadow-xl sm:p-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Learn sign language with AI</h2>
              <p className="mt-3 max-w-xl text-sky-100">Interactive lessons, real-time coaching, and live translation. Everything you need to start signing.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => setTab('learn')} className="rounded-xl bg-white px-5 py-2.5 font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50">
                  Start Learning
                </button>
                <button onClick={() => setTab('translate')} className="rounded-xl border border-white/40 bg-white/10 px-5 py-2.5 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20">
                  Translate Signs
                </button>
              </div>
            </div>

            {/* Stats overview */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400"><BookOpen className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-wide">Lessons</span></div>
                <div className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{GUIDE_GESTURES.length}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">total signs available</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><Zap className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-wide">Progress</span></div>
                <div className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{progressPct}%</div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400"><History className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-wide">Transcripts</span></div>
                <div className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{transcripts.length}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">saved translations</div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button onClick={() => setTab('learn')} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-sky-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700">
                <BookOpen className="h-8 w-8 text-sky-600 dark:text-sky-400" />
                <h3 className="mt-3 font-bold text-slate-950 dark:text-white">Learn</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Browse lessons by category with step-by-step instructions.</p>
              </button>
              <button onClick={() => setTab('translate')} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-sky-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700">
                <Languages className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                <h3 className="mt-3 font-bold text-slate-950 dark:text-white">Translate</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Live camera translation of signs to text and speech.</p>
              </button>
              <button onClick={() => setQuizActive(true)} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-sky-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700">
                <Zap className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                <h3 className="mt-3 font-bold text-slate-950 dark:text-white">Quiz</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Test your knowledge with timed sign challenges.</p>
              </button>
              <button onClick={() => setTab('statistics')} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-sky-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700">
                <BarChart3 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                <h3 className="mt-3 font-bold text-slate-950 dark:text-white">Statistics</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Track your progress, streak, and accuracy over time.</p>
              </button>
            </div>
          </div>
        )}

        {tab === 'learn' && (
          <LearnMode
            initialGesture={learnGesture}
            current={currentClassification}
            onClose={() => setTab('home')}
            onPractice={startPractice}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
            progress={progress}
          />
        )}

        {tab === 'translate' && (
          <TranslateMode
            recognition={recognition}
            ttsOpts={ttsOpts}
            setTtsOpts={setTtsOpts}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            highContrast={highContrast}
            setHighContrast={setHighContrast}
            largeText={largeText}
            setLargeText={setLargeText}
            autoSpeak={autoSpeak}
            setAutoSpeak={setAutoSpeak}
            muted={muted}
            setMuted={setMuted}
            fullscreen={fullscreen}
            toggleFullscreen={toggleFullscreen}
          />
        )}

        {tab === 'practice' && (
          <div className="mx-auto max-w-3xl px-4 py-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Practice</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Pick a sign to practice with real-time AI coaching.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {GUIDE_GESTURES.map((g) => (
                <button key={g.name} onClick={() => startPractice(g)} className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700">
                  <div className="text-lg font-bold text-slate-950 dark:text-white">{g.display}</div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{g.category} · {g.difficulty}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="mx-auto max-w-3xl px-4 py-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">History</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Your saved translations and transcripts.</p>
            {transcripts.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                <History className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No saved transcripts yet. Go to Translate mode and save a sentence.</p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {transcripts.map((t) => (
                  <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-sm text-slate-900 dark:text-white">{t.text}</p>
                    <div className="mt-1 text-xs text-slate-400">{new Date(t.created_at).toLocaleString()} · {t.language}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'statistics' && <StatisticsView />}

        {tab === 'settings' && (
          <div className="mx-auto max-w-2xl px-4 py-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Settings</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Customize your experience and accessibility options.</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Appearance</h2>
                <div className="mt-4 space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Dark mode</span>
                    <button onClick={() => setDarkMode(!darkMode)} className={`relative h-6 w-11 rounded-full transition ${darkMode ? 'bg-sky-600' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${darkMode ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">High contrast</span>
                    <button onClick={() => setHighContrast(!highContrast)} className={`relative h-6 w-11 rounded-full transition ${highContrast ? 'bg-sky-600' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${highContrast ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Large text</span>
                    <button onClick={() => setLargeText(!largeText)} className={`relative h-6 w-11 rounded-full transition ${largeText ? 'bg-sky-600' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${largeText ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </label>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Speech</h2>
                <div className="mt-4 space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Auto-speak detected signs</span>
                    <button onClick={() => setAutoSpeak(!autoSpeak)} className={`relative h-6 w-11 rounded-full transition ${autoSpeak ? 'bg-sky-600' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${autoSpeak ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Mute all speech</span>
                    <button onClick={() => setMuted(!muted)} className={`relative h-6 w-11 rounded-full transition ${muted ? 'bg-red-600' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${muted ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </label>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Onboarding</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Replay the welcome tutorial.</p>
                <button onClick={() => setShowOnboarding(true)} className="mt-3 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  Replay tutorial
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
        <div className="flex justify-around overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setTab(item.id)} className={`flex flex-col items-center gap-0.5 px-3 py-2.5 text-xs font-medium transition ${tab === item.id ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`}>
                <Icon className="h-5 w-5" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar nav */}
      <nav className="fixed left-0 top-16 z-20 hidden h-[calc(100vh-4rem)] w-48 border-r border-slate-200 bg-white/50 dark:border-slate-800 dark:bg-slate-950/50 lg:block">
        <div className="flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setTab(item.id)} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${tab === item.id ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                <Icon className="h-4 w-4" /> {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals */}
      {showGuide && (
        <GestureGuide
          onClose={() => setShowGuide(false)}
          onPractice={startPractice}
          bookmarks={bookmarks}
          onToggleBookmark={toggleBookmark}
          progress={progress}
        />
      )}

      {practiceTarget && (
        <PracticeMode
          target={practiceTarget}
          current={currentClassification}
          hands={recognition.hands}
          onClose={() => setPracticeTarget(null)}
          onNext={nextPractice}
          onPrev={prevPractice}
          index={practiceIndex}
          total={GUIDE_GESTURES.length}
          onCompleted={markCompleted}
          onPracticeTime={addPracticeTime}
        />
      )}

      {quizActive && (
        <QuizMode
          current={currentClassification}
          onClose={() => setQuizActive(false)}
          onScore={addScore}
        />
      )}

      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
    </div>
  );
}
