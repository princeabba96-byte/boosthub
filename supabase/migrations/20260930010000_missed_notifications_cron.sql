-- ============================================================================
-- BoostHub Missed Notifications & Real-Time Web Push Cron Job (Supabase)
-- Checks for missed notifications (likes, comments, followers, messages while
-- offline) every minute via pg_cron and triggers the 'send-push' Edge Function.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Ensure push delivery tracking columns exist on notifications and messages
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.notifications
      ADD COLUMN IF NOT EXISTS push_sent BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS push_sent_at TIMESTAMPTZ;

    CREATE INDEX IF NOT EXISTS idx_notifications_missed_push
      ON public.notifications (user_id, is_read, push_sent, created_at);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'messages'
  ) THEN
    ALTER TABLE public.messages
      ADD COLUMN IF NOT EXISTS push_sent BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS push_sent_at TIMESTAMPTZ;

    CREATE INDEX IF NOT EXISTS idx_messages_missed_push
      ON public.messages (receiver_id, is_read, push_sent, created_at);
  END IF;
END $$;

-- 2. Function invoked by pg_cron every minute to check for missed notifications
--    and trigger the 'send-push' Edge Function for users with active subscriptions.
CREATE OR REPLACE FUNCTION public.check_and_send_missed_push_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_role_key TEXT;
BEGIN
  -- Read project URL and service key from database settings / vault
  v_supabase_url := COALESCE(
    current_setting('app.settings.supabase_url', true),
    current_setting('supabase.url', true)
  );
  v_service_role_key := COALESCE(
    current_setting('app.settings.service_role_key', true),
    current_setting('supabase.service_role_key', true)
  );

  -- Invoke the 'send-push' Edge Function in check_missed mode so it scans
  -- all unsent notifications & offline messages and dispatches Web Push alerts.
  IF v_supabase_url IS NOT NULL AND v_supabase_url <> '' THEN
    PERFORM net.http_post(
      url := rtrim(v_supabase_url, '/') || '/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(v_service_role_key, '')
      ),
      body := jsonb_build_object(
        'mode', 'check_missed',
        'source', 'pg_cron'
      )
    );
  END IF;
END;
$$;

-- 3. Schedule recurring cron job every minute (* * * * *)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('boosthub-missed-notifications-push')
    WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'boosthub-missed-notifications-push'
    );

    PERFORM cron.schedule(
      'boosthub-missed-notifications-push',
      '* * * * *',
      $cron$SELECT public.check_and_send_missed_push_notifications();$cron$
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron schedule setup skipped or deferred: %', SQLERRM;
END $$;
