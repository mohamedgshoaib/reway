import type { Route } from "next"

type DashboardHrefLiteral = "/login" | "/dashboard" | "/terms" | "/privacy" | "/about"

export type DashboardHref = string extends Route
  ? DashboardHrefLiteral
  : Extract<Route, DashboardHrefLiteral>
