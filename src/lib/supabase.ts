
import { createClient } from '@supabase/supabase-js';

// Credenciales del proyecto TurnoLibrev2
const SUPABASE_URL = 'https://vfhsvujyxfswimvlaxny.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaHN2dWp5eGZzd2ltdmxheG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4OTY4NjgsImV4cCI6MjA4MDQ3Mjg2OH0.vcKmalCmy6ssy1Gy2fFlsCVBiZcYrkVS0r8_6cf3giY';

// Simple validation
const isConfigured = SUPABASE_URL.length > 0 && !SUPABASE_URL.includes('tu-proyecto');

export const supabase = isConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const isSupabaseConfigured = () => isConfigured;
