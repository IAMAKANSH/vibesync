import { auth } from "@/auth";
import { getCoupleForUser } from "@/lib/couple";
import { getTodayMood } from "@/lib/mood";
import {
  buildPrompt,
  callAI,
  extractJson,
  fallbackSuggestions,
  resolveAIConfig,
} from "@/lib/ai";
import { redis, TTL_SUGGESTION_CACHE } from "@/lib/redis";
import { K } from "@/lib/keys";
import { haversineKm } from "@/lib/geo";
import type { Suggestions } from "@/lib/types";

function digest(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.vid) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  const ctx = await getCoupleForUser(session.user.vid);
  if (!ctx) return Response.json({ error: "no-user" }, { status: 404 });
  if (!ctx.couple || !ctx.partner) {
    return Response.json({ error: "not-paired" }, { status: 400 });
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";

  const [myMood, pMood] = await Promise.all([
    getTodayMood(ctx.me.id),
    getTodayMood(ctx.partner.id),
  ]);

  const sameLocation =
    !!myMood?.lat &&
    !!myMood?.lng &&
    !!pMood?.lat &&
    !!pMood?.lng &&
    haversineKm(
      { lat: myMood.lat, lng: myMood.lng },
      { lat: pMood.lat, lng: pMood.lng }
    ) < 40;

  const distanceKm =
    myMood?.lat && myMood?.lng && pMood?.lat && pMood?.lng
      ? haversineKm(
          { lat: myMood.lat, lng: myMood.lng },
          { lat: pMood.lat, lng: pMood.lng }
        )
      : undefined;

  const promptInput = {
    me: { name: ctx.me.name, mood: myMood ?? undefined },
    partner: { name: ctx.partner.name, mood: pMood ?? undefined },
    sameLocation,
    distanceKm,
    myCity: myMood?.city,
    partnerCity: pMood?.city,
  };

  const key = `${ctx.me.id}|${myMood?.score ?? "-"}|${myMood?.note?.slice(0, 80) ?? ""}|${pMood?.score ?? "-"}|${pMood?.note?.slice(0, 80) ?? ""}|${sameLocation}`;
  const cacheKey = K.suggestCache(ctx.couple.id, digest(key));

  if (!force) {
    const cached = await redis().get<string | Suggestions>(cacheKey);
    if (cached) {
      const data = typeof cached === "string" ? JSON.parse(cached) : cached;
      return Response.json({ suggestions: data, cached: true });
    }
  }

  const cfg = resolveAIConfig(ctx.couple);
  if (!cfg) {
    const fb = fallbackSuggestions(
      promptInput.me,
      promptInput.partner,
      !sameLocation
    );
    return Response.json({
      suggestions: fb,
      cached: false,
      fallback: true,
      reason: "ai-not-configured",
    });
  }

  const prompt = buildPrompt(promptInput);
  try {
    const raw = await callAI(
      cfg,
      [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      { json: true, temperature: 0.85, maxTokens: 900 }
    );
    const parsed = extractJson(raw) as Suggestions;
    await redis().set(cacheKey, JSON.stringify(parsed), {
      ex: TTL_SUGGESTION_CACHE,
    });
    return Response.json({ suggestions: parsed, cached: false });
  } catch (err) {
    const fb = fallbackSuggestions(
      promptInput.me,
      promptInput.partner,
      !sameLocation
    );
    return Response.json({
      suggestions: fb,
      cached: false,
      fallback: true,
      reason: err instanceof Error ? err.message : "ai-error",
    });
  }
}
