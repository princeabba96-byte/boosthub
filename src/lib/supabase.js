import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://fzhfvspodfwyowazuzaa.supabase.co';
export const SUPABASE_ANON_KEY =
  'sb_publishable_vBssFVuX08-9SMm2-RbS7w_kBA1oaUv';

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
export const ADMIN_ABBA_ALT_UUID = 'eaada352-5704-4566-a7a7-88df80853ada';
export const BOOST_BOT_UUID = '00000000-0000-4000-8000-000000000099';
