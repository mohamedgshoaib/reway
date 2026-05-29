import { getUser } from "@/lib/dashboard/server/user"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Fetch user on the server to ensure authentication
  await getUser()

  return <>{children}</>
}
