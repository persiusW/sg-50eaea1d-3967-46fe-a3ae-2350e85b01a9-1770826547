create index if not exists reviews_phone_business_idx
on public.reviews (reviewer_phone, business_id);

create index if not exists reviews_phone_createdat_idx
on public.reviews (reviewer_phone, created_at);

create or replace function public.enforce_review_limits()
returns trigger
language plpgsql
as $$
declare
  per_business_count integer;
  per_day_count integer;
  day_start timestamptz;
  day_end timestamptz;
begin
  if new.reviewer_phone is null or btrim(new.reviewer_phone) = '' then
    raise exception 'REVIEW_PHONE_REQUIRED';
  end if;

  select count(*) into per_business_count
  from public.reviews
  where business_id = new.business_id
    and reviewer_phone = new.reviewer_phone;

  if per_business_count >= 5 then
    raise exception 'LIMIT_PER_BUSINESS_PHONE';
  end if;

  day_start := date_trunc('day', now());
  day_end := day_start + interval '1 day';

  select count(*) into per_day_count
  from public.reviews
  where reviewer_phone = new.reviewer_phone
    and created_at >= day_start
    and created_at < day_end;

  if per_day_count >= 5 then
    raise exception 'LIMIT_PER_DAY_PHONE';
  end if;

  return new;
end;
$$;

drop trigger if exists reviews_limit_trigger on public.reviews;

create trigger reviews_limit_trigger
before insert on public.reviews
for each row
execute function public.enforce_review_limits();