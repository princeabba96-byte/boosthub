import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://fzhfvspodfwyowazuzaa.supabase.co';

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_vBssFVuX08-9SMm2-RbS7w_kBA1oaUv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    lock: async (_name, _acquireTimeout, fn) => {
      return await fn();
    },
  },
});

export const ADMIN_ABBA_UUID = 'eaada352-5704-4566-a7a7-88df80853ada';
export const BOOST_BOT_UUID = '00000000-0000-4000-8000-000000000001';
