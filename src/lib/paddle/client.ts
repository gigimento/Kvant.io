const PADDLE_API = "https://api.paddle.com"
const API_KEY = process.env.PADDLE_API_KEY

export class PaddleClient {
  private key: string

  constructor() {
    this.key = API_KEY || ""
    if (!this.key) {
      console.warn("PADDLE_API_KEY not set")
    }
  }

  private async request(path: string, options: RequestInit = {}) {
    const response = await fetch(`${PADDLE_API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.key}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.detail || `Paddle API error: ${response.status}`)
    }
    return data
  }

  async getProducts() {
    return this.request("/products")
  }

  async getPrices(productId: string) {
    return this.request(`/prices?product_id=${productId}`)
  }

  async createTransaction(items: { priceId: string; quantity: number }[], customerEmail?: string, customData?: Record<string, string>, returnUrl?: string) {
    const body: any = {
      items: items.map((i) => ({
        price_id: i.priceId,
        quantity: i.quantity,
      })),
    }

    if (customerEmail) {
      body.customer = { email: customerEmail }
    }

    if (customData) {
      body.custom_data = customData
    }

    body.return_url = returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscriptions`

    return this.request("/transactions", {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  async getTransaction(transactionId: string) {
    return this.request(`/transactions/${transactionId}`)
  }

  async listSubscriptions(status?: string) {
    const query = status ? `?status=${status}` : ""
    return this.request(`/subscriptions${query}`)
  }

  async getSubscription(subscriptionId: string) {
    return this.request(`/subscriptions/${subscriptionId}`)
  }

  async createCustomerPortal(customerId: string) {
    return this.request("/customers/portal-sessions", {
      method: "POST",
      body: JSON.stringify({ customer_id: customerId }),
    })
  }

  async cancelSubscription(subscriptionId: string) {
    return this.request(`/subscriptions/${subscriptionId}/cancel`, {
      method: "POST",
      body: JSON.stringify({}),
    })
  }
}

export const paddle = new PaddleClient()
