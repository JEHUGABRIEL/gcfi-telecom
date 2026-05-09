// src/lib/api.ts
// Service API — connecte le frontend React au backend E-Bia local

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export interface Artist {
  id: string;
  slug: string;
  name: string;
  bio: string;
  genre: string;
  city: string;
  avatar_url: string;
  cover_url: string;
  verified: boolean;
  followers_count: number;
  plays_count: number;
  tracks_count: number;
  tracks?: Track[];
}

export interface Track {
  id: string;
  title: string;
  duration_s: number;
  genre: string;
  plays_count: number;
  artist_name?: string;
  artist_avatar?: string;
}

export const getArtists = () =>
  request<{ data: Artist[]; total: number }>('/api/v1/artists');

export const getArtist = (slug: string) =>
  request<Artist>(`/api/v1/artists/${slug}`);

export const getTracks = (params?: { genre?: string; q?: string; page?: number }) => {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return request<{ data: Track[]; page: number; limit: number }>(
    `/api/v1/tracks${qs ? `?${qs}` : ''}`
  );
};

export const recordPlay = (trackId: string, offline = false) =>
  request(`/api/v1/tracks/${trackId}/play`, {
    method: 'POST',
    body: JSON.stringify({ offline }),
  });
