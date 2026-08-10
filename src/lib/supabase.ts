import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey);

export type Transcript = {
  id: string;
  text: string;
  language: string;
  created_at: string;
};

export type GestureEvent = {
  id: string;
  transcript_id: string | null;
  gesture: string;
  confidence: number;
  created_at: string;
};
