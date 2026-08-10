import { useEffect, useRef, useState } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { getHandLandmarker, detect, type HandResult } from '@/lib/handLandmarker';
import { classifyGesture, gestureDisplay } from '@/lib/gestures';
import { addDetection, buildSentence, clearSentence, undoLastWord, createSentenceState, type SentenceState } from '@/lib/sentence';
import type { GestureClassifier } from '@/lib/modelRegistry';
import type { Classification } from '@/lib/gestures';
import { fetchRules, classifyWithCustom, type CustomGestureRule } from '@/lib/customGestures';

export type RecognitionState = {
  active: boolean;
  error: string | null;
  modelError: boolean;
  hands: HandResult[];
  currentGesture: string | null;
  smoothedGesture: string | null;
  confidence: number;
  sentenceText: string;
  fps: number;
  inferenceMs: number;
  threshold: number;
  setThreshold: (n: number) => void;
  facingMode: 'user' | 'environment';
  switchCamera: () => void;
  start: () => Promise<void>;
  stop: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  clearSentence: () => void;
  undoWord: () => void;
  setSentenceWords: (words: string[]) => void;
  classifier: GestureClassifier | null;
  setClassifier: (c: GestureClassifier | null) => void;
  classifierLabels: string[];
  modelSource: 'builtin' | 'custom';
  customRules: CustomGestureRule[];
  reloadRules: () => Promise<void>;
};

const DEFAULT_THRESHOLD = 0.85;

export function useRecognition(): RecognitionState {
  const { videoRef, active, error, facingMode, switchCamera, start, stop } = useCamera();
  const [hands, setHands] = useState<HandResult[]>([]);
  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [smoothedGesture, setSmoothedGesture] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [sentenceText, setSentenceText] = useState('');
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [fps, setFps] = useState(0);
  const [inferenceMs, setInferenceMs] = useState(0);
  const [modelError, setModelError] = useState(false);
  const [classifier, setClassifier] = useState<GestureClassifier | null>(null);
  const [classifierLabels, setClassifierLabels] = useState<string[]>([]);
  const [modelSource, setModelSource] = useState<'builtin' | 'custom'>('builtin');
  const [customRules, setCustomRules] = useState<CustomGestureRule[]>([]);

  const sentenceRef = useRef<SentenceState>(createSentenceState());
  const rafRef = useRef<number | null>(null);
  const landmarkerRef = useRef<Awaited<ReturnType<typeof getHandLandmarker>> | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const frameCountRef = useRef(0);
  const fpsTimeRef = useRef(performance.now());
  const classifierRef = useRef<GestureClassifier | null>(null);
  const customRulesRef = useRef<CustomGestureRule[]>([]);
  const thresholdRef = useRef(threshold);
  thresholdRef.current = threshold;
  customRulesRef.current = customRules;

  const reloadRules = async () => {
    const r = await fetchRules();
    setCustomRules(r);
    customRulesRef.current = r;
  };

  useEffect(() => { reloadRules(); }, []);

  useEffect(() => {
    classifierRef.current = classifier;
    if (classifier) {
      setModelSource('custom');
      setClassifierLabels(classifier.labels);
      setThreshold(0.5);
    } else {
      setModelSource('builtin');
      setClassifierLabels([]);
      setThreshold(DEFAULT_THRESHOLD);
    }
  }, [classifier]);

  useEffect(() => {
    if (!active) {
      setHands([]);
      return;
    }
    let cancelled = false;
    (async () => {
      if (!landmarkerRef.current) {
        try {
          landmarkerRef.current = await getHandLandmarker();
        } catch {
          if (!cancelled) setModelError(true);
          return;
        }
      }
      const loop = () => {
        if (cancelled) return;
        const video = videoRef.current;
        const lm = landmarkerRef.current;
        if (video && lm && video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          const now = performance.now();
          const t0 = performance.now();
          try {
            const res = detect(lm, video, now);
            setInferenceMs(performance.now() - t0);
            setHands(res.hands);
            const primary = res.hands[0];
            let raw: Classification | null = null;
            if (primary) {
              const clf = classifierRef.current;
              if (clf) {
                const result = clf.classify(primary.landmarks, video);
                raw = result;
              } else if (customRulesRef.current.length > 0) {
                raw = classifyWithCustom(primary.landmarks, customRulesRef.current);
              } else {
                raw = classifyGesture(primary.landmarks);
              }
            }
            const { state: newState, smoothed } = addDetection(sentenceRef.current, raw, now, thresholdRef.current);
            sentenceRef.current = newState;
            setSentenceText(buildSentence(newState.words));
            if (smoothed) {
              setSmoothedGesture(smoothed.name);
              setConfidence(smoothed.confidence);
              setCurrentGesture(smoothed.name);
            } else if (!raw) {
              setCurrentGesture(null);
              setConfidence(0);
              setSmoothedGesture(null);
            }
          } catch {
            // skip frame
          }
          frameCountRef.current++;
          const elapsed = now - fpsTimeRef.current;
          if (elapsed >= 1000) {
            setFps(Math.round((frameCountRef.current * 1000) / elapsed));
            frameCountRef.current = 0;
            fpsTimeRef.current = now;
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    })();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const handleClear = () => {
    sentenceRef.current = clearSentence(sentenceRef.current);
    setSentenceText('');
    setCurrentGesture(null);
    setConfidence(0);
    setSmoothedGesture(null);
  };

  const handleUndo = () => {
    sentenceRef.current = undoLastWord(sentenceRef.current);
    setSentenceText(buildSentence(sentenceRef.current.words));
  };

  const handleSetWords = (words: string[]) => {
    sentenceRef.current = { ...sentenceRef.current, words };
    setSentenceText(buildSentence(words));
  };

  return {
    active,
    error,
    modelError,
    hands,
    currentGesture,
    smoothedGesture,
    confidence,
    sentenceText,
    fps,
    inferenceMs,
    threshold,
    setThreshold,
    facingMode,
    switchCamera,
    start,
    stop,
    videoRef,
    clearSentence: handleClear,
    undoWord: handleUndo,
    setSentenceWords: handleSetWords,
    classifier,
    setClassifier,
    classifierLabels,
    modelSource,
    customRules,
    reloadRules,
  };
}

export { gestureDisplay };
