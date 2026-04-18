import { auth } from "@/auth";
import { getCoupleForUser, bumpCoupleVer } from "@/lib/couple";
import { redis, TTL_30_DAYS } from "@/lib/redis";
import { K } from "@/lib/keys";
import {
  resolveAIConfig,
  callAI,
  extractJson,
} from "@/lib/ai";
import { z } from "zod";

type LiveState = {
  question?: string;
  questionAt?: number;
  reactionMe?: string;
  reactionPartner?: string;
  compliment?: string;
  complimentAt?: number;
  complimentFrom?: string;
};

const Body = z.union([
  z.object({ action: z.literal("new-question") }),
  z.object({ action: z.literal("react"), reaction: z.string().max(40) }),
  z.object({ action: z.literal("compliment") }),
  z.object({ action: z.literal("clear") }),
]);

const FALLBACK_QUESTIONS = [
  "What's one thing about us you wish more people knew?",
  "What would our perfect Sunday look like?",
  "What's a tiny thing I do that you secretly love?",
  "If we had to start a business together, what would it be?",
  "What song instantly reminds you of us?",
  "What's the weirdest compliment I could give you right now?",
  "If you could relive any day of ours, which one?",
  "What's something new you want us to try together this month?",
  "What's been on your mind that you haven't said yet?",
  "If you had to describe me in 3 emojis today, which ones?",
];

async function genQuestion(coupleId: string, ctxNames: { me: string; p: string }): Promise<string> {
  const couple = await (async () => {
    const raw = await redis().get<string>(K.couple(coupleId));
    return raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : null;
  })();
  const cfg = resolveAIConfig(couple);
  if (!cfg) {
    return FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
  }
  try {
    const raw = await callAI(
      cfg,
      [
        {
          role: "system",
          content:
            "You generate ONE short, playful, intimate question for a couple to answer together. Return JSON: { question: string }. Keep it under 20 words. Avoid cliches.",
        },
        {
          role: "user",
          content: `For ${ctxNames.me} and ${ctxNames.p}. Give one fresh question.`,
        },
      ],
      { json: true, temperature: 1.0, maxTokens: 120 }
    );
    const parsed = extractJson(raw) as { question?: string };
    return (
      parsed.question ||
      FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)]
    );
  } catch {
    return FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
  }
}

async function genCompliment(
  coupleId: string,
  fromName: string,
  toName: string
): Promise<string> {
  const couple = await (async () => {
    const raw = await redis().get<string>(K.couple(coupleId));
    return raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : null;
  })();
  const cfg = resolveAIConfig(couple);
  const fallback = `${toName}, being with you makes even ordinary days feel like something. — ${fromName}`;
  if (!cfg) return fallback;
  try {
    const raw = await callAI(
      cfg,
      [
        {
          role: "system",
          content:
            "Generate a warm, specific, non-cheesy compliment one partner is sending to the other. Return JSON { compliment: string }. 1-2 sentences.",
        },
        {
          role: "user",
          content: `From ${fromName} to ${toName}. Fresh, not generic.`,
        },
      ],
      { json: true, temperature: 1.0, maxTokens: 120 }
    );
    const parsed = extractJson(raw) as { compliment?: string };
    return parsed.compliment || fallback;
  } catch {
    return fallback;
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.vid) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const ctx = await getCoupleForUser(session.user.vid);
  if (!ctx?.couple || !ctx.partner) {
    return Response.json({ error: "not-paired" }, { status: 400 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }

  const r = redis();
  const key = K.live(ctx.couple.id);
  const existingRaw = await r.get<string | LiveState>(key);
  const existing: LiveState = existingRaw
    ? typeof existingRaw === "string"
      ? JSON.parse(existingRaw)
      : existingRaw
    : {};

  const isMeA = ctx.couple.aId === ctx.me.id;

  let next: LiveState = { ...existing };
  if (parsed.data.action === "new-question") {
    next = {
      question: await genQuestion(ctx.couple.id, {
        me: ctx.me.name,
        p: ctx.partner.name,
      }),
      questionAt: Date.now(),
    };
  } else if (parsed.data.action === "react") {
    if (isMeA) next.reactionMe = parsed.data.reaction;
    else next.reactionPartner = parsed.data.reaction;
  } else if (parsed.data.action === "compliment") {
    next.compliment = await genCompliment(
      ctx.couple.id,
      ctx.me.name,
      ctx.partner.name
    );
    next.complimentAt = Date.now();
    next.complimentFrom = ctx.me.name;
  } else if (parsed.data.action === "clear") {
    next = {};
  }

  await r.set(key, JSON.stringify(next), { ex: TTL_30_DAYS });
  await bumpCoupleVer(ctx.couple.id);

  return Response.json({ ok: true, live: next });
}
