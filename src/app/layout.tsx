import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Kvant — Smart Reports & AI Brand Monitoring",
  description: "Narrative-style client reports for marketing agencies + AI brand visibility monitoring across LLMs.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-primary text-foreground font-sans">
        {children}
      </body>
    </html>
  )
}
