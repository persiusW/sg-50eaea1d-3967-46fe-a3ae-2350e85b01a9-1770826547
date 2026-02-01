alter table public.scam_reports
add column if not exists platforms text[] null;

alter table public.businesses
add column if not exists platforms text[] null;