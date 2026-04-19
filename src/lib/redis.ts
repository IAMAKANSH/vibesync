import IORedis from "ioredis";
import type { Redis as IORedisType } from "ioredis";

let client: IORedisType | null = null;

function ensureClient(): IORedisType {
  if (client) return client;
  const host = process.env.REDIS_HOST;
  if (host) {
    const port = parseInt(process.env.REDIS_PORT ?? "6380", 10);
    const password = process.env.REDIS_PASSWORD;
    const useTls =
      process.env.REDIS_TLS === "true" ||
      process.env.REDIS_TLS === "1" ||
      port === 6380;
    client = new IORedis({
      host,
      port,
      password,
      tls: useTls ? {} : undefined,
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      enableReadyCheck: true,
    });
  } else {
    const url = process.env.REDIS_URL ?? "redis://localhost:6379";
    client = new IORedis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      enableReadyCheck: true,
    });
  }
  client.on("error", (err) => {
    console.error("redis error:", err?.message ?? err);
  });
  return client;
}

type SetOpts = { ex?: number };

type RedisShim = {
  get<T = string>(key: string): Promise<T | null>;
  set(key: string, value: string | number, opts?: SetOpts): Promise<"OK" | null>;
  del(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  incr(key: string): Promise<number>;
  zadd(key: string, member: { score: number; member: string }): Promise<number | null>;
  zrange<T = string[]>(
    key: string,
    start: number,
    stop: number,
    opts?: { rev?: boolean }
  ): Promise<T>;
  mget<T extends unknown[] = (string | null)[]>(...keys: string[]): Promise<T>;
};

export function redis(): RedisShim {
  return {
    async get<T = string>(key: string): Promise<T | null> {
      const v = await ensureClient().get(key);
      return v as T | null;
    },
    async set(key, value, opts) {
      const c = ensureClient();
      const str = typeof value === "number" ? String(value) : value;
      if (opts?.ex) {
        return (await c.set(key, str, "EX", opts.ex)) as "OK" | null;
      }
      return (await c.set(key, str)) as "OK" | null;
    },
    async del(key) {
      return ensureClient().del(key);
    },
    async expire(key, seconds) {
      return ensureClient().expire(key, seconds);
    },
    async incr(key) {
      return ensureClient().incr(key);
    },
    async zadd(key, { score, member }) {
      const res = await ensureClient().zadd(key, score, member);
      return typeof res === "number" ? res : res == null ? null : parseInt(res, 10);
    },
    async zrange<T = string[]>(key: string, start: number, stop: number, opts?: { rev?: boolean }) {
      const c = ensureClient();
      const result = opts?.rev
        ? await c.zrange(key, start, stop, "REV")
        : await c.zrange(key, start, stop);
      return result as T;
    },
    async mget<T extends unknown[] = (string | null)[]>(...keys: string[]): Promise<T> {
      if (keys.length === 0) return [] as unknown as T;
      const vals = await ensureClient().mget(...keys);
      return vals as T;
    },
  };
}

export const TTL_30_DAYS = 60 * 60 * 24 * 30;
export const TTL_PRESENCE = 120;
export const TTL_SUGGESTION_CACHE = 60 * 60 * 6;
