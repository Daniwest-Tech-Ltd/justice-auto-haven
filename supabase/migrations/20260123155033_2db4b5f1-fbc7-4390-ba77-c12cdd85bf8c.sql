-- Ensure stock sequence table exists
create table if not exists public.stock_sequence (
  id uuid not null default gen_random_uuid() primary key,
  prefix text not null unique,
  last_number integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Ensure the generator function exists and is correct
create or replace function public.auto_assign_stock_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_number integer;
begin
  if new.stock_id is null or new.stock_id = '' then
    insert into public.stock_sequence (prefix, last_number, updated_at)
    values ('JUA-KEN', 0, now())
    on conflict (prefix) do nothing;

    update public.stock_sequence
    set last_number = last_number + 1,
        updated_at = now()
    where prefix = 'JUA-KEN'
    returning last_number into next_number;

    new.stock_id := 'JUA-KEN-' || lpad(next_number::text, 3, '0');
  end if;

  return new;
end;
$$;

-- Create/repair the BEFORE INSERT trigger (this is what was missing)
drop trigger if exists trigger_auto_stock_id on public.cars;
create trigger trigger_auto_stock_id
before insert on public.cars
for each row
execute function public.auto_assign_stock_id();

-- Helpful index for sorting/filtering by date in management pages
create index if not exists cars_created_at_idx on public.cars (created_at desc);

-- Ensure uniqueness at DB-level (should already exist, but keep safe)
create unique index if not exists cars_stock_id_key on public.cars (stock_id)
where stock_id is not null and stock_id <> '';
