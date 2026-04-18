import { customAlphabet } from "nanoid";
import { redis, TTL_30_DAYS } from "./redis";
import { K } from "./keys";
import type { Couple, User } from "./types";
import { getUserById, getUserByCode, saveUser } from "./user";

const coupleIdGen = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 18);

export async function getCouple(coupleId: string): Promise<Couple | null> {
  const raw = await redis().get<string | Couple>(K.couple(coupleId));
  if (!raw) return null;
  return typeof raw === "string" ? (JSON.parse(raw) as Couple) : raw;
}

export async function saveCouple(couple: Couple): Promise<void> {
  const r = redis();
  await r.set(K.couple(couple.id), JSON.stringify(couple), { ex: TTL_30_DAYS });
  await r.incr(K.coupleVer(couple.id));
  await r.expire(K.coupleVer(couple.id), TTL_30_DAYS);
}

export async function bumpCoupleVer(coupleId: string): Promise<number> {
  const r = redis();
  const v = await r.incr(K.coupleVer(coupleId));
  await r.expire(K.coupleVer(coupleId), TTL_30_DAYS);
  return v;
}

export async function getCoupleVer(coupleId: string): Promise<number> {
  const v = await redis().get<number | string>(K.coupleVer(coupleId));
  if (v == null) return 0;
  return typeof v === "string" ? parseInt(v, 10) || 0 : v;
}

export async function pairUsers(userId: string, partnerCode: string): Promise<
  { ok: true; coupleId: string } | { ok: false; error: string }
> {
  const me = await getUserById(userId);
  if (!me) return { ok: false, error: "user-not-found" };
  if (me.code.toUpperCase() === partnerCode.toUpperCase()) {
    return { ok: false, error: "cannot-pair-with-self" };
  }
  const partner = await getUserByCode(partnerCode);
  if (!partner) return { ok: false, error: "code-not-found" };
  if (me.coupleId && me.coupleId === partner.coupleId) {
    return { ok: true, coupleId: me.coupleId };
  }
  if (me.coupleId || partner.coupleId) {
    return { ok: false, error: "already-paired" };
  }

  const coupleId = coupleIdGen();
  const couple: Couple = {
    id: coupleId,
    aId: me.id,
    bId: partner.id,
    createdAt: Date.now(),
  };
  await saveCouple(couple);

  me.coupleId = coupleId;
  partner.coupleId = coupleId;
  await saveUser(me);
  await saveUser(partner);

  return { ok: true, coupleId };
}

export async function unpair(userId: string): Promise<void> {
  const me = await getUserById(userId);
  if (!me || !me.coupleId) return;
  const couple = await getCouple(me.coupleId);
  if (!couple) return;
  const partnerId = couple.aId === userId ? couple.bId : couple.aId;
  const partner = await getUserById(partnerId);

  me.coupleId = undefined;
  await saveUser(me);
  if (partner) {
    partner.coupleId = undefined;
    await saveUser(partner);
  }
  await bumpCoupleVer(couple.id);
  await redis().del(K.couple(couple.id));
}

export async function getCoupleForUser(userId: string): Promise<{
  me: User;
  partner: User | null;
  couple: Couple | null;
} | null> {
  const me = await getUserById(userId);
  if (!me) return null;
  if (!me.coupleId) return { me, partner: null, couple: null };
  const couple = await getCouple(me.coupleId);
  if (!couple) return { me, partner: null, couple: null };
  const partnerId = couple.aId === me.id ? couple.bId : couple.aId;
  const partner = await getUserById(partnerId);
  return { me, partner, couple };
}
