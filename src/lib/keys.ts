export const K = {
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email.toLowerCase()}`,
  code: (code: string) => `code:${code.toUpperCase()}`,
  couple: (id: string) => `couple:${id}`,
  coupleVer: (id: string) => `couple:${id}:ver`,
  mood: (userId: string, date: string) => `mood:${userId}:${date}`,
  moodRecent: (userId: string) => `mood:${userId}:recent`,
  presence: (userId: string) => `presence:${userId}`,
  suggestCache: (coupleId: string, digest: string) =>
    `suggest:${coupleId}:${digest}`,
  live: (coupleId: string) => `live:${coupleId}`,
};

export function todayISO(tzOffsetMinutes = 0): string {
  const now = new Date(Date.now() - tzOffsetMinutes * 60 * 1000);
  return now.toISOString().slice(0, 10);
}
