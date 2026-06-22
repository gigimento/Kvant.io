import { createBrowserClient } from "@supabase/ssr"

const COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
  sameSite: "lax" as const,
  secure: process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ?? false,
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === "undefined") return []
          return document.cookie.split("; ").filter(Boolean).map((c) => {
            const [name, ...rest] = c.split("=")
            return { name, value: decodeURIComponent(rest.join("=")) }
          })
        },
        setAll(cookies) {
          cookies.forEach(({ name, value }) => {
            document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=${COOKIE_OPTIONS.path}; Max-Age=${COOKIE_OPTIONS.maxAge}; SameSite=${COOKIE_OPTIONS.sameSite}${COOKIE_OPTIONS.secure ? "; Secure" : ""}`
          })
        },
      },
    }
  )
}
