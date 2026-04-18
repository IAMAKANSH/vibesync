import { auth } from "@/auth";
import { unpair } from "@/lib/couple";

export async function POST() {
  const session = await auth();
  if (!session?.user?.vid) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  await unpair(session.user.vid);
  return Response.json({ ok: true });
}
