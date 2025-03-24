import type React from "react";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mock user data - in a real app, this would come from authentication
  const user = {
    name: "John Doe",
    email: "john@example.com",
    image: "/placeholder.svg?height=32&width=32",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex w-full">
        <SidebarProvider>
          <Sidebar user={user} />
        </SidebarProvider>
        <div className="pt-16 px-4 md:px-6 lg:px-8 w-full flex-1">
          <div className="py-6 max-w-6xl mx-auto w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
