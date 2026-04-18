import { auth } from "@/auth";
import { pairUsers } from "@/lib/couple";
import { z } from "zod";

const Body = z.object({ code: z.string().min(4).max(12) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.vid) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  const result = await pairUsers(session.user.vid, parsed.data.code);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  return Response.json({ ok: true, coupleId: result.coupleId });
}
