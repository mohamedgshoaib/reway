const RANK_WIDTH = 32
const RANK_MAX = BigInt("9".repeat(RANK_WIDTH))
const ZERO = BigInt(0)
const ONE = BigInt(1)
const TWO = BigInt(2)

export type RankedItem = {
  rank?: string | null
  order_index?: number | null
  created_at?: string | null
}

export type RankedGroupItem = RankedItem & {
  name?: string | null
}

function isRank(value?: string | null): value is string {
  return typeof value === "string" && /^\d{32}$/.test(value)
}

function parseRank(value?: string | null) {
  return isRank(value) ? BigInt(value) : null
}

function formatRank(value: bigint) {
  if (value <= ZERO || value >= RANK_MAX) {
    throw new Error("Rank is outside the supported range")
  }
  return value.toString().padStart(RANK_WIDTH, "0")
}

export function generateRankBetween(
  previousRank?: string | null,
  nextRank?: string | null,
) {
  const low = parseRank(previousRank) ?? ZERO
  const high = parseRank(nextRank) ?? RANK_MAX

  if (low >= high) {
    throw new Error("Cannot generate rank from inverted bounds")
  }

  const gap = high - low
  if (gap <= ONE) {
    throw new Error("Rank gap exhausted; rebalance required")
  }

  return formatRank(low + gap / TWO)
}

export function generateRanksBetween(
  previousRank: string | null | undefined,
  nextRank: string | null | undefined,
  count: number,
) {
  if (count <= 0) return []

  const low = parseRank(previousRank) ?? ZERO
  const high = parseRank(nextRank) ?? RANK_MAX
  const step = (high - low) / BigInt(count + 1)

  if (step <= ZERO) {
    throw new Error("Rank gap exhausted; rebalance required")
  }

  return Array.from({ length: count }, (_, index) => formatRank(low + step * BigInt(index + 1)))
}

export function getRankForMovedItem<T extends { rank?: string | null }>(
  newOrder: T[],
  movedId: string,
  getId: (item: T) => string = (item) => (item as T & { id: string }).id,
) {
  const movedIndex = newOrder.findIndex((item) => getId(item) === movedId)
  if (movedIndex < 0) {
    throw new Error("Moved item is missing from reordered list")
  }

  return generateRankBetween(newOrder[movedIndex - 1]?.rank, newOrder[movedIndex + 1]?.rank)
}

export function compareRankedItems(a: RankedItem, b: RankedItem) {
  if (isRank(a.rank) && isRank(b.rank) && a.rank !== b.rank) {
    return a.rank < b.rank ? -1 : 1
  }

  if (isRank(a.rank) && !isRank(b.rank)) return -1
  if (!isRank(a.rank) && isRank(b.rank)) return 1

  const aOrder = a.order_index ?? Number.POSITIVE_INFINITY
  const bOrder = b.order_index ?? Number.POSITIVE_INFINITY
  if (aOrder !== bOrder) return aOrder - bOrder

  const aCreatedAt = a.created_at ? new Date(a.created_at).getTime() : 0
  const bCreatedAt = b.created_at ? new Date(b.created_at).getTime() : 0
  return bCreatedAt - aCreatedAt
}

export function compareRankedGroups(a: RankedGroupItem, b: RankedGroupItem) {
  if (isRank(a.rank) && isRank(b.rank) && a.rank !== b.rank) {
    return a.rank < b.rank ? -1 : 1
  }

  if (isRank(a.rank) && !isRank(b.rank)) return -1
  if (!isRank(a.rank) && isRank(b.rank)) return 1

  const aOrder = a.order_index ?? Number.POSITIVE_INFINITY
  const bOrder = b.order_index ?? Number.POSITIVE_INFINITY
  if (aOrder !== bOrder) return aOrder - bOrder

  const nameA = a.name || ""
  const nameB = b.name || ""
  return nameA.localeCompare(nameB, undefined, { sensitivity: "base" })
}
