import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vvlbhihvmwxajrezqvsf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ucObdhcAJ-fI3xbkShPt1Q_hF6uXw0N';

export function isSupabaseCircuitOpen() {
  return false;
}

// Resilient direct fetch to Supabase with generous 30s timeout so writes never fail prematurely
const reliableSupabaseFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: false
  },
  global: {
    fetch: reliableSupabaseFetch
  }
});
