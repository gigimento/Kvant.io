import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-primary text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-accent hover:underline">&larr; Back to Home</Link>
        <h1 className="mt-6 text-3xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 21, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Service</h2>
            <p className="mt-2">
              Kvant provides AI-powered narrative reports and brand visibility monitoring tools (&ldquo;the Service&rdquo;).
              By using the Service you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Accounts</h2>
            <p className="mt-2">
              You must register with a valid email. You are responsible for maintaining the
              confidentiality of your login credentials and for all activity under your account.
              You must be at least 18 years old.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Subscription &amp; Billing</h2>
            <p className="mt-2">
              The Service is offered on a subscription basis. Payments are processed by Paddle.
              By subscribing you authorize Paddle to charge your payment method on a recurring
              basis. All fees are non-refundable except as stated in our Refund Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. AI-Generated Content</h2>
            <p className="mt-2">
              Kvant uses large language models to generate report narratives and brand scan
              results. Output is provided &ldquo;as is&rdquo; and may contain errors or inaccuracies.
              You are responsible for reviewing and verifying all generated content before
              using it with clients or making decisions based on it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Acceptable Use</h2>
            <p className="mt-2">
              You may not use the Service for any unlawful activity, to generate misleading
              or fraudulent content, or to infringe on others&apos; intellectual property.
              We reserve the right to suspend accounts that violate this policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Limitation of Liability</h2>
            <p className="mt-2">
              Kvant is provided &ldquo;as is&rdquo; without warranty of any kind. To the maximum extent
              permitted by law, we disclaim all liability for damages arising from your use of
              the Service, including but not limited to lost profits or data loss.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Governing Law</h2>
            <p className="mt-2">
              These terms are governed by the laws of the Republic of Serbia. Any disputes
              shall be resolved in the courts of Belgrade, Serbia.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Changes</h2>
            <p className="mt-2">
              We may update these terms at any time. Continued use of the Service after
              changes constitutes acceptance of the new terms. We will notify you via email
              of material changes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Contact</h2>
            <p className="mt-2">
              Questions? Email us at <a href="mailto:support@kvant.io" className="text-accent hover:underline">support@kvant.io</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
