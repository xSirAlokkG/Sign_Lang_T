/*
# Create custom_gesture_rules table

1. Purpose
   Allows users to define their own sign-to-meaning mappings using
   simple finger pattern rules (e.g. "index + middle extended with space
   between them = Victory"). These rules augment the built-in rule-based
   gesture classifier at runtime.

2. New Tables
   - custom_gesture_rules
     - id (uuid, primary key)
     - label (text, not null) — the display name, e.g. "Victory"
     - name (text, not null) — uppercase machine name, e.g. "VICTORY"
     - thumb (text, not null) — "extended" | "folded" | "any"
     - index (text, not null) — same enum
     - middle (text, not null)
     - ring (text, not null)
     - pinky (text, not null)
     - fingers_spread (boolean, default false) — true means index & middle
       (or all extended fingers) must have visible space between them
     - confidence (real, default 0.80) — confidence assigned on match
     - created_at (timestamptz, default now())
     - updated_at (timestamptz, default now())

3. Security
   - Enable RLS on custom_gesture_rules.
   - Single-tenant app (no sign-in screen): allow anon + authenticated
     full CRUD because the data is intentionally shared/public on this
     instance.
*/

CREATE TABLE IF NOT EXISTS custom_gesture_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  name text NOT NULL,
  thumb text NOT NULL DEFAULT 'any',
  index text NOT NULL DEFAULT 'any',
  middle text NOT NULL DEFAULT 'any',
  ring text NOT NULL DEFAULT 'any',
  pinky text NOT NULL DEFAULT 'any',
  fingers_spread boolean NOT NULL DEFAULT false,
  confidence real NOT NULL DEFAULT 0.80,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE custom_gesture_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_custom_gestures" ON custom_gesture_rules;
CREATE POLICY "anon_select_custom_gestures" ON custom_gesture_rules
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_custom_gestures" ON custom_gesture_rules;
CREATE POLICY "anon_insert_custom_gestures" ON custom_gesture_rules
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_custom_gestures" ON custom_gesture_rules;
CREATE POLICY "anon_update_custom_gestures" ON custom_gesture_rules
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_custom_gestures" ON custom_gesture_rules;
CREATE POLICY "anon_delete_custom_gestures" ON custom_gesture_rules
  FOR DELETE TO anon, authenticated USING (true);
