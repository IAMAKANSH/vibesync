import { redis, TTL_PRESENCE } from "./redis";
import { K } from "./keys";

export async function markOnline(userId: string): Promise<void> {
  await redis().set(K.presence(userId), Date.now(), { ex: TTL_PRESENCE });
}

export async function getPresence(userId: string): Promise<number | null> {
  const v = await redis().get<number | string>(K.presence(userId));
  if (v == null) return null;
  return typeof v === "string" ? parseInt(v, 10) : v;
}

export function isRecent(ts: number | null, windowMs = 90_000): boolean {
  if (!ts) return false;
  return Date.now() - ts < windowMs;
}
