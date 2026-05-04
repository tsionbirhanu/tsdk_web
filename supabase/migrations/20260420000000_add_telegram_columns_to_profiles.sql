alter table public.profiles
add column if not exists telegram_chat_id bigint,
add column if not exists telegram_connected boolean not null default false,
add column if not exists telegram_username text;
