import dynamic from "next/dynamic"
import { CallToAction } from "@/components/landing/CallToAction"
import { HeroSection } from "@/components/landing/HeroSection"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { ScrollToTopButton } from "@/components/landing/ScrollToTopButton"

function FeaturesSectionPlaceholder() {
  return (
    <section id="features" className="border-b border-foreground/8 bg-muted/20">
      <div className="mx-auto flex w-full max-w-350 flex-col gap-10 px-4 py-16 sm:px-6 lg:py-20">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Core Features
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold text-foreground sm:text-4xl">
            Focus On The Link, Not The Management
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm text-foreground/65 sm:text-base">
            Reway is built for speed. Every interaction is optimized to keep your library clean
            and your research moving.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <article
              key={index}
              className="flex flex-col gap-4 rounded-4xl bg-background p-5 ring-1 ring-foreground/8 shadow-none isolate"
            >
              <div className="flex min-h-24 items-start">
                <div className="w-full space-y-2">
                  <div className="h-6 w-44 max-w-full rounded bg-muted" />
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-[90%] rounded bg-muted" />
                </div>
              </div>
              <div className="flex h-46 items-center">
                <div className="h-30 w-full rounded-3xl bg-muted/40" />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 text-center lg:mt-10">
          <div className="mx-auto h-6 w-full max-w-3xl rounded bg-muted" />
        </div>
      </div>
    </section>
  )
}

function DemoVideosSectionPlaceholder() {
  return (
    <section id="extension" className="border-b border-foreground/8 bg-muted/20 overflow-hidden">
      <div className="mx-auto flex w-full max-w-350 flex-col gap-12 px-4 py-16 sm:px-6 lg:py-20">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
            How it works
          </p>
          <h2 className="mt-3 text-pretty text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Everything you need <br className="hidden sm:block" />
            to stay in flow.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
          <div className="order-1 hidden lg:col-span-8 lg:block">
            <div className="aspect-4/3 w-full rounded-4xl bg-black/5 ring-1 ring-foreground/8" />
          </div>

          <div className="order-2 lg:col-span-4">
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-3xl bg-background/70 p-6 ring-1 ring-foreground/8"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-8 rounded-full bg-muted" />
                    <div className="h-5 w-40 max-w-full rounded bg-muted" />
                  </div>
                  {index === 0 ? (
                    <div className="mt-6 space-y-3">
                      <div className="aspect-4/3 w-full rounded-3xl bg-black/5 lg:hidden" />
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-[92%] rounded bg-muted" />
                      <div className="h-3 w-[84%] rounded bg-muted" />
                      <div className="h-1 w-full rounded-full bg-muted/70" />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const FeaturesSection = dynamic(
  () => import("@/components/landing/FeaturesSection").then((mod) => mod.FeaturesSection),
  {
    loading: () => <FeaturesSectionPlaceholder />,
  },
)

const DemoVideosSection = dynamic(
  () => import("@/components/landing/DemoVideosSection").then((mod) => mod.DemoVideosSection),
  {
    loading: () => <DemoVideosSectionPlaceholder />,
  },
)

export function DemoLayout() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main className="pt-12">
        <HeroSection />
        <FeaturesSection />
        <DemoVideosSection />
        <div id="about" />
        <CallToAction />
      </main>
      <ScrollToTopButton />
      <LandingFooter />
    </div>
  )
}
