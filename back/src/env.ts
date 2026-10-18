import type { SupabaseClient } from '@supabase/supabase-js'
export type AppEnv = {
  Bindings: CloudflareBindings
  Variables: { db: SupabaseClient; userId: string; requestId: string }
}
