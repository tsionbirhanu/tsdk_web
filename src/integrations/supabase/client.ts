import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log("[Supabase] Connecting to:", SUPABASE_URL);

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);

// Connection test — verify tables exist in new DB
supabase
  .from("profiles")
  .select("count", { count: "exact", head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error(
        "[Supabase] DB connection ERROR:",
        error.message,
        error.code,
      );
    } else {
      console.log(
        "[Supabase] DB connected OK — profiles table row count:",
        count,
      );
    }
  });
