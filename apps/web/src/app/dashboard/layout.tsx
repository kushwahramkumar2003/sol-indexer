import type React from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background custom-scrollbar">
      <div className="flex w-full">
        <SidebarProvider>
          <Sidebar />
        </SidebarProvider>
        <div className="pt-16 px-4 md:px-6 lg:px-8 w-full flex-1">
          <div className="py-6 max-w-6xl mx-auto w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
