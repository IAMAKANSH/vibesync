import { auth } from "@/auth";
import { getCoupleForUser, getCoupleVer } from "@/lib/couple";
import { markOnline, getPresence, isRecent } from "@/lib/presence";
import { getTodayMood } from "@/lib/mood";
import { redis } from "@/lib/redis";
import { K } from "@/lib/keys";

type LiveStateStored = {
  question?: string;
  questionAt?: number;
  reactionA?: string;
  reactionB?: string;
  answerA?: string;
  answerAAt?: number;
  answerB?: string;
  answerBAt?: number;
  compliment?: string;
  complimentAt?: number;
  complimentFrom?: string;
};

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.vid) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const ctx = await getCoupleForUser(session.user.vid);
  if (!ctx) return Response.json({ error: "no-user" }, { status: 404 });

  await markOnline(ctx.me.id);

  const url = new URL(req.url);
  const sinceVer = parseInt(url.searchParams.get("v") || "0", 10);
  const ver = ctx.couple ? await getCoupleVer(ctx.couple.id) : 0;

  if (ver === sinceVer && sinceVer !== 0) {
    return new Response(null, { status: 204, headers: { "X-Ver": String(ver) } });
  }

  const [myToday, partnerToday, partnerPresence, liveRaw] = await Promise.all([
    getTodayMood(ctx.me.id),
    ctx.partner ? getTodayMood(ctx.partner.id) : Promise.resolve(null),
    ctx.partner ? getPresence(ctx.partner.id) : Promise.resolve(null),
    ctx.couple
      ? redis().get<string | LiveStateStored>(K.live(ctx.couple.id))
      : Promise.resolve(null),
  ]);
  const liveStored: LiveStateStored | null = liveRaw
    ? typeof liveRaw === "string"
      ? (JSON.parse(liveRaw) as LiveStateStored)
      : liveRaw
    : null;

  const isMeA = ctx.couple ? ctx.couple.aId === ctx.me.id : true;
  const live = liveStored
    ? {
        question: liveStored.question,
        questionAt: liveStored.questionAt,
        reactionMe: isMeA ? liveStored.reactionA : liveStored.reactionB,
        reactionPartner: isMeA ? liveStored.reactionB : liveStored.reactionA,
        answerMe: isMeA ? liveStored.answerA : liveStored.answerB,
        answerMeAt: isMeA ? liveStored.answerAAt : liveStored.answerBAt,
        answerPartner: isMeA ? liveStored.answerB : liveStored.answerA,
        answerPartnerAt: isMeA ? liveStored.answerBAt : liveStored.answerAAt,
        compliment: liveStored.compliment,
        complimentAt: liveStored.complimentAt,
        complimentFrom: liveStored.complimentFrom,
      }
    : null;

  return Response.json({
    ver,
    me: {
      id: ctx.me.id,
      name: ctx.me.name,
      code: ctx.me.code,
      today: myToday,
    },
    partner: ctx.partner
      ? {
          id: ctx.partner.id,
          name: ctx.partner.name,
          image: ctx.partner.image,
          today: partnerToday,
          online: isRecent(partnerPresence),
          lastSeen: partnerPresence,
        }
      : null,
    couple: ctx.couple
      ? {
          id: ctx.couple.id,
          aiConfigured: Boolean(
            ctx.couple.aiProviderUrl &&
              ctx.couple.aiProviderKey &&
              ctx.couple.aiModel
          ),
        }
      : null,
    live,
  });
}
