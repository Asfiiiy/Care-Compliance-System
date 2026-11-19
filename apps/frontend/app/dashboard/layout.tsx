"use client";

import { SidebarLayout } from "@/components/layout/sidebar-layout";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
