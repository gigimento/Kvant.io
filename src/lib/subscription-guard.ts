import { createClient as createServerClient } from "@/lib/supabase/server"

export async function checkServerAccess(_feature?: string): Promise<{ allowed: boolean; reason?: string }> {
  return { allowed: true }
}
