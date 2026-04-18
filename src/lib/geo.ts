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

  const query = `[out:json][timeout:15];(${lines.join("")});out center 40;`;

  const resp = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!resp.ok) {
    throw new Error(`Overpass error ${resp.status}`);
  }
  const data = (await resp.json()) as { elements: OverpassEl[] };

  const places: NearbyPlace[] = [];
  for (const el of data.elements || []) {
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
