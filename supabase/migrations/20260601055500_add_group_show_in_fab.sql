alter table public.groups
  add column if not exists show_in_fab boolean not null default true;
