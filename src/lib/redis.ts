import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN
const isConfigured = url && !url.includes('your-redis') && token && !token.includes('your-token')

export const redis = isConfigured
  ? new Redis({ url, token })
  : null

export const CACHE_KEYS = {
  apartmentsList: (region: string) => `apartments:list:${region}`,
  apartmentsDetail: (id: string) => `apartments:detail:${id}`,
  articlesList: () => 'articles:list',
  regionSummary: (name: string) => `region:summary:${name}`,
  allRegions: () => 'apartments:all-regions',
} as const

export const CACHE_TTL = {
  apartmentsList: 3600,    // 1시간
  apartmentsDetail: 21600, // 6시간
  articlesList: 1800,      // 30분
  regionSummary: 7200,     // 2시간
  allRegions: 86400,       // 24시간
} as const

export async function getOrSet<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  if (!redis) return fetcher()

  const cached = await redis.get<T>(key)
  if (cached !== null) return cached

  const fresh = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(fresh))
  return fresh
}
