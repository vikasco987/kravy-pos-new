// src/app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";
import Providers from "@/components/Providers";
import ClientLayout from "@/components/ClientLayout";
import { auth } from "@clerk/nextjs/server";

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
      <body className="h-screen overflow-hidden bg-gray-50">
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
