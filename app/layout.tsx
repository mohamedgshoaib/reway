import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"

const SITE_URL = "https://reway.page"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Reway | A Calm Home For Everything You Save",
    template: "%s | Reway",
  },
  description:
    "Reway turns noisy links into a structured library. Capture links in seconds, extract what matters from pasted text, and move fast with search, groups, and view modes that match the way you think.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Reway | A Calm Home For Everything You Save",
    description:
      "Reway turns noisy links into a structured library. Capture links in seconds, extract what matters from pasted text, and move fast with search, groups, and view modes that match the way you think.",
    url: SITE_URL,
    siteName: "Reway",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Reway",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reway | A Calm Home For Everything You Save",
    description:
      "Reway turns noisy links into a structured library. Capture links in seconds, extract what matters from pasted text, and move fast with search, groups, and view modes that match the way you think.",
    images: ["/twitter-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
}

import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased font-sans" suppressHydrationWarning>
        <Script
          src="/metrics/lib.js"
          data-website-id="de7a60cf-6590-4882-a48f-9111335d620e"
          data-host-url="/metrics"
          strategy="lazyOnload"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Reway",
                url: SITE_URL,
                description: "Reway turns noisy links into a structured library.",
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "Reway",
                applicationCategory: "ProductivityApplication",
                operatingSystem: "Web",
                url: SITE_URL,
              },
            ]),
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={300} skipDelayDuration={1000}>
            {children}
          </TooltipProvider>
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
