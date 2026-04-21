import type { ReactNode } from "react";
import ClientLayout from "@/components/ClientLayout";
import { AuthProvider } from "@/components/AuthContext";

export const metadata = {
  title: "Kravy Billing",
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthProvider>
      <ClientLayout>{children}</ClientLayout>
    </AuthProvider>
  );
}