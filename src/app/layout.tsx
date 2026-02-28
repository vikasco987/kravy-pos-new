// src/app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";
import Providers from "@/components/Providers";
import { SidebarProvider } from "@/components/SidebarContext";

export const metadata = {
  title: "Kravy Billing",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <Providers>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}