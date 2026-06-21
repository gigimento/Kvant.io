import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-primary text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-accent hover:underline">&larr; Back to Home</Link>
        <h1 className="mt-6 text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 21, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. What We Collect</h2>
            <p className="mt-2">
              When you register we collect your email address and a hashed password.
              You may optionally provide your name and company name. We also store
              report configurations, brand monitor settings, and generated reports
              that you create within the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. How We Use It</h2>
            <p className="mt-2">
              Your data is used solely to provide and improve the Service: authenticate
              you, generate AI reports, run brand scans, and send transactional emails.
              We do not sell your personal data or share it for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. AI Processing</h2>
            <p className="mt-2">
              Report generation and brand scans are processed by Google Gemini (Google
              AI). Data sent to Gemini is not used by Google to train their models.
              See{" "}
              <a href="https://cloud.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                Google Cloud Terms
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Third-Party Services</h2>
            <p className="mt-2">
              We use the following third-party services:
            </p>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>Supabase (database and authentication)</li>
              <li>Vercel (hosting)</li>
              <li>Google Gemini (AI processing)</li>
              <li>Paddle (payment processing)</li>
              <li>Resend (transactional email)</li>
            </ul>
            <p className="mt-1">
              Each service has its own privacy policy governing how it handles your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Data Retention</h2>
            <p className="mt-2">
              We retain your data for as long as your account is active. When you delete
              your account, your data is permanently removed within 30 days. Generated
              reports are soft-deleted and hard-deleted after 90 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Your Rights (GDPR)</h2>
            <p className="mt-2">
              If you are in the EU/EEA you have the right to access, rectify, export, and
              delete your personal data. You can do this from your dashboard or by emailing
              us. You also have the right to lodge a complaint with your local data
              protection authority.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Cookies</h2>
            <p className="mt-2">
              We use essential cookies for authentication (Supabase session tokens). We do
              not use tracking cookies or third-party analytics cookies. We use GoatCounter
              for privacy-friendly page view analytics (no cookies, no personal data).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Security</h2>
            <p className="mt-2">
              Passwords are hashed using bcrypt. All traffic is encrypted via TLS. We
              regularly review our security practices, but no service is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Contact</h2>
            <p className="mt-2">
              Data controller: Igor Gigić, Belgrade, Serbia. Email:{" "}
              <a href="mailto:support@kvant.io" className="text-accent hover:underline">support@kvant.io</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
