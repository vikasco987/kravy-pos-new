import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import Providers from "@/components/Providers";
import ClientLayout from "@/components/ClientLayout";

export const metadata = {
  title: "Kravy Billing",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="h-screen overflow-hidden bg-gray-50">
          <Providers>
            <ClientLayout>{children}</ClientLayout>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}