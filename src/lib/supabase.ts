
import { createClient } from '@supabase/supabase-js';

// Lee las credenciales de Supabase desde las variables de entorno de Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Valida que las variables de entorno estén presentes y no sean placeholders
const isConfigured = SUPABASE_URL.length > 0 && !SUPABASE_URL.includes('tu-proyecto') && SUPABASE_ANON_KEY.length > 0;

export const supabase = isConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const isSupabaseConfigured = () => isConfigured;
