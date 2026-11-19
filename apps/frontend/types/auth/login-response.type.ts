import type { AuthUser } from "./auth-user.type";

export interface LoginResponse {
  success: boolean;
  statusCode: number;
  message: string;

  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: AuthUser;
  };

  timestamp: string;
}