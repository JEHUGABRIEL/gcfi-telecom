// src/lib/keycloak.ts
import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8080",
  realm: "ebia",
  clientId: "ebia-web",
});

export const initKeycloak = () =>
  keycloak.init({
    onLoad: "check-sso",
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    pkceMethod: "S256",
    checkLoginIframe: false,
  });

export const login = () => keycloak.login({ locale: "fr" });
export const logout = () => keycloak.logout({ redirectUri: window.location.origin });

export const getToken = async (): Promise<string | null> => {
  if (!keycloak.authenticated) return null;
  try {
    await keycloak.updateToken(60);
    return keycloak.token ?? null;
  } catch {
    keycloak.login();
    return null;
  }
};

export const getCurrentUser = () => {
  if (!keycloak.authenticated || !keycloak.tokenParsed) return null;
  const p = keycloak.tokenParsed as any;
  const roles: string[] = p.realm_access?.roles ?? [];
  return {
    id: p.sub,
    email: p.email,
    displayName: p.name ?? p.preferred_username,
    avatarUrl: p.picture,
    roles,
    isArtist: roles.includes("artist") || roles.includes("admin"),
    isAdmin: roles.includes("admin"),
  };
};

export default keycloak;
