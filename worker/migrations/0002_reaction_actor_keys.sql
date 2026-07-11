alter table reactions add column actor_key text;

update reactions
set actor_key = coalesce(
  case when user_id is not null then 'user:' || user_id end,
  case when visitor_key is not null then 'visitor:' || visitor_key end,
  'legacy:' || id
)
where actor_key is null or actor_key = '';

create unique index if not exists idx_reactions_target_actor
  on reactions(target_type, target_id, reaction_type, actor_key);

create index if not exists idx_reactions_actor on reactions(actor_key);
