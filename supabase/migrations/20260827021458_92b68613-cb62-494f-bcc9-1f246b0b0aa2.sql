DROP POLICY IF EXISTS demo_read_jobs ON public.jobs;
CREATE POLICY demo_read_jobs ON public.jobs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS demo_update_jobs ON public.jobs;
CREATE POLICY demo_update_jobs ON public.jobs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);