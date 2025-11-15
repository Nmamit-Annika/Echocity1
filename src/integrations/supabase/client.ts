// SUPABASE CLIENT - Connected to correct project
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Using correct project URLs
const SUPABASE_URL = 'https://iicloyxnyuhsulowbxfs.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpY2xveXhueXVoc3Vsb3dieGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTEzNTYsImV4cCI6MjA3ODUyNzM1Nn0.Rg4AEErRg8QXifAqnccTxj_YsnuwNcUx5uT-wIqWx7Y';

console.log('✅ Supabase connected to:', SUPABASE_URL);

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!SUPABASE_URL,
    hasKey: !!SUPABASE_PUBLISHABLE_KEY,
    allEnvVars: (import.meta as any).env
  });
  throw new Error('Missing Supabase environment variables');
}

if (!SUPABASE_URL.startsWith('https://')) {
  throw new Error('Invalid Supabase URL format');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});