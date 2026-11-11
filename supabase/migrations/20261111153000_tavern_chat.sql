-- Academia RPG · Taverna chat
-- Global channel and guild-only channel with server-validated sender identity.

create table if not exists public.tavern_messages (
  id bigint generated always as identity primary key,
  channel_type text not null check (channel_type in ('global', 'guild')),
  guild_id uuid references public.guilds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null,
  sender_avatar text not null default '🧙',
  sender_class text,
  sender_appearance jsonb not null default '{}'::jsonb check (jsonb_typeof(sender_appearance) = 'object'),
  content text not null check (char_length(content) between 1 and 400),
  created_at timestamptz not null default now(),
  constraint tavern_channel_guild_match check (
    (channel_type = 'global' and guild_id is null)
    or (channel_type = 'guild' and guild_id is not null)
  )
);

create index if not exists tavern_messages_global_created_idx
  on public.tavern_messages (created_at desc)
  where channel_type = 'global';

create index if not exists tavern_messages_guild_created_idx
  on public.tavern_messages (guild_id, created_at desc)
  where channel_type = 'guild';

create index if not exists tavern_messages_user_created_idx
  on public.tavern_messages (user_id, created_at desc);

alter table public.guild_members enable row level security;
drop policy if exists tavern_read_own_guild_membership on public.guild_members;
create policy tavern_read_own_guild_membership
  on public.guild_members for select to authenticated
  using (user_id = (select auth.uid()));
grant select on public.guild_members to authenticated;

alter table public.tavern_messages enable row level security;
drop policy if exists tavern_messages_read on public.tavern_messages;
create policy tavern_messages_read
  on public.tavern_messages for select to authenticated
  using (
    channel_type = 'global'
    or public.is_academy_teacher()
    or exists (
      select 1
      from public.guild_members gm
      where gm.guild_id = tavern_messages.guild_id
        and gm.user_id = (select auth.uid())
    )
  );

drop policy if exists tavern_messages_delete_own_or_teacher on public.tavern_messages;
create policy tavern_messages_delete_own_or_teacher
  on public.tavern_messages for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_academy_teacher());

revoke all on public.tavern_messages from anon, public, authenticated;
grant select, delete on public.tavern_messages to authenticated;

create or replace function public.send_tavern_message(
  p_channel_type text,
  p_content text,
  p_guild_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid uuid := auth.uid();
  v_content text := btrim(coalesce(p_content, ''));
  v_name text;
  v_avatar text;
  v_class text;
  v_appearance jsonb;
  v_message public.tavern_messages%rowtype;
begin
  if v_uid is null then
    raise exception 'Entre com sua conta para conversar na Taverna.';
  end if;

  if p_channel_type not in ('global', 'guild') then
    raise exception 'Canal inválido.';
  end if;

  if char_length(v_content) < 1 or char_length(v_content) > 400 then
    raise exception 'A mensagem deve ter entre 1 e 400 caracteres.';
  end if;

  if p_channel_type = 'global' then
    if p_guild_id is not null then
      raise exception 'O canal global não aceita identificação de guilda.';
    end if;
  else
    if p_guild_id is null or not exists (
      select 1
      from public.guild_members gm
      join public.guilds g on g.id = gm.guild_id
      where gm.guild_id = p_guild_id
        and gm.user_id = v_uid
        and g.active = true
    ) then
      raise exception 'Você precisa fazer parte de uma guilda ativa para conversar aqui.';
    end if;
  end if;

  if exists (
    select 1
    from public.tavern_messages m
    where m.user_id = v_uid
      and m.created_at > now() - interval '1100 milliseconds'
  ) then
    raise exception 'Aguarde um instante antes de enviar outra mensagem.';
  end if;

  select
    coalesce(nullif(btrim(p.adventurer_name), ''), nullif(btrim(p.display_name), ''), 'Aventureiro'),
    coalesce(nullif(p.avatar, ''), '🧙'),
    p.class,
    coalesce(p.appearance, '{}'::jsonb)
  into v_name, v_avatar, v_class, v_appearance
  from public.player_profiles p
  where p.user_id = v_uid;

  v_name := coalesce(v_name, 'Aventureiro');
  v_avatar := coalesce(v_avatar, '🧙');
  v_appearance := coalesce(v_appearance, '{}'::jsonb);

  insert into public.tavern_messages (
    channel_type, guild_id, user_id, sender_name, sender_avatar,
    sender_class, sender_appearance, content
  )
  values (
    p_channel_type,
    case when p_channel_type = 'guild' then p_guild_id else null end,
    v_uid, v_name, v_avatar, v_class, v_appearance, v_content
  )
  returning * into v_message;

  return jsonb_build_object(
    'id', v_message.id,
    'channel_type', v_message.channel_type,
    'guild_id', v_message.guild_id,
    'user_id', v_message.user_id,
    'sender_name', v_message.sender_name,
    'sender_avatar', v_message.sender_avatar,
    'sender_class', v_message.sender_class,
    'sender_appearance', v_message.sender_appearance,
    'content', v_message.content,
    'created_at', v_message.created_at
  );
end;
$function$;

revoke all on function public.send_tavern_message(text, text, uuid) from public, anon;
grant execute on function public.send_tavern_message(text, text, uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'tavern_messages'
     ) then
    execute 'alter publication supabase_realtime add table public.tavern_messages';
  end if;
end
$$;
