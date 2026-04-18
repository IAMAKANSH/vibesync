import { auth } from "@/auth";
import { fetchNearby } from "@/lib/geo";
import { redis } from "@/lib/redis";
import { z } from "zod";
import type { NearbyPlace } from "@/lib/types";

const Q = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(200).max(15000).optional(),
});

const TTL_NEARBY = 60 * 60; // 1 hour

function cacheKey(lat: number, lng: number, radius: number) {
  const la = lat.toFixed(3);
  const ln = lng.toFixed(3);
  return `nearby:${la}:${ln}:${radius}`;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.vid) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const url = new URL(req.url);
  const parsed = Q.safeParse({
    lat: url.searchParams.get("lat"),
    lng: url.searchParams.get("lng"),
    radius: url.searchParams.get("radius") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  const radius = parsed.data.radius ?? 2500;
  const k = cacheKey(parsed.data.lat, parsed.data.lng, radius);

  const cached = await redis().get<string | NearbyPlace[]>(k);
  if (cached) {
    const places =
      typeof cached === "string" ? (JSON.parse(cached) as NearbyPlace[]) : cached;
    return Response.json({ places, cached: true });
  }

  try {
    const places = await fetchNearby({
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      radiusMeters: radius,
    });
    await redis().set(k, JSON.stringify(places), { ex: TTL_NEARBY });
    return Response.json({ places, cached: false });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "nearby-failed" },
      { status: 502 }
    );
  }
}
