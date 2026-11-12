ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.plus_experiences ADD COLUMN IF NOT EXISTS scheduled_date date;
ALTER TABLE public.plus_experiences ADD COLUMN IF NOT EXISTS scheduled_time time without time zone;
ALTER TABLE public.plus_experiences ADD COLUMN IF NOT EXISTS location text;