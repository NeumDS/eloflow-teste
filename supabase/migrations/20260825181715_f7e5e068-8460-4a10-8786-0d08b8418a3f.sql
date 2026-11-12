
alter table public.challenge_submissions add column if not exists video_url text;
alter table public.challenges add column if not exists status text not null default 'aberto';
