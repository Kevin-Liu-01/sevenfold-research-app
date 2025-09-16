create extension if not exists pg_trgm;
create extension if not exists unaccent;

create or replace function immutable_unaccent(text)
returns text as $$
select unaccent('public.unaccent', $1);
$$ language sql immutable;

create index if not exists paper_attrs_title_trgm_idx
on public.paper_attrs using gin (
  (lower(immutable_unaccent(title))) gin_trgm_ops
);


create or replace function public.fuzzy_title_search(
  input_title  text,
  min_sim      real default 0.70,
  limit_count  int  default 5
)
returns setof paper_attrs
language sql
stable
as $$
  with params as (
    select
      lower(immutable_unaccent(coalesce(input_title, ''))) as q_title,
      set_limit(min_sim)                                   as _set
    from (select min_sim) s
  )
  select pa.*
  from params p
  join paper_attrs pa
    on lower(immutable_unaccent(pa.title)) % p.q_title
  where similarity(lower(immutable_unaccent(pa.title)), p.q_title) >= min_sim
  order by similarity(lower(immutable_unaccent(pa.title)), p.q_title) desc, pa.id
  limit limit_count;
$$;
