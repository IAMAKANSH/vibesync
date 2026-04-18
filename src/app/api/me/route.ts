import { auth } from "@/auth";
import { getCoupleForUser } from "@/lib/couple";
import { markOnline, getPresence, isRecent } from "@/lib/presence";
import { getCoupleVer } from "@/lib/couple";

export async function GET() {
  const session = await auth();
  if (!session?.user?.vid) {
    return Response.json({ authed: false }, { status: 401 });
  }
  const ctx = await getCoupleForUser(session.user.vid);
  if (!ctx) return Response.json({ authed: false }, { status: 401 });
  await markOnline(ctx.me.id);
  const partnerPresence = ctx.partner
    ? await getPresence(ctx.partner.id)
    : null;
  const ver = ctx.couple ? await getCoupleVer(ctx.couple.id) : 0;
  return Response.json({
    authed: true,
    me: {
      id: ctx.me.id,
      name: ctx.me.name,
      email: ctx.me.email,
      image: ctx.me.image,
      code: ctx.me.code,
    },
    partner: ctx.partner
      ? {
          id: ctx.partner.id,
          name: ctx.partner.name,
          image: ctx.partner.image,
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
    ver,
  });
}
