import { customAlphabet } from "nanoid";
import { redis, TTL_30_DAYS } from "./redis";
import { K } from "./keys";
import type { User } from "./types";

const codeGen = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const idGen = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

async function uniqueCode(): Promise<string> {
  const r = redis();
  for (let i = 0; i < 6; i++) {
    const code = codeGen();
    const existing = await r.get<string>(K.code(code));
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique pair code");
}

export async function upsertUser(params: {
  email: string;
  name: string;
  image?: string;
}): Promise<User> {
  const r = redis();
  const existingId = await r.get<string>(K.userByEmail(params.email));
  if (existingId) {
    const user = await getUserById(existingId);
    if (user) {
      await r.expire(K.user(user.id), TTL_30_DAYS);
      await r.expire(K.userByEmail(user.email), TTL_30_DAYS);
      await r.expire(K.code(user.code), TTL_30_DAYS);
      return user;
    }
  }

  const id = idGen();
  const code = await uniqueCode();
  const user: User = {
    id,
    email: params.email,
    name: params.name,
    image: params.image,
    code,
    createdAt: Date.now(),
  };

  await r.set(K.user(id), JSON.stringify(user), { ex: TTL_30_DAYS });
  await r.set(K.userByEmail(params.email), id, { ex: TTL_30_DAYS });
  await r.set(K.code(code), id, { ex: TTL_30_DAYS });
  return user;
}

export async function getUserById(id: string): Promise<User | null> {
  const raw = await redis().get<string | User>(K.user(id));
  if (!raw) return null;
  return typeof raw === "string" ? (JSON.parse(raw) as User) : raw;
}

export async function getUserByCode(code: string): Promise<User | null> {
  const id = await redis().get<string>(K.code(code.toUpperCase()));
  if (!id) return null;
  return getUserById(id);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const id = await redis().get<string>(K.userByEmail(email.toLowerCase()));
  if (!id) return null;
  return getUserById(id);
}

export async function saveUser(user: User): Promise<void> {
  await redis().set(K.user(user.id), JSON.stringify(user), { ex: TTL_30_DAYS });
}
