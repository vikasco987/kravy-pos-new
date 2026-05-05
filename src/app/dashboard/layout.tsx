import type { ReactNode } from "react";
import ClientLayout from "@/components/ClientLayout";
import { AuthProvider } from "@/components/AuthContext";

export const metadata = {
  title: "Kravy Billing",
};

import { TerminalProvider } from "@/components/TerminalContext";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthProvider>
      <TerminalProvider>
        <ClientLayout>{children}</ClientLayout>
      </TerminalProvider>
    </AuthProvider>
  );
}