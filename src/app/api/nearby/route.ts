import { auth } from "@/auth";
import { fetchNearby } from "@/lib/geo";
import { z } from "zod";

const Q = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(200).max(15000).optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.vid) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const url = new URL(req.url);
  const parsed = Q.safeParse({
    lat: url.searchParams.get("lat"),
    lng: url.searchParams.get("lng"),
    radius: url.searchParams.get("radius"),
  });
  if (!parsed.success) {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  try {
    const places = await fetchNearby({
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      radiusMeters: parsed.data.radius,
    });
    return Response.json({ places });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "nearby-failed" },
      { status: 502 }
    );
  }
}
