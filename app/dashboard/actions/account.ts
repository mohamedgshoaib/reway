"use server"

import { accountMutations } from "@/lib/dashboard/server/library-mutations"

export async function deleteAccount() {
  return accountMutations.delete()
}
