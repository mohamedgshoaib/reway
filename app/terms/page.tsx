import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { LandingFooter } from "@/components/landing/LandingFooter"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read our terms of service to understand how to use Reway.",
}

export default async function TermsPage() {
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
            <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: February 20, 2026</p>
          </div>

          <div className="prose prose-stone dark:prose-invert max-w-none space-y-12">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Reway, you agree to be bound by these Terms of Service. If
                you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">2. Service Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reway is a high-performance bookmarking tool. We provide automated metadata
                extraction, group-based organization, and keyboard-driven navigation for saved
                knowledge.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">3. User Conduct</h2>
              <p className="text-muted-foreground leading-relaxed">
                You are responsible for all content saved to your account. You agree not to use
                Reway for any illegal activities or to store content that violates the intellectual
                property rights of others.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">4. Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy to understand how
                we collect, use, and protect your personal information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">5. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use of Reway after
                such modifications constitutes your acceptance of the new terms.
              </p>
            </section>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
