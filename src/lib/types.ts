export type User = {
  id: string;
  email: string;
  name: string;
  image?: string;
  code: string;
  coupleId?: string;
  createdAt: number;
};

export type Couple = {
  id: string;
  aId: string;
  bId: string;
  createdAt: number;
  aiProviderUrl?: string;
  aiProviderKey?: string;
  aiModel?: string;
  liveQuestion?: string;
  liveQuestionAt?: number;
};

export type MoodEntry = {
  userId: string;
  date: string;
  score: number;
  note?: string;
  tags?: string[];
  lat?: number;
  lng?: number;
  city?: string;
  updatedAt: number;
};

export type Suggestions = {
  conversation: string[];
  activity: string;
  date_idea: string;
  music: { vibe: string; tracks: string[] };
  affirmation: string;
  long_distance?: string;
};

export type NearbyPlace = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  distance?: number;
  address?: string;
};
