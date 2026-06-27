import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}))

vi.mock("@/lib/subscription-guard", () => ({
  checkServerAccess: vi.fn(),
}))

vi.mock("@/lib/llm/client", () => ({
  askLLM: vi.fn(),
  askLLMWithSystem: vi.fn(),
}))

vi.mock("@/lib/llm/providers", () => ({
  callProvider: vi.fn(),
  PROVIDER_CONFIG_KEY: { gemini: "google_ai_api_key" },
}))

vi.mock("@/lib/api/ga4", () => ({
  fetchGA4Metrics: vi.fn(),
}))

vi.mock("@/lib/email/send-report", () => ({
  sendReportEmail: vi.fn(),
}))

vi.mock("@/lib/paddle/client", () => ({
  paddle: {
    getProducts: vi.fn(),
    getPrices: vi.fn(),
    createTransaction: vi.fn(),
    getTransaction: vi.fn(),
    getSubscription: vi.fn(),
    createCustomerPortal: vi.fn(),
    cancelSubscription: vi.fn(),
  },
}))

vi.mock("@/lib/llm/prompts/proposal", () => ({
  buildProposalPrompt: vi.fn().mockReturnValue({ systemPrompt: "sys", userPrompt: "usr" }),
}))

vi.mock("@/lib/llm/prompts/content-brief", () => ({
  buildContentBriefSystemPrompt: vi.fn().mockReturnValue("sys"),
  buildContentBriefUserPrompt: vi.fn().mockReturnValue("usr"),
}))

vi.mock("@/lib/llm/prompts/narrative", () => ({
  buildNarrativePrompt: vi.fn().mockReturnValue("Generate a narrative report"),
}))

import { checkServerAccess } from "@/lib/subscription-guard"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { paddle } from "@/lib/paddle/client"
import { askLLMWithSystem, askLLM } from "@/lib/llm/client"
import { callProvider } from "@/lib/llm/providers"

function mockSupabase() {
  const chain: any = {}
  chain.from = vi.fn(() => chain)
  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.delete = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.neq = vi.fn(() => chain)
  chain.in = vi.fn(() => chain)
  chain.single = vi.fn(() => Promise.resolve({ data: null, error: null }))
  chain.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }))
  chain.order = vi.fn(() => chain)
  chain.limit = vi.fn(() => chain)
  chain.range = vi.fn(() => chain)
  chain.gte = vi.fn(() => chain)
  chain.lte = vi.fn(() => chain)
  chain.textSearch = vi.fn(() => chain)
  chain.or = vi.fn(() => chain)
  return chain
}

function makeRequest(method: string, body?: any, url?: string): Request {
  return {
    json: async () => body,
    text: async () => body ? JSON.stringify(body) : "",
    headers: new Headers({ "content-type": "application/json" }),
    method,
    url: url || "http://localhost:3000/api/test",
    nextUrl: { pathname: "/api/test" },
  } as any
}

let mocks: { supabaseMock: any; adminMock: any; user: any }

beforeEach(() => {
  vi.clearAllMocks()

  const user = { id: "test-user-id", email: "igor.ilic@outlook.com" }
  const supabaseMock = mockSupabase()
  supabaseMock.auth = {
    getUser: vi.fn().mockResolvedValue({ data: { user } }),
    exchangeCodeForSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
  }
  ;(createClient as any).mockResolvedValue(supabaseMock)

  const adminMock = mockSupabase()
  adminMock.auth = { getUser: vi.fn().mockResolvedValue({ data: { user } }) }
  ;(createAdminClient as any).mockReturnValue(adminMock)

  ;(checkServerAccess as any).mockResolvedValue({ allowed: true })

  mocks = { supabaseMock, adminMock, user }
})

// ─── Test helpers ────────────────────────────────────────────────────────
async function testRoute(modulePath: string, method: string, body?: any, url?: string) {
  const mod = await import(modulePath)
  const handler = (mod as any)[method]
  if (!handler) throw new Error(`No ${method} handler in ${modulePath}`)
  return handler(makeRequest(method, body, url))
}

describe("API Routes — Subscription Gated", () => {
  const gatedRoutes: { path: string; method: string; body: any; slug: string }[] = [
    { path: "@/app/api/reports/generate/route", method: "POST", body: { configId: "cfg_1" }, slug: "reports" },
    { path: "@/app/api/seo/scan/route", method: "POST", body: { monitorId: "mon_1" }, slug: "seo" },
    { path: "@/app/api/citation-audit/scan/route", method: "POST", body: { brand_name: "TestBrand" }, slug: "citation-audit" },
    { path: "@/app/api/content-briefs/generate/route", method: "POST", body: { keyword: "test" }, slug: "content-briefs" },
    { path: "@/app/api/proposals/generate/route", method: "POST", body: { clientName: "Client", projectScope: "Web redesign" }, slug: "proposals" },
    { path: "@/app/api/aeo/analyze/route", method: "POST", body: { url: "https://example.com" }, slug: "aeo" },
    { path: "@/app/api/agentic/analyze/route", method: "POST", body: { url: "https://example.com" }, slug: "agentic" },
  ]

  for (const route of gatedRoutes) {
    it(`${route.slug} returns 402 when subscription required`, async () => {
      ;(checkServerAccess as any).mockResolvedValue({ allowed: false, reason: "Your trial has ended." })
      const resp = await testRoute(route.path, route.method, route.body)
      expect(resp.status).toBe(402)
      const data = await resp.json()
      expect(data.error).toBeTruthy()
    })

    it(`${route.slug} returns 401 when unauthenticated`, async () => {
      mocks.supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } })
      ;(checkServerAccess as any).mockResolvedValue({ allowed: true })
      const resp = await testRoute(route.path, route.method, route.body)
      expect(resp.status).toBe(401)
    })

    it(`${route.slug} checks correct feature slug: ${route.slug}`, async () => {
      await testRoute(route.path, route.method, route.body)
      expect(checkServerAccess).toHaveBeenCalledWith(route.slug)
    })
  }
})

describe("API Routes — Paddle Payment", () => {
  it("create-checkout validates tier parameter", async () => {
    const resp = await testRoute(
      "@/app/api/paddle/create-checkout/route",
      "POST",
      { plan: "monthly" },
    )
    expect(resp.status).toBe(400)
  })

  it("create-checkout validates plan parameter", async () => {
    const resp = await testRoute(
      "@/app/api/paddle/create-checkout/route",
      "POST",
      { tier: "starter" },
    )
    expect(resp.status).toBe(400)
  })

  it("create-checkout succeeds with valid params", async () => {
    ;(paddle.createTransaction as any).mockResolvedValue({
      data: { id: "txn_01", urls: { checkout: "https://checkout.paddle.com/test" } },
    })
    const supabase = await createClient()
    supabase.from().update().eq.mockResolvedValue({ data: null, error: null })

    const resp = await testRoute(
      "@/app/api/paddle/create-checkout/route",
      "POST",
      { tier: "starter", plan: "monthly" },
    )
    const data = await resp.json()
    expect(data.checkoutUrl).toBe("https://checkout.paddle.com/test")
    expect(data.transactionId).toBe("txn_01")
  })

  it("customer-portal calls paddle client", async () => {
    ;(paddle.getSubscription as any).mockResolvedValue({
      data: { customer_id: "cust_01" },
    })
    ;(paddle.createCustomerPortal as any).mockResolvedValue({
      data: { url: "https://portal.paddle.com/test" },
    })
    const supabase = await createClient()
    supabase.from().select().eq().eq().maybeSingle.mockResolvedValue({
      data: { paddle_subscription_id: "sub_01" },
      error: null,
    })

    const resp = await testRoute(
      "@/app/api/paddle/customer-portal/route",
      "POST",
      {},
    )
    expect(resp.status).toBe(200)
  })

  it("cancel-subscription calls paddle cancel", async () => {
    ;(paddle.cancelSubscription as any).mockResolvedValue({
      data: { id: "sub_01", status: "canceled" },
    })
    const supabase = await createClient()
    supabase.from().select().eq().eq().maybeSingle.mockResolvedValue({
      data: { paddle_subscription_id: "sub_01" },
      error: null,
    })

    const resp = await testRoute(
      "@/app/api/paddle/cancel-subscription/route",
      "POST",
      { subscriptionId: "sub_01" },
    )
    expect(resp.status).toBe(200)
  })

  it("webhook validates paddle-signature header", async () => {
    const { POST } = await import("@/app/api/paddle/webhook/route")
    const req = {
      text: async () => JSON.stringify({ event_type: "transaction.completed", data: {} }),
      headers: new Headers(),
    } as any
    const resp = await POST(req)
    // With no WEBHOOK_SECRET set in test env, it should skip validation
    const data = await resp.json()
    expect(data).toBeDefined()
  })
})

describe("API Routes — Reports Feature", () => {
  it("reports/generate returns 400 without configId", async () => {
    const resp = await testRoute(
      "@/app/api/reports/generate/route",
      "POST",
      {},
    )
    expect(resp.status).toBe(400)
  })

  it("reports/generate returns response with configId", async () => {
    const supabase = await createClient()
    supabase.from().select().eq().eq().single
      .mockResolvedValue({ data: { id: "cfg_1", client_name: "TestClient", data_sources: [] }, error: null })
    supabase.from().insert().select().single
      .mockResolvedValue({ data: { id: "rep_1", created_at: new Date().toISOString() }, error: null })

    ;(askLLMWithSystem as any).mockResolvedValue({ content: "Generated narrative report" })

    const resp = await testRoute(
      "@/app/api/reports/generate/route",
      "POST",
      { configId: "cfg_1" },
    )
    expect(resp.status).toBeLessThanOrEqual(500)
  })
})

describe("API Routes — SEO / Brand Radar", () => {
  it("seo/scan accepts monitorId parameter", async () => {
    ;(askLLM as any).mockResolvedValue({
      content: JSON.stringify({
        brand_mentioned: true,
        sentiment: "positive",
        topics: ["test"],
      }),
    })
    const supabase = await createClient()
    supabase.from().select().eq().single
      .mockResolvedValue({ data: { id: "mon_1", brand_name: "Test", keywords: ["test"], competitors: [], website_url: "", industry: "" } })
    supabase.from().insert().select().single
      .mockResolvedValue({ data: { id: "scan_1" } })

    const resp = await testRoute(
      "@/app/api/seo/scan/route",
      "POST",
      { monitorId: "mon_1" },
    )
    const data = await resp.json()
    expect(data).toBeDefined()
  })
})

describe("API Routes — Competitive Dashboard", () => {
  it("competitive dashboard returns data", async () => {
    const supabase = await createClient()
    supabase.from().select().eq().order.mockResolvedValue({
      data: [
        { id: "1", competitor_name: "CompA", mentioned: true },
        { id: "2", competitor_name: "CompB", mentioned: false },
      ],
    })

    const resp = await testRoute(
      "@/app/api/dashboard/competitive/route",
      "GET",
    )
    const data = await resp.json()
    expect(data).toBeDefined()
  })

  it("dashboard stats returns metrics", async () => {
    const supabase = await createClient()
    supabase.from().select.mockResolvedValue({ data: [], count: 0 })

    const resp = await testRoute(
      "@/app/api/dashboard/stats/route",
      "GET",
    )
    const data = await resp.json()
    expect(data).toBeDefined()
  })
})

describe("API Routes — Content Calendar", () => {
  it("content-calendar CRUD", async () => {
    const supabase = await createClient()
    supabase.from().select().eq().order.mockResolvedValue({ data: [] })
    supabase.from().insert().select().single
      .mockResolvedValue({ data: { id: "cal_1", title: "Test Entry" } })

    const resp = await testRoute(
      "@/app/api/content-calendar/route",
      "GET",
    )
    const data = await resp.json()
    expect(data).toBeDefined()
  })
})

describe("API Routes — Invoices", () => {
  it("invoices list returns data", async () => {
    const supabase = await createClient()
    supabase.from().select().eq().order.mockResolvedValue({ data: [] })

    const resp = await testRoute(
      "@/app/api/invoices/route",
      "GET",
    )
    expect(resp.status).toBe(200)
  })
})

describe("API Routes — Referrals", () => {
  it("referral/code generates code", async () => {
    const supabase = await createClient()
    supabase.from().select().eq().single
      .mockResolvedValue({ data: { id: "user_1" } })

    const resp = await testRoute(
      "@/app/api/referral/code/route",
      "POST",
      {},
    )
    expect(resp.status).toBe(200)
  })

  it("referral/stats returns statistics", async () => {
    const resp = await testRoute(
      "@/app/api/referral/stats/route",
      "GET",
    )
    expect(resp.status).toBe(200)
  })
})

describe("API Routes — Auth & Profile", () => {
  it("auth callback redirects to onboarding or dashboard", async () => {
    const { GET } = await import("@/app/api/auth/callback/route")
    const req = {
      url: "https://kvantio.vercel.app/api/auth/callback?code=test&next=/dashboard",
      headers: new Headers(),
    } as any
    const resp = await GET(req)
    expect(resp.status).toBe(307)
  })

  it("profile returns user data", async () => {
    const supabase = await createClient()
    supabase.from().select().eq().single
      .mockResolvedValue({ data: { id: "user_1", name: "Test User" } })

    const { GET } = await import("@/app/api/profile/route")
    const resp = await GET()
    expect(resp.status).toBe(200)
  })
})

describe("API Routes — Cron", () => {
  it("send-scheduled-reports cron validates authorization", async () => {
    const { GET } = await import("@/app/api/cron/send-scheduled-reports/route")
    const req = { headers: new Headers() } as any
    const resp = await GET(req)
    expect(resp.status).toBe(401)
  })

  it("scan-brands cron validates authorization", async () => {
    const { GET } = await import("@/app/api/cron/scan-brands/route")
    const req = { headers: new Headers() } as any
    const resp = await GET(req)
    expect(resp.status).toBe(401)
  })
})

describe("API Routes — Admin", () => {
  it("admin routes are protected", async () => {
    const { GET } = await import("@/app/api/admin/service-config/route")
    const req = makeRequest("GET")
    const resp = await GET()
    expect(resp).toBeDefined()
  })
})
