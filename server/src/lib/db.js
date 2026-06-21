// src/lib/db.js
// Thin persistence layer. Uses Supabase if SUPABASE_URL + SUPABASE_SERVICE_KEY
// are set; otherwise falls back to an in-memory store so the API still works
// during local development or before Supabase is wired up.
//
// Expected Supabase table (see supabase/schema.sql):
//
// create table history (
//   id uuid primary key default gen_random_uuid(),
//   session_id text not null,
//   type text not null,           -- 'rsa' | 'caesar' | 'password'
//   payload jsonb not null,
//   created_at timestamptz not null default now()
// );

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const useSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

let supabase = null;
if (useSupabase) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

// In-memory fallback store: sessionId -> array of entries
const memoryStore = new Map();
const MAX_MEMORY_ENTRIES_PER_SESSION = 200;

export const dbMode = useSupabase ? "supabase" : "memory";

export async function saveHistoryEntry({ sessionId, type, payload }) {
  if (useSupabase) {
    const { data, error } = await supabase
      .from("history")
      .insert({ session_id: sessionId, type, payload })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    session_id: sessionId,
    type,
    payload,
    created_at: new Date().toISOString(),
  };
  const existing = memoryStore.get(sessionId) || [];
  existing.unshift(entry);
  if (existing.length > MAX_MEMORY_ENTRIES_PER_SESSION) existing.length = MAX_MEMORY_ENTRIES_PER_SESSION;
  memoryStore.set(sessionId, existing);
  return entry;
}

export async function listHistory({ sessionId, type, limit = 50 }) {
  if (useSupabase) {
    let query = supabase
      .from("history")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (type) query = query.eq("type", type);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  let entries = memoryStore.get(sessionId) || [];
  if (type) entries = entries.filter((e) => e.type === type);
  return entries.slice(0, limit);
}

export async function deleteHistoryEntry({ sessionId, id }) {
  if (useSupabase) {
    const { error } = await supabase
      .from("history")
      .delete()
      .eq("session_id", sessionId)
      .eq("id", id);
    if (error) throw error;
    return true;
  }

  const existing = memoryStore.get(sessionId) || [];
  const next = existing.filter((e) => e.id !== id);
  memoryStore.set(sessionId, next);
  return true;
}

export async function clearHistory({ sessionId }) {
  if (useSupabase) {
    const { error } = await supabase.from("history").delete().eq("session_id", sessionId);
    if (error) throw error;
    return true;
  }
  memoryStore.delete(sessionId);
  return true;
}
