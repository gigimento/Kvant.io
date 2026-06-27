import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Refund Policy — Kvant",
  description: "Kvant refund policy. 14-day money-back guarantee for all plans.",
}

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-primary text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-accent hover:underline">&larr; Back to Home</Link>
        <h1 className="mt-6 text-3xl font-bold">Refund Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 21, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">14-Day Money-Back Guarantee</h2>
            <p className="mt-2">
              If you are not satisfied with Kvant, you can request a full refund within
              14 days of your initial purchase. No questions asked.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">How to Request a Refund</h2>
            <p className="mt-2">
              Email us at{" "}
              <a href="mailto:support@kvant.io" className="text-accent hover:underline">support@kvant.io</a>{" "}
              with the email address you used to register. We will process the refund
              within 5-7 business days. Refunds are issued to the original payment method
              via Paddle.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Subscription Renewals</h2>
            <p className="mt-2">
              Refunds for recurring subscription charges are available only within 14 days
              of the charge date. After 14 days, no refunds can be issued for that billing
              period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Cancellation</h2>
            <p className="mt-2">
              You can cancel your subscription at any time from your dashboard. Your
              access will continue until the end of the current billing period. No
              partial refunds are given for unused time after the 14-day window.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            <p className="mt-2">
              Questions?{" "}
              <a href="mailto:support@kvant.io" className="text-accent hover:underline">support@kvant.io</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
