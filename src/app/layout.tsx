// src/app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";
import Providers from "@/components/Providers";
import { SidebarProvider } from "@/components/SidebarContext";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "KravyPOS — Smart Billing System",
  description: "Modern point-of-sale and billing system for restaurants and retail",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        <Providers>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}