import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { LandingFooter } from "@/components/landing/LandingFooter"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how we protect your privacy and handle your data at Reway.",
}

export default async function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header />

      <main className="mx-auto max-w-350 px-4 pt-32 pb-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </Link>

          <div className="space-y-4 text-center mb-16">
            <h1 className="text-4xl font-bold text-foreground sm:text-5xl">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: February 20, 2026</p>
          </div>

          <div className="prose prose-stone dark:prose-invert max-w-none space-y-12">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">1. Data Collection</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reway collects the email address you provide at signup and the URLs you explicitly
                save. This data is stored in an encrypted PostgreSQL database via Supabase.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">2. Data Usage</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use your data solely to provide the bookmarking service. This includes automated
                metadata extraction (fetching page titles and icons) to enrich your library. We do
                not sell your personal data or saved links to third parties.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">3. Metadata Processing</h2>
              <p className="text-muted-foreground leading-relaxed">
                When you save a link, we may fetch public page metadata (such as title and
                description) to keep your library readable and searchable. This processing is
                automated and focused solely on enriching your saved links for your personal use.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">4. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use industry-standard security measures to protect your data. Your bookmarks are
                private and only accessible to you through your authenticated account.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                5. Administrator Data Access
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                As the service administrator, I have access to the database containing user emails
                and saved bookmarks. This access is limited to what is necessary for maintaining and
                improving the service. Your data is handled with care and is not shared with third
                parties.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">6. Your Choices</h2>
              <p className="text-muted-foreground leading-relaxed">
                You can access, update, or delete your saved links and account information at any
                time through your dashboard.
              </p>
            </section>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
