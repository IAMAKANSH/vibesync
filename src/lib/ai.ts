import type { Couple, MoodEntry, Suggestions, User } from "./types";

export type AIConfig = {
  url: string;
  key: string;
  model: string;
};

export function resolveAIConfig(couple: Couple | null): AIConfig | null {
  const url = couple?.aiProviderUrl || process.env.AI_PROVIDER_URL || "";
  const key = couple?.aiProviderKey || process.env.AI_PROVIDER_KEY || "";
  const model = couple?.aiModel || process.env.AI_MODEL || "";
  if (!url || !key || !model) return null;
  return { url: url.replace(/\/$/, ""), key, model };
}

function moodVibe(score: number): string {
  if (score <= 2) return "really low, feeling drained";
  if (score <= 4) return "a bit down, off";
  if (score <= 6) return "okay, neutral";
  if (score <= 8) return "good, cheerful";
  return "great, glowing";
}

export function buildPrompt(input: {
  me: { name: string; mood?: MoodEntry };
  partner: { name: string; mood?: MoodEntry };
  sameLocation: boolean;
  distanceKm?: number;
  myCity?: string;
  partnerCity?: string;
}): { system: string; user: string } {
  const system = [
    "You are VibeSync, a warm, playful relationship companion for one couple.",
    "You get both partners' moods today and suggest what to talk about, a date idea, an activity, a music vibe, and a loving affirmation.",
    "Keep it light, creative, culturally neutral-friendly (works for India and anywhere). Never moralize, never lecture.",
    "If partners are apart, make the date idea something they can do *together while apart* (synced activity, share something, video-call ritual).",
    "Return STRICT JSON, no prose, no code fences.",
    "Schema: { conversation: string[3], activity: string, date_idea: string, music: { vibe: string, tracks: string[3-5] }, affirmation: string, long_distance?: string }",
  ].join(" ");

  const meMood = input.me.mood;
  const pMood = input.partner.mood;
  const meLine = meMood
    ? `${input.me.name}: mood ${meMood.score}/10 (${moodVibe(meMood.score)})${meMood.note ? `, note: "${meMood.note}"` : ""}`
    : `${input.me.name}: has not logged today`;
  const pLine = pMood
    ? `${input.partner.name}: mood ${pMood.score}/10 (${moodVibe(pMood.score)})${pMood.note ? `, note: "${pMood.note}"` : ""}`
    : `${input.partner.name}: has not logged today`;

  const loc = input.sameLocation
    ? `They are in the same city${input.myCity ? ` (${input.myCity})` : ""}.`
    : `They are apart${
        input.myCity && input.partnerCity
          ? ` — ${input.me.name} in ${input.myCity}, ${input.partner.name} in ${input.partnerCity}`
          : ""
      }${input.distanceKm ? `, about ${Math.round(input.distanceKm)} km apart` : ""}.`;

  const userMsg = [
    meLine,
    pLine,
    loc,
    "Give fresh, specific, human suggestions tailored to this combined mood. Return JSON only.",
  ].join("\n");

  return { system, user: userMsg };
}

export async function callAI(
  cfg: AIConfig,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts: { maxTokens?: number; temperature?: number; json?: boolean } = {}
): Promise<string> {
  const body: Record<string, unknown> = {
    model: cfg.model,
    messages,
    temperature: opts.temperature ?? 0.8,
    max_tokens: opts.maxTokens ?? 900,
    stream: false,
  };
  if (opts.json) {
    body.response_format = { type: "json_object" };
  }
  const resp = await fetch(`${cfg.url}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.key}`,
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(
      `AI provider error ${resp.status}: ${errText.slice(0, 300)}`
    );
  }
  const data = await resp.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI response had no content");
  return content;
}

export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object in AI response");
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

export function fallbackSuggestions(
  me: { name: string; mood?: MoodEntry },
  partner: { name: string; mood?: MoodEntry },
  apart: boolean
): Suggestions {
  const avg =
    ((me.mood?.score ?? 5) + (partner.mood?.score ?? 5)) / 2;
  const low = avg < 5;
  return {
    conversation: low
      ? [
          "What is weighing on you today, even the tiny thing?",
          "What is one moment this week you felt seen?",
          "If today was a weather, what would it be?",
        ]
      : [
          "What made you smile today that you forgot to mention?",
          "If we had the next weekend totally free, what would you do with me?",
          "What is something you are proud of this week?",
        ],
    activity: apart
      ? "Start the same playlist at the same time and text reactions to each song."
      : "Cook one dish together from scratch, no recipe — just vibes.",
    date_idea: apart
      ? "Virtual movie night: pick a film neither of you has seen, hit play at the same second, voice call on mute with cameras on."
      : "Golden hour walk in the nearest park, stop for chai, take one silly photo each.",
    music: {
      vibe: low ? "soft, warm, comforting" : "playful, upbeat, light",
      tracks: low
        ? ["Tum Se Hi", "Holocene - Bon Iver", "Kabira", "I Will Wait"]
        : ["Kun Faya Kun", "Galway Girl", "Channa Mereya", "Best Part"],
    },
    affirmation: `${me.name}, ${partner.name} is lucky to be with you. Keep being you.`,
    long_distance: apart
      ? "Send a 10-second voice note right now with exactly what you are doing. No edits."
      : undefined,
  };
}
