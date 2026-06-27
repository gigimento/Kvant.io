import { writeFileSync } from "fs"

const API_KEY = process.env.PADDLE_API_KEY
if (!API_KEY) {
  console.error("Set PADDLE_API_KEY env var first")
  process.exit(1)
}
const BASE = "https://api.paddle.com"
const PRODUCT_ID = "pro_01kvkv9ssf3aqddcj49d7mbh3r"

const tiers = [
  { name: "Starter", slug: "starter", price: 19, features: 6 },
  { name: "Pro", slug: "pro", price: 49, features: 13 },
  { name: "Agency", slug: "agency", price: 99, features: 17 },
]

async function createPrice(tier, billingCycle) {
  const description = `${tier.name} plan - ${billingCycle === "month" ? "per month" : "per year"}`
  const body = {
    product_id: PRODUCT_ID,
    name: `${tier.name} - ${billingCycle === "month" ? "Monthly" : "Yearly"}`,
    description,
    type: "standard",
    unit_price: {
      amount: `${(billingCycle === "month" ? tier.price : tier.price * 10) * 100}`,
      currency_code: "USD",
    },
    billing_cycle: billingCycle === "month"
      ? { interval: "month", frequency: 1 }
      : { interval: "year", frequency: 1 },
    trial_period: { interval: "day", frequency: 14 },
  }

  const res = await fetch(`${BASE}/prices`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  const json = await res.json()
  if (!res.ok) {
    console.error(`  FAILED ${tier.name} ${billingCycle}:`, JSON.stringify(json).slice(0, 1000))
    return null
  }
  console.log(`  OK ${tier.name} ${billingCycle}: ${json.data.id}`)
  return json.data.id
}

async function main() {
  console.log("Creating 6 Paddle prices...\n")
  const results = {}

  for (const tier of tiers) {
    results[tier.slug] = {}
    for (const cycle of ["month", "year"]) {
      const id = await createPrice(tier, cycle)
      results[tier.slug][cycle] = id
    }
  }

  console.log("\n=== RESULTS ===")
  console.log(JSON.stringify(results, null, 2))

  // Generate code block for features.ts
  console.log("\n=== CODE FOR features.ts ===")
  const lines = [
    `export const TIER_PRICES = {`,
  ]
  const tierKeys = ["starter", "pro", "agency"]
  for (const key of tierKeys) {
    const r = results[key]
    if (r.month && r.year) {
      const tier = tiers.find(t => t.slug === key)
      lines.push(`  "${key}": { monthly: "${r.month}", yearly: "${r.year}", price: ${tier.price}, name: "${tier.name}", features: ${tier.features} },`)
    }
  }
  lines.push(`}`)
  console.log(lines.join("\n"))
}

main().catch(console.error)
