alter table public.groups
  add column if not exists rank text collate "C";

alter table public.bookmarks
  add column if not exists rank text collate "C";

alter table public.groups
  add constraint groups_rank_length_check check (rank is null or char_length(rank) <= 128) not valid;

alter table public.bookmarks
  add constraint bookmarks_rank_length_check check (rank is null or char_length(rank) <= 128) not valid;

with ranked_groups as (
  select
    id,
    lpad((row_number() over (
      partition by user_id
      order by order_index asc nulls last, name asc, created_at asc, id asc
    )::numeric * 1000000000000000000000000000)::text, 32, '0') as next_rank
  from public.groups
  where rank is null
)
update public.groups as target
set rank = ranked_groups.next_rank
from ranked_groups
where target.id = ranked_groups.id;

with ranked_bookmarks as (
  select
    id,
    lpad((row_number() over (
      partition by user_id, group_id
      order by order_index asc nulls last, created_at desc, id asc
    )::numeric * 1000000000000000000000000000)::text, 32, '0') as next_rank
  from public.bookmarks
  where rank is null
)
update public.bookmarks as target
set rank = ranked_bookmarks.next_rank
from ranked_bookmarks
where target.id = ranked_bookmarks.id;

alter table public.groups validate constraint groups_rank_length_check;
alter table public.bookmarks validate constraint bookmarks_rank_length_check;

create index if not exists groups_user_id_rank_idx
  on public.groups using btree (user_id, rank);

create index if not exists bookmarks_user_id_group_id_rank_idx
  on public.bookmarks using btree (user_id, group_id, rank);
