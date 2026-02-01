alter table public.flagged_numbers
add column if not exists status text not null default 'UNDER_REVIEW';