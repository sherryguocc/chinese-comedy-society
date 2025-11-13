const roleCache = new Map<string, { timestamp: number; data: any }>()
const CACHE_TTL = 5 * 60 * 1000 // 5分钟

export function getCachedRole(userId: string) {
  const cached = roleCache.get(userId)
  if (!cached) return null
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    roleCache.delete(userId)
    return null
  }
  return cached.data
}

export function setCachedRole(userId: string, data: any) {
  roleCache.set(userId, { timestamp: Date.now(), data })
}
