import { describe, it, expect, vi, beforeEach } from "vitest"

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
})

describe("PaddleClient", () => {
  it("constructs without error", async () => {
    const { paddle } = await import("../paddle/client")
    expect(paddle).toBeDefined()
  })

  it("getProducts calls correct endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ id: "pro_01", name: "Starter" }] }),
    })

    const { paddle } = await import("../paddle/client")
    const result = await paddle.getProducts()
    expect(result.data[0].name).toBe("Starter")
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/products"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: expect.any(String) }),
      }),
    )
  })

  it("createTransaction builds correct body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: "txn_01", urls: { checkout: "https://checkout.paddle.com/..." } } }),
    })

    const { paddle } = await import("../paddle/client")
    await paddle.createTransaction(
      [{ priceId: "pri_01", quantity: 1 }],
      "test@example.com",
      { user_id: "user_1" },
    )

    const callArgs = mockFetch.mock.calls[0]
    expect(callArgs[0]).toContain("/transactions")
    const body = JSON.parse(callArgs[1].body)
    expect(body.items[0].price_id).toBe("pri_01")
    expect(body.customer.email).toBe("test@example.com")
    expect(body.custom_data.user_id).toBe("user_1")
  })

  it("throws on API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { detail: "Price not found" } }),
    })

    const { paddle } = await import("../paddle/client")
    await expect(paddle.getPrices("invalid")).rejects.toThrow("Price not found")
  })

  it("createCustomerPortal calls correct endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { url: "https://portal.paddle.com/..." } }),
    })

    const { paddle } = await import("../paddle/client")
    const result = await paddle.createCustomerPortal("cus_01")
    expect(result.data.url).toContain("paddle.com")
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/customers/portal-sessions"),
      expect.any(Object),
    )
  })

  it("cancelSubscription calls cancel endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: "sub_01", status: "canceled" } }),
    })

    const { paddle } = await import("../paddle/client")
    const result = await paddle.cancelSubscription("sub_01")
    expect(result.data.status).toBe("canceled")
  })
})
