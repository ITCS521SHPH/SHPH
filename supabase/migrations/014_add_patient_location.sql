-- Add district column to patient profiles
alter table public.patients
  add column if not exists district text;

comment on column public.patients.district is 'Primary district for the patient (e.g. Bangkok district name)';
