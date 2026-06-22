import type { FeedResponse, SignalDto } from '../api/types.ts'

export interface FeedSnapshot {
  items: SignalDto[]
  nextCursor: string | null
  hasMore: boolean
  totalEstimate: number
}

const snapshots = new Map<string, FeedSnapshot>()

export function getFeedSnapshot(key: string): FeedSnapshot | null {
  return snapshots.get(key) ?? null
}

export function setFeedSnapshot(key: string, snapshot: FeedSnapshot): void {
  snapshots.set(key, snapshot)
}

export function snapshotFromResponse(response: FeedResponse): FeedSnapshot {
  return {
    items: response.items,
    nextCursor: response.nextCursor,
    hasMore: response.hasMore,
    totalEstimate: response.totalEstimate,
  }
}

export function rememberSignalUpdate(signal: SignalDto): void {
  for (const [key, snapshot] of snapshots) {
    const changed = snapshot.items.some((item) => item.id === signal.id)
    if (changed) {
      setFeedSnapshot(key, {
        ...snapshot,
        items: snapshot.items.map((item) => (item.id === signal.id ? signal : item)),
      })
    }
  }
}
