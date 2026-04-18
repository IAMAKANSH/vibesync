import { Redis } from "@upstash/redis";

let client: Redis | null = null;

export function redis(): Redis {
  if (client) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Upstash Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local"
    );
  }
  client = new Redis({ url, token });
  return client;
}

export const TTL_30_DAYS = 60 * 60 * 24 * 30;
export const TTL_PRESENCE = 120;
export const TTL_SUGGESTION_CACHE = 60 * 60 * 6;
