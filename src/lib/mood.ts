import { redis, TTL_30_DAYS } from "./redis";
import { K, todayISO } from "./keys";
import type { MoodEntry } from "./types";

export async function logMood(entry: MoodEntry): Promise<void> {
  const r = redis();
  const key = K.mood(entry.userId, entry.date);
  await r.set(key, JSON.stringify(entry), { ex: TTL_30_DAYS });
  await r.zadd(K.moodRecent(entry.userId), {
    score: Date.parse(entry.date),
    member: entry.date,
  });
  await r.expire(K.moodRecent(entry.userId), TTL_30_DAYS);
}

export async function getMood(
  userId: string,
  date: string
): Promise<MoodEntry | null> {
  const raw = await redis().get<string | MoodEntry>(K.mood(userId, date));
  if (!raw) return null;
  return typeof raw === "string" ? (JSON.parse(raw) as MoodEntry) : raw;
}

export async function getTodayMood(userId: string): Promise<MoodEntry | null> {
  return getMood(userId, todayISO());
}

export async function getRecentMoods(
  userId: string,
  days = 30
): Promise<MoodEntry[]> {
  const r = redis();
  const dates = await r.zrange<string[]>(
    K.moodRecent(userId),
    -days,
    -1,
    { rev: false }
  );
  if (!dates || dates.length === 0) return [];
  const keys = dates.map((d) => K.mood(userId, d));
  const raws = await r.mget<(string | MoodEntry | null)[]>(...keys);
  const entries: MoodEntry[] = [];
  for (const raw of raws) {
    if (!raw) continue;
    entries.push(typeof raw === "string" ? JSON.parse(raw) : raw);
  }
  return entries;
}
