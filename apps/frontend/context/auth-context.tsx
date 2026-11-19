"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";

import type { AuthUser } from "@/types/auth";
import { token } from "@/lib/token";
import { authService } from "@/services/auth";

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (user: AuthUser) => void;
  logout: () => void;
  refetchUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const accessToken = token.getAccessToken();
      const refreshToken = token.getRefreshToken();

      if (accessToken || refreshToken) {
        try {
          const response = await authService.me();
          setUser(response.data.data);
        } catch (error) {
          console.error("Auth initialization failed:", error);
          token.clearTokens();
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setIsLoading(false);
    }

    initAuth();
  }, []);

  const refetchUser = async () => {
    try {
      const response = await authService.me();
      setUser(response.data.data);
    } catch (error) {
      console.error("Auth refetch failed:", error);
    }
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,

      login(authUser: AuthUser) {
        setUser(authUser);
      },

      logout() {
        token.clearTokens();
        setUser(null);
      },

      refetchUser,
    }),
    [user, isLoading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}