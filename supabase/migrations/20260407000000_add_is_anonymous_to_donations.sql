-- Add anonymous donation flag for public identity handling
alter table public.donations
add column if not exists is_anonymous boolean not null default false;
