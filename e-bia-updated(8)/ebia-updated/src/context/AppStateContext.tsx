import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Artist, Playlist, Notification } from "../types";
import keycloak, { initKeycloak, getCurrentUser } from "../lib/keycloak";
import { getArtists } from "../lib/api";

export interface EbiaUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  roles: string[];
  isArtist: boolean;
  isAdmin: boolean;
}

interface AppStateContextType {
  user: EbiaUser | null;
  authReady: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  loginDemo: () => void;
  followedArtists: number[];
  likedArtists: number[];
  toggleFollow: (artistId: number) => void;
  toggleLikeArtist: (artistId: number) => Promise<void>;
  queue: string[];
  addToQueue: (songId: string | string[]) => void;
  currentSongIndex: number;
  setCurrentSongIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  volume: number;
  setVolume: (v: number) => void;
  playlists: Playlist[];
  createPlaylist: (name: string) => Promise<void>;
  artists: Artist[];
  artistsLoading: boolean;
}

const AppStateContext = createContext<AppStateContextType | null>(null);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<EbiaUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [followedArtists, setFollowedArtists] = useState<number[]>([]);
  const [likedArtists, setLikedArtists] = useState<number[]>([]);
  const [queue, setQueue] = useState<string[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [volume, setVolume] = useState(0.8);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);

  useEffect(() => {
    initKeycloak().then(() => {
      setUser(getCurrentUser());
      setAuthReady(true);
    }).catch(() => setAuthReady(true));

    keycloak.onAuthSuccess = () => setUser(getCurrentUser());
    keycloak.onAuthLogout = () => setUser(null);
    keycloak.onTokenExpired = () => keycloak.updateToken(60);
  }, []);

  useEffect(() => {
    getArtists()
      .then(res => setArtists(res.data))
      .catch(() => setArtists([]))
      .finally(() => setArtistsLoading(false));
  }, []);

  const toggleFollow = (id: number) =>
    setFollowedArtists(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const toggleLikeArtist = async (id: number) => {
    setLikedArtists(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const addToQueue = (songId: string | string[]) =>
    setQueue(prev => [...prev, ...(Array.isArray(songId) ? songId : [songId])]);

  const createPlaylist = async (name: string) => {
    const newPlaylist: Playlist = { id: Date.now().toString(), name, songs: [], createdAt: new Date().toISOString() };
    setPlaylists(prev => [...prev, newPlaylist]);
  };

  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));

  return (
    <AppStateContext.Provider value={{
      user, authReady,
      isAuthenticated: keycloak.authenticated ?? false,
      login: () => keycloak.login({ locale: "fr" }),
      logout: () => keycloak.logout({ redirectUri: window.location.origin }),
      loginDemo: () => setUser({ id: "demo", email: "demo@e-bia.app", displayName: "Visiteur", roles: ["listener"], isArtist: false, isAdmin: false }),
      followedArtists, likedArtists, toggleFollow, toggleLikeArtist,
      queue, addToQueue, currentSongIndex, setCurrentSongIndex,
      isPlaying, setIsPlaying, theme, toggleTheme, volume, setVolume,
      playlists, createPlaylist, artists, artistsLoading,
    }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState doit être dans AppStateProvider");
  return ctx;
};
