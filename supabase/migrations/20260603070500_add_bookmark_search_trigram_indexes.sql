create extension if not exists pg_trgm with schema extensions;

create index if not exists bookmarks_title_trgm_idx
  on public.bookmarks using gin (title gin_trgm_ops);

create index if not exists bookmarks_domain_trgm_idx
  on public.bookmarks using gin (domain gin_trgm_ops);
