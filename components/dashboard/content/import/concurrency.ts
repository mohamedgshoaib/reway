export async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  handler: (item: T) => Promise<void>,
  options?: {
    shouldStop?: () => boolean
    skipStopCheck?: boolean
  },
) {
  const safeConcurrency = Math.max(1, Math.floor(concurrency))
  let index = 0

  const worker = async () => {
    while (true) {
      if (!options?.skipStopCheck && options?.shouldStop?.()) return

      const current = index
      if (current >= items.length) return
      index += 1

      await handler(items[current])
    }
  }

  const workers = Array.from({ length: Math.min(safeConcurrency, items.length) }, () => worker())

  await Promise.all(workers)
}
