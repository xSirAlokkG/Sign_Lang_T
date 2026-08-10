/*
# Add learning progress, bookmarks, and quiz scores tables (single-tenant, no auth)

1. New Tables
- `lesson_progress`
  - `id` (uuid, primary key)
  - `gesture_name` (text, the sign being learned, e.g. "A" or "HELLO")
  - `status` (text: "started" | "completed")
  - `accuracy` (real, best accuracy achieved 0-1)
  - `practice_time_ms` (integer, total practice time in ms)
  - `updated_at` (timestamptz)
  - unique on gesture_name so each sign has one progress row
- `bookmarks`
  - `id` (uuid, primary key)
  - `gesture_name` (text, unique)
  - `created_at` (timestamptz)
- `quiz_scores`
  - `id` (uuid, primary key)
  - `gesture_name` (text, the quiz question)
  - `correct` (boolean)
  - `accuracy` (real, 0-1)
  - `time_ms` (integer, how long the user took)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on all three tables.
- Allow anon + authenticated CRUD (single-tenant, no sign-in).

3. Notes
- lesson_progress is upserted by gesture_name so progress accumulates.
- quiz_scores is append-only history for analytics.
- bookmarks is a simple toggle table keyed by gesture_name.
*/

CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gesture_name text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'started',
  accuracy real NOT NULL DEFAULT 0,
  practice_time_ms integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lesson_progress" ON lesson_progress;
CREATE POLICY "anon_select_lesson_progress" ON lesson_progress FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lesson_progress" ON lesson_progress;
CREATE POLICY "anon_insert_lesson_progress" ON lesson_progress FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lesson_progress" ON lesson_progress;
CREATE POLICY "anon_update_lesson_progress" ON lesson_progress FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lesson_progress" ON lesson_progress;
CREATE POLICY "anon_delete_lesson_progress" ON lesson_progress FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gesture_name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bookmarks" ON bookmarks;
CREATE POLICY "anon_select_bookmarks" ON bookmarks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bookmarks" ON bookmarks;
CREATE POLICY "anon_insert_bookmarks" ON bookmarks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bookmarks" ON bookmarks;
CREATE POLICY "anon_delete_bookmarks" ON bookmarks FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS quiz_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gesture_name text NOT NULL,
  correct boolean NOT NULL DEFAULT false,
  accuracy real NOT NULL DEFAULT 0,
  time_ms integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_quiz_scores" ON quiz_scores;
CREATE POLICY "anon_select_quiz_scores" ON quiz_scores FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_quiz_scores" ON quiz_scores;
CREATE POLICY "anon_insert_quiz_scores" ON quiz_scores FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_quiz_scores" ON quiz_scores;
CREATE POLICY "anon_delete_quiz_scores" ON quiz_scores FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_status ON lesson_progress(status);
CREATE INDEX IF NOT EXISTS idx_quiz_scores_created ON quiz_scores(created_at DESC);
