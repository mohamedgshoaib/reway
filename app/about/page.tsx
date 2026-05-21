import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { LandingFooter } from "@/components/landing/LandingFooter"

export const metadata: Metadata = {
  title: "About",
  description: "Why Reway was built and the philosophy behind it.",
}

export default function AboutPage() {
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

          <header className="mt-10 mb-12 space-y-4 text-center">
            <h1 className="text-4xl font-bold text-foreground sm:text-5xl">About Reway</h1>
            <p className="mx-auto max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              Reway is an engineering-led workspace built for people who save a lot of links and
              need them to stay useful.
            </p>
          </header>

          <div className="prose prose-stone dark:prose-invert max-w-none space-y-10">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">The Problem</h2>
              <p className="text-muted-foreground leading-relaxed">
                Standard browser bookmarks are static, local, and hard to manage. Links are often
                saved across dozens of tabs, Slack messages, and notes, creating a fragmented search
                experience that slows down deep work.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We built Reway to centralize this knowledge into a single, high-performance system
                that enriches data automatically.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">The Standards</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our approach to building Reway is grounded in three principles:
              </p>
              <ul className="text-muted-foreground leading-relaxed">
                <li>
                  <strong>Speed first:</strong> Capture must be instant. Navigation must be
                  keyboard-driven.
                </li>
                <li>
                  <strong>Data ownership:</strong> Your library is yours. We provide clean exports
                  and never sell your data.
                </li>
                <li>
                  <strong>Zero fluff:</strong> No AI-generated noise. Just the metadata you need to
                  find what you saved.
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">What Reway does</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reway helps you capture links and group them into a personal library. When you save
                something, it can extract helpful metadata so you can skim later and find it again.
                The browser extension is there to reduce friction, so saving does not depend on
                where you are working.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The goal is simple: turn scattered links into a library you can trust.
              </p>
            </section>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
