create table if not exists public.scam_reports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null,
  phone text null,
  name_on_number text null,
  connected_page text null,
  platform text null,
  description text not null,
  submitter_name text not null,
  submitter_phone text not null,
  evidence_url text null,
  status text not null default 'NEW',
  business_id uuid null references public.businesses(id) on delete set null,
  converted_review_id uuid null references public.reviews(id) on delete set null,
  converted_at timestamptz null,
  created_at timestamptz not null default now()
);

alter table public.scam_reports enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'scam_reports'
      and policyname = 'Allow anon insert scam_reports'
  ) then
    create policy "Allow anon insert scam_reports"
      on public.scam_reports
      for insert
      to anon
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'scam_reports'
      and policyname = 'Allow authenticated full access scam_reports'
  ) then
    create policy "Allow authenticated full access scam_reports"
      on public.scam_reports
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end
$$;