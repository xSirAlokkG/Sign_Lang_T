/*
# Create transcripts and gesture_events tables (single-tenant, no auth)

1. New Tables
- `transcripts`
  - `id` (uuid, primary key)
  - `text` (text, the accumulated sentence/phrase)
  - `language` (text, target language code, e.g. "en")
  - `created_at` (timestamptz)
- `gesture_events`
  - `id` (uuid, primary key)
  - `transcript_id` (uuid, nullable FK to transcripts)
  - `gesture` (text, the recognized gesture label)
  - `confidence` (real, 0-1)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on both tables.
- Allow anon + authenticated CRUD because this app is intentionally single-tenant / no-sign-in.

3. Notes
- No user_id columns because the app has no sign-in screen.
- gesture_events.transcript_id is nullable so standalone detections can be logged.
*/

CREATE TABLE IF NOT EXISTS transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_transcripts" ON transcripts;
CREATE POLICY "anon_select_transcripts" ON transcripts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_transcripts" ON transcripts;
CREATE POLICY "anon_insert_transcripts" ON transcripts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_transcripts" ON transcripts;
CREATE POLICY "anon_update_transcripts" ON transcripts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_transcripts" ON transcripts;
CREATE POLICY "anon_delete_transcripts" ON transcripts FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS gesture_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id uuid REFERENCES transcripts(id) ON DELETE SET NULL,
  gesture text NOT NULL,
  confidence real NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gesture_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_gesture_events" ON gesture_events;
CREATE POLICY "anon_select_gesture_events" ON gesture_events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_gesture_events" ON gesture_events;
CREATE POLICY "anon_insert_gesture_events" ON gesture_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_gesture_events" ON gesture_events;
CREATE POLICY "anon_update_gesture_events" ON gesture_events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_gesture_events" ON gesture_events;
CREATE POLICY "anon_delete_gesture_events" ON gesture_events FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_gesture_events_transcript ON gesture_events(transcript_id);
CREATE INDEX IF NOT EXISTS idx_gesture_events_created ON gesture_events(created_at DESC);
