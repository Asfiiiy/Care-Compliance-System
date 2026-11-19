import { api } from "@/lib/axios";

import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
} from "@/types/auth";

export const authService = {
  login(payload: LoginRequest) {
    return api.post<LoginResponse>("/auth/login", payload);
  },

  register(payload: any) {
    return api.post<LoginResponse>("/auth/register", payload);
  },

  getOrganizations() {
    return api.get("/auth/organizations");
  },

  refresh(payload: RefreshTokenRequest) {
    return api.post("/auth/refresh", payload);
  },

  me() {
    return api.get("/auth/me");
  },

  logout() {
    return api.post("/auth/logout");
  },

  forgotPassword(payload: { email: string }) {
    return api.post<{ success: boolean; message: string }>("/auth/forgot-password", payload);
  },

  resetPassword(payload: { email: string; otp: string; password: string }) {
    return api.post<{ success: boolean; message: string }>("/auth/reset-password", payload);
  },
};