"use client";

import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth";
import type { LoginResponse } from "@/types/auth";

export function useRegister() {
  return useMutation<LoginResponse, Error, any>({
    mutationFn: async (payload) => {
      const response = await authService.register(payload);
      return response.data;
    },
  });
}
