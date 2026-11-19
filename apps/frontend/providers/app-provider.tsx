"use client";

import { ReactNode } from "react";

import { AuthProvider } from "@/context/auth-context";
import { ReactQueryProvider } from "@/providers/react-query-provider";

import { Toaster } from "@/components/ui/sonner";

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  return (
    <ReactQueryProvider>
      <AuthProvider>
        {children}
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </ReactQueryProvider>
  );
}