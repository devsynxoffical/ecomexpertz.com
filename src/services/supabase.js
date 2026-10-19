import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vvlbhihvmwxajrezqvsf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ucObdhcAJ-fI3xbkShPt1Q_hF6uXw0N';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
