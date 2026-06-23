import type { Metadata } from "next"
import "./globals.css"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://agencytools.vercel.app"

export const metadata: Metadata = {
  title: "Kvant — AI-Powered Agency Toolkit for Reports & Brand Monitoring",
  description:
    "Generate narrative-style client reports with real analytics, monitor brand visibility across LLMs and search engines, and manage content, invoices, and proposals — all in one AI-native platform.",
  keywords: [
    "AI reporting tool", "client reports", "brand monitoring", "marketing agency tools",
    "narrative reports", "LLM tracking", "share of voice", "content calendar",
    "agency invoices", "proposal generator", "SEO monitoring",
  ],
  openGraph: {
    title: "Kvant — Smart Reports & AI Brand Monitoring",
    description:
      "Narrative-style client reports for marketing agencies + AI brand visibility monitoring across LLMs.",
    url: BASE_URL,
    siteName: "Kvant",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kvant — Smart Reports & AI Brand Monitoring",
    description:
      "Narrative-style client reports for marketing agencies + AI brand visibility monitoring across LLMs.",
  },
  other: {
    "application-ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Kvant",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "AI-powered agency toolkit for narrative client reports, brand monitoring across LLMs, content calendar, invoices, and proposals.",
      url: BASE_URL,
      author: { "@type": "Organization", name: "Kvant" },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: "9",
        highPrice: "29",
        offerCount: "4",
      },
    }),
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Kvant",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "AI-powered agency toolkit for narrative client reports, brand monitoring across LLMs, content calendar, invoices, and proposals.",
              url: BASE_URL,
              author: { "@type": "Organization", name: "Kvant" },
              offers: {
                "@type": "AggregateOffer",
                priceCurrency: "USD",
                lowPrice: "9",
                highPrice: "29",
                offerCount: "4",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-primary text-foreground font-sans">
        {children}
      </body>
    </html>
  )
}
