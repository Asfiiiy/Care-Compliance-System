import axios from "axios";

import { appConfig } from "@/config/app.config";
import { token } from "@/lib/token";

export const api = axios.create({
  baseURL: appConfig.api.baseUrl,

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const accessToken = token.getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },

  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, tokenStr: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(tokenStr);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === "/auth/refresh" || originalRequest.url?.includes("/auth/refresh")) {
        token.clearTokens();
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard")) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((tokenStr) => {
            originalRequest.headers.Authorization = `Bearer ${tokenStr}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = token.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await api.post("/auth/refresh", { refreshToken });
          const newAccessToken = refreshRes.data?.data?.accessToken;
          const newRefreshToken = refreshRes.data?.data?.refreshToken;

          if (newAccessToken && newRefreshToken) {
            token.setTokens(newAccessToken, newRefreshToken);
            api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            processQueue(null, newAccessToken);
            isRefreshing = false;

            return api(originalRequest);
          } else {
            throw new Error("Token refresh response missing keys");
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          token.clearTokens();
          if (typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard")) {
            window.location.href = "/login";
          }
          return Promise.reject(refreshError);
        }
      } else {
        token.clearTokens();
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard")) {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);