import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AppProvider } from "@/providers/app-provider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "CareCompliance — CQC Regulation 18 Portal",
    template: "%s | CareCompliance",
  },
  description:
    "Enterprise CQC compliance management system for UK care homes. Track staff training, certificates, competencies and audit readiness in real-time.",
  keywords: [
    "CQC compliance",
    "care home management",
    "Regulation 18",
    "staff training tracker",
    "certificate management",
  ],
  authors: [{ name: "CareCompliance" }],
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "CareCompliance — CQC Regulation 18 Portal",
    description: "Enterprise compliance management for UK care homes",
    type: "website",
  },
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${inter.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}