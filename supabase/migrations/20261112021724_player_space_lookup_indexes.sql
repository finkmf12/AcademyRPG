-- Índices para consultas por visitante e autor dos recados.
create index if not exists player_space_likes_visitor_idx
  on public.player_space_likes (visitor_id);
create index if not exists player_space_messages_author_idx
  on public.player_space_messages (author_id, created_at desc);