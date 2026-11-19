"use client";

import { useMutation } from "@tanstack/react-query";

import { authService } from "@/services/auth";

import type { LoginRequest, LoginResponse } from "@/types/auth";

export function useLogin() {
  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: async (payload) => {
      const response = await authService.login(payload);

      return response.data;
    },
  });
}