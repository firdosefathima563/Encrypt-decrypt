-- supabase/schema.sql
-- Run this in the Supabase SQL editor to create the table the backend
-- uses for the optional "save to history" feature.

create extension if not exists pgcrypto;

create table if not exists history (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  type text not null check (type in ('rsa', 'caesar', 'password')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists history_session_id_idx on history (session_id);
create index if not exists history_created_at_idx on history (created_at desc);

-- Row Level Security: the backend talks to Supabase using the service role
-- key (which bypasses RLS), so this just locks the table down from any
-- other client (e.g. if the anon key were ever exposed in the frontend).
alter table history enable row level security;

-- No policies are created, which means only the service role key can
-- read/write — exactly what we want since the Express backend is the only
-- thing that should be talking to this table.
