ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS auto_apply boolean NOT NULL DEFAULT false;