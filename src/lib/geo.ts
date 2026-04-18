import type { NearbyPlace } from "./types";

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

type OverpassEl = {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const OVERPASS_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runOverpass(query: string): Promise<OverpassEl[]> {
  let bestResult: OverpassEl[] | null = null;
  const errors: string[] = [];

  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const resp = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(22_000),
        });
        if (resp.status === 429) {
          if (attempt === 0) {
            await sleep(1500);
            continue;
          }
          errors.push(`${endpoint} 429 after retry`);
          break;
        }
        if (!resp.ok) {
          errors.push(`${endpoint} ${resp.status}`);
          break;
        }
        const data = (await resp.json()) as { elements: OverpassEl[] };
        const els = data.elements || [];
        if (els.length > 0) return els;
        if (!bestResult) bestResult = els;
        errors.push(`${endpoint} empty`);
        break;
      } catch (e) {
        errors.push(
          `${endpoint} ${e instanceof Error ? e.message : "failed"}`
        );
        break;
      }
    }
  }
  if (bestResult !== null) return bestResult;
  throw new Error(`overpass unavailable: ${errors.join(" | ")}`);
}

export async function fetchNearby(params: {
  lat: number;
  lng: number;
  radiusMeters?: number;
  categories?: Array<"restaurant" | "cafe" | "bar" | "park" | "cinema" | "ice_cream">;
}): Promise<NearbyPlace[]> {
  const radius = params.radiusMeters ?? 2500;
  const cats = params.categories ?? [
    "restaurant",
    "cafe",
    "bar",
    "park",
    "cinema",
    "ice_cream",
  ];

  const amenityCats = cats.filter((c) => c !== "park");
  const leisureCats = cats.includes("park") ? ["park"] : [];

  const lines: string[] = [];
  if (amenityCats.length) {
    const re = amenityCats.join("|");
    lines.push(
      `node["amenity"~"^(${re})$"](around:${radius},${params.lat},${params.lng});`
    );
    lines.push(
      `way["amenity"~"^(${re})$"](around:${radius},${params.lat},${params.lng});`
    );
  }
  for (const l of leisureCats) {
    lines.push(
      `node["leisure"="${l}"](around:${radius},${params.lat},${params.lng});`
    );
    lines.push(
      `way["leisure"="${l}"](around:${radius},${params.lat},${params.lng});`
    );
  }

  const query = `[out:json][timeout:20];(${lines.join("")});out center 40;`;
  const elements = await runOverpass(query);

  const places: NearbyPlace[] = [];
  for (const el of elements) {
    const name = el.tags?.name;
    if (!name) continue;
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;
    const category =
      el.tags?.amenity || el.tags?.leisure || el.tags?.cuisine || "place";
    places.push({
      id: `${el.type}/${el.id}`,
      name,
      category,
      lat,
      lng,
      distance: haversineKm({ lat: params.lat, lng: params.lng }, { lat, lng }),
    });
  }

  places.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  return places.slice(0, 18);
}
