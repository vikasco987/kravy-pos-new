import type { ReactNode } from "react";
import ClientLayout from "@/components/ClientLayout";

export const metadata = {
  title: "Kravy Billing",
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClientLayout>{children}</ClientLayout>
  );
}