-- Add district column to VHV profiles
alter table public.vhvs
  add column if not exists district text;

comment on column public.vhvs.district is 'Primary district assignment for the VHV (e.g. Bangkok district name)';

-- Ensure updated_at is refreshed automatically when district changes
create or replace function public.set_vhv_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_vhv_updated_at on public.vhvs;

create trigger set_vhv_updated_at
before update on public.vhvs
for each row
execute function public.set_vhv_updated_at();
