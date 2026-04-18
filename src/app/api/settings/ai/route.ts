import { auth } from "@/auth";
import { getCoupleForUser, saveCouple } from "@/lib/couple";
import { z } from "zod";

const Body = z.object({
  aiProviderUrl: z.string().url().optional().or(z.literal("")),
  aiProviderKey: z.string().min(1).optional().or(z.literal("")),
  aiModel: z.string().min(1).optional().or(z.literal("")),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.vid) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const ctx = await getCoupleForUser(session.user.vid);
  if (!ctx?.couple) {
    return Response.json({ error: "not-paired" }, { status: 400 });
  }
  return Response.json({
    aiProviderUrl: ctx.couple.aiProviderUrl || "",
    aiModel: ctx.couple.aiModel || "",
    hasKey: Boolean(ctx.couple.aiProviderKey),
    envDefaultsPresent: Boolean(
      process.env.AI_PROVIDER_URL &&
        process.env.AI_PROVIDER_KEY &&
        process.env.AI_MODEL
    ),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.vid) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const ctx = await getCoupleForUser(session.user.vid);
  if (!ctx?.couple) {
    return Response.json({ error: "not-paired" }, { status: 400 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }

  const next = { ...ctx.couple };
  if (parsed.data.aiProviderUrl !== undefined) {
    next.aiProviderUrl = parsed.data.aiProviderUrl || undefined;
  }
  if (parsed.data.aiProviderKey !== undefined) {
    next.aiProviderKey = parsed.data.aiProviderKey || undefined;
  }
  if (parsed.data.aiModel !== undefined) {
    next.aiModel = parsed.data.aiModel || undefined;
  }
  await saveCouple(next);

  return Response.json({ ok: true });
}
