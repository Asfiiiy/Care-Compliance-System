const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const token = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (typeof document !== "undefined") {
      document.cookie = `${ACCESS_TOKEN_KEY}=${accessToken}; path=/; max-age=900; SameSite=Lax;`;
      document.cookie = `${REFRESH_TOKEN_KEY}=${refreshToken}; path=/; max-age=604800; SameSite=Lax;`;
    }
  },

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    if (typeof document !== "undefined") {
      document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
    }
  },
};