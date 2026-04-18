import { auth } from "@/auth";
import { logMood, getTodayMood, getRecentMoods } from "@/lib/mood";
import { getCoupleForUser, bumpCoupleVer } from "@/lib/couple";
import { todayISO } from "@/lib/keys";
import { z } from "zod";

const Body = z.object({
  score: z.number().int().min(1).max(10),
  note: z.string().max(500).optional(),
  tags: z.array(z.string().max(20)).max(6).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  city: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.vid) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }

  const entry = {
    userId: session.user.vid,
    date: todayISO(),
    score: parsed.data.score,
    note: parsed.data.note,
    tags: parsed.data.tags,
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    city: parsed.data.city,
    updatedAt: Date.now(),
  };
  await logMood(entry);

  const ctx = await getCoupleForUser(session.user.vid);
  if (ctx?.couple) await bumpCoupleVer(ctx.couple.id);

  return Response.json({ ok: true, mood: entry });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.vid) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const ctx = await getCoupleForUser(session.user.vid);
  if (!ctx) return Response.json({ error: "no-user" }, { status: 404 });

  const [myToday, myHistory] = await Promise.all([
    getTodayMood(ctx.me.id),
    getRecentMoods(ctx.me.id, 30),
  ]);

  let partnerToday = null;
  let partnerHistory: Awaited<ReturnType<typeof getRecentMoods>> = [];
  if (ctx.partner) {
    const [pt, ph] = await Promise.all([
      getTodayMood(ctx.partner.id),
      getRecentMoods(ctx.partner.id, 30),
    ]);
    partnerToday = pt;
    partnerHistory = ph;
  }

  return Response.json({
    today: todayISO(),
    me: { today: myToday, history: myHistory },
    partner: ctx.partner
      ? { today: partnerToday, history: partnerHistory }
      : null,
  });
}
