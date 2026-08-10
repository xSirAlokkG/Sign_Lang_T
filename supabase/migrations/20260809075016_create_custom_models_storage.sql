/*
# Create custom_models table and storage bucket

1. Purpose
   Allows users to save their Teachable Machine custom models
   (model.json, metadata.json, weights.bin) to the database so they
   persist across sessions. On app load, the saved model is fetched
   from storage and automatically loaded.

2. New Tables
   - custom_models
     - id (uuid, primary key)
     - name (text) — display name derived from the model.json filename
     - labels (text[]) — the gesture labels extracted from metadata
     - has_weights (boolean) — whether a weights.bin was uploaded
     - has_metadata (boolean) — whether a metadata.json was uploaded
     - created_at (timestamptz)

3. Storage
   - Create bucket "custom-models" (private)
   - Allow anon + authenticated to read/write/delete objects in this bucket
     (single-tenant, no sign-in)

4. Security
   - Enable RLS on custom_models table.
   - Allow anon + authenticated full CRUD (single-tenant, no sign-in).
   - Storage policies allow anon + authenticated on the custom-models bucket.
*/

CREATE TABLE IF NOT EXISTS custom_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  labels text[] NOT NULL DEFAULT '{}',
  has_weights boolean NOT NULL DEFAULT false,
  has_metadata boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE custom_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_custom_models" ON custom_models;
CREATE POLICY "anon_select_custom_models" ON custom_models FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_custom_models" ON custom_models;
CREATE POLICY "anon_insert_custom_models" ON custom_models FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_custom_models" ON custom_models;
CREATE POLICY "anon_update_custom_models" ON custom_models FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_custom_models" ON custom_models;
CREATE POLICY "anon_delete_custom_models" ON custom_models FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('custom-models', 'custom-models', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_read_custom_models_storage" ON storage.objects;
CREATE POLICY "anon_read_custom_models_storage" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'custom-models');

DROP POLICY IF EXISTS "anon_insert_custom_models_storage" ON storage.objects;
CREATE POLICY "anon_insert_custom_models_storage" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'custom-models');

DROP POLICY IF EXISTS "anon_update_custom_models_storage" ON storage.objects;
CREATE POLICY "anon_update_custom_models_storage" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'custom-models') WITH CHECK (bucket_id = 'custom-models');

DROP POLICY IF EXISTS "anon_delete_custom_models_storage" ON storage.objects;
CREATE POLICY "anon_delete_custom_models_storage" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'custom-models');
