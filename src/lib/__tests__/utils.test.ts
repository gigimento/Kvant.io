import { describe, it, expect } from "vitest"
import { cn, formatCurrency, formatDate, pluralize } from "../utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible")
  })
})

describe("formatCurrency", () => {
  it("formats USD", () => {
    expect(formatCurrency(19)).toBe("$19.00")
    expect(formatCurrency(99)).toBe("$99.00")
    expect(formatCurrency(49.5)).toBe("$49.50")
  })
})

describe("formatDate", () => {
  it("formats date string", () => {
    const result = formatDate("2026-06-01")
    expect(result).toContain("Jun")
    expect(result).toContain("2026")
  })

  it("formats Date object", () => {
    const result = formatDate(new Date(2026, 5, 1))
    expect(result).toContain("Jun")
    expect(result).toContain("2026")
  })
})

describe("pluralize", () => {
  it("returns singular for count 1", () => {
    expect(pluralize(1, "client")).toBe("client")
  })

  it("returns plural for count 0", () => {
    expect(pluralize(0, "client")).toBe("clients")
  })

  it("returns plural for count > 1", () => {
    expect(pluralize(5, "client")).toBe("clients")
  })

  it("uses custom plural when provided", () => {
    expect(pluralize(3, "query", "queries")).toBe("queries")
  })
})
