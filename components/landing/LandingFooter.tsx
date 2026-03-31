"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import {
  GithubIcon,
  Linkedin02Icon,
  NewTwitterIcon,
} from "@hugeicons/core-free-icons";
import BrandWord from "@/components/landing/BrandWord";
import { ThemeSwitcher } from "@/components/landing/ThemeSwitcher";
import RewayLogo from "@/components/logo";
import type { DashboardHref } from "@/components/landing/types";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";

export function LandingFooter() {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isPrimaryNavLoading, setIsPrimaryNavLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => setIsAuthenticated(Boolean(data?.user)))
      .catch(() => setIsAuthenticated(false));
  }, []);

  const primaryHref: DashboardHref = useMemo(
    () => (isAuthenticated ? "/dashboard" : "/login"),
    [isAuthenticated],
  );
  const primaryLabel = isAuthenticated ? "Dashboard" : "Get Started";

  const socialLinks = [
    {
      icon: NewTwitterIcon,
      href: "https://x.com/mo0hamed_gamal",
      label: "Twitter",
    },
    {
      icon: Linkedin02Icon,
      href: "https://www.linkedin.com/in/mohamed-g-shoaib/",
      label: "LinkedIn",
    },
    {
      icon: GithubIcon,
      href: "https://github.com/mohamed-g-shoaib/reway",
      label: "GitHub",
    },
  ] as const;

  const footerVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.28, ease: "easeOut" },
    },
  };

  const signatureVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.32, ease: "easeOut" },
    },
  };

  const enableMotion = mounted && !shouldReduceMotion;

  return (
    <motion.footer
      className="border-t border-foreground/12 bg-background pt-16 lg:pt-20 pb-0"
      initial={enableMotion ? "hidden" : false}
      whileInView={enableMotion ? "visible" : undefined}
      viewport={{ once: true, margin: "-120px" }}
      variants={enableMotion ? footerVariants : undefined}
    >
      <div className="mx-auto w-full max-w-350 px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Column 1: Brand Info (Occupying 4/12 columns) */}
          <div className="space-y-4 lg:col-span-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-foreground"
            >
              <RewayLogo
                className="size-6"
                aria-hidden="true"
                focusable="false"
              />
              <span className="font-semibold">Reway</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-foreground/65">
              Engineering-led bookmarking for people who save a lot of links.
              Built by{" "}
              <Link
                href="https://devloop.software/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:underline underline-offset-4"
              >
                Devloop.
              </Link>
            </p>
          </div>

          {/* Column 2: Product (2/12 columns) */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-bold uppercase text-foreground">
              Product
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-foreground/60">
              <li>
                <Link
                  href="/#features"
                  className="hover:text-foreground transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/#extension"
                  className="hover:text-foreground transition-colors"
                >
                  Extension
                </Link>
              </li>
              <li>
                <Link
                  href={"/about" as DashboardHref}
                  className="hover:text-foreground transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                {isAuthenticated ? (
                  <button
                    type="button"
                    className="hover:text-foreground transition-colors cursor-pointer"
                    onClick={() => {
                      if (isPrimaryNavLoading) return;
                      setIsPrimaryNavLoading(true);
                      router.push("/dashboard");
                    }}
                    disabled={isPrimaryNavLoading}
                  >
                    {isPrimaryNavLoading ? "Loading..." : primaryLabel}
                  </button>
                ) : (
                  <Link
                    href={primaryHref}
                    className="hover:text-foreground transition-colors cursor-pointer"
                  >
                    {primaryLabel}
                  </Link>
                )}
              </li>
            </ul>
          </div>

          {/* Column 3: Legal (2/12 columns) */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-bold uppercase text-foreground">
              Legal
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-foreground/60">
              <li>
                <Link
                  href={"/terms" as DashboardHref}
                  className="hover:text-foreground transition-colors"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  href={"/privacy" as DashboardHref}
                  className="hover:text-foreground transition-colors"
                >
                  Privacy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Connect (2/12 columns) */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-bold uppercase text-foreground">
              Connect
            </h2>
            <ul className="mt-4 space-y-3">
              {socialLinks.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-foreground"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-muted/40 text-muted-foreground transition-colors duration-200 group-hover:bg-foreground group-hover:text-background border border-transparent group-hover:border-foreground">
                      <HugeiconsIcon icon={social.icon} size={14} />
                    </span>
                    <span className="font-medium">{social.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Appearance (2/12 columns) */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-bold uppercase text-foreground">
              Appearance
            </h2>
            <div className="mt-4">
              <ThemeSwitcher />
              <p className="mt-3 text-xs text-foreground/60 leading-relaxed">
                Toggle between light and dark modes.
              </p>
            </div>
          </div>
        </div>

        <motion.div
          className="py-16 w-full text-muted-foreground/6"
          initial={enableMotion ? "hidden" : false}
          whileInView={enableMotion ? "visible" : undefined}
          viewport={{ once: true }}
          variants={enableMotion ? signatureVariants : undefined}
        >
          <BrandWord className="h-auto w-full select-none" />
        </motion.div>
      </div>
    </motion.footer>
  );
}
