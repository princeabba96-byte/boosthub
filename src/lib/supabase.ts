import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://fzhfvspodfwyowazuzaa.supabase.co';
export const SUPABASE_ANON_KEY =
  'sb_publishable_vBssFVuX08-9SMm2-RbS7w_kBA1oaUv';

// Remove any stale GoTrue localStorage token so each account uses its own isolated session
if (typeof window !== 'undefined') {
  try {
    Object.keys(window.localStorage).forEach((key) => {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        window.localStorage.removeItem(key);
      }
    });
  } catch {
    // ignore storage errors
  }
}

export const supabase = createClient(
  'https://fzhfvspodfwyowazuzaa.supabase.co',
  'sb_publishable_vBssFVuX08-9SMm2-RbS7w_kBA1oaUv',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

export const ADMIN_ABBA_UUID = '00000000-0000-4000-8000-000000000001';
export const BOOST_BOT_UUID = '00000000-0000-4000-8000-000000000002';
