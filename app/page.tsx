import type { Metadata } from "next"
import { DemoLayout } from "@/components/demo-layout"
import { Header } from "@/components/header"

export const metadata: Metadata = {
  title: "Reway | A Calm Home For Everything You Save",
  description:
    "Reway turns noisy links into a structured library. Capture links in seconds, extract what matters from pasted text, and move fast with search, groups, and view modes that match the way you think.",
}

export default function page() {
  return (
    <>
      <Header />
      <DemoLayout />
    </>
  )
}
