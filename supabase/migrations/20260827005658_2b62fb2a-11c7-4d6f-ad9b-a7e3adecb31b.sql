ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at ON public.jobs(deleted_at);

DROP POLICY IF EXISTS "demo_read_jobs" ON public.jobs;
CREATE POLICY "demo_read_jobs" ON public.jobs FOR SELECT TO authenticated USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "demo_delete_jobs" ON public.jobs;
CREATE POLICY "demo_delete_jobs" ON public.jobs FOR DELETE TO authenticated USING (false);