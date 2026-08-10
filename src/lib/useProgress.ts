import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

export type LessonProgress = {
  id: string;
  gesture_name: string;
  status: 'started' | 'completed';
  accuracy: number;
  practice_time_ms: number;
  updated_at: string;
};

export type QuizScore = {
  id: string;
  gesture_name: string;
  correct: boolean;
  accuracy: number;
  time_ms: number;
  created_at: string;
};

export type ProgressMap = Record<string, LessonProgress>;

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from('lesson_progress').select('*');
    const map: ProgressMap = {};
    (data as LessonProgress[] | null)?.forEach((p) => {
      map[p.gesture_name] = p;
    });
    setProgress(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upsert = useCallback(
    async (gestureName: string, patch: Partial<LessonProgress>) => {
      const existing = progress[gestureName];
      const merged: Partial<LessonProgress> = {
        gesture_name: gestureName,
        status: patch.status ?? existing?.status ?? 'started',
        accuracy: Math.max(patch.accuracy ?? 0, existing?.accuracy ?? 0),
        practice_time_ms: (existing?.practice_time_ms ?? 0) + (patch.practice_time_ms ?? 0),
        updated_at: new Date().toISOString(),
      };
      setProgress((prev) => ({
        ...prev,
        [gestureName]: { ...(existing as LessonProgress), ...merged } as LessonProgress,
      }));
      await supabase.from('lesson_progress').upsert(merged, { onConflict: 'gesture_name' });
    },
    [progress],
  );

  const markCompleted = useCallback(
    (gestureName: string, accuracy: number) => {
      upsert(gestureName, { status: 'completed', accuracy });
    },
    [upsert],
  );

  const addPracticeTime = useCallback(
    (gestureName: string, ms: number) => {
      upsert(gestureName, { practice_time_ms: ms });
    },
    [upsert],
  );

  return { progress, loading, markCompleted, addPracticeTime, reload: load };
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from('bookmarks').select('*');
    setBookmarks(new Set((data as { gesture_name: string }[] | null)?.map((b) => b.gesture_name) ?? []));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(
    async (gestureName: string) => {
      setBookmarks((prev) => {
        const next = new Set(prev);
        if (next.has(gestureName)) next.delete(gestureName);
        else next.add(gestureName);
        return next;
      });
      if (bookmarks.has(gestureName)) {
        await supabase.from('bookmarks').delete().eq('gesture_name', gestureName);
      } else {
        await supabase.from('bookmarks').insert({ gesture_name: gestureName });
      }
    },
    [bookmarks, load],
  );

  return { bookmarks, loading, toggle };
}

export function useQuizScores() {
  const [scores, setScores] = useState<QuizScore[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('quiz_scores')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setScores((data as QuizScore[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addScore = useCallback(async (score: Omit<QuizScore, 'id' | 'created_at'>) => {
    const { data } = await supabase
      .from('quiz_scores')
      .insert(score)
      .select()
      .single();
    if (data) setScores((prev) => [data as QuizScore, ...prev]);
  }, []);

  return { scores, loading, addScore };
}
