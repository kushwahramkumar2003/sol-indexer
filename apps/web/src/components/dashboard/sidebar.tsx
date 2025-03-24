"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  Database,
  Server,
  Activity,
  Users,
  HelpCircle,
  ChevronRight,
  Bell,
  User,
  LogOut,
  Settings2,
  CreditCard,
  ChevronDown,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    image: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  // Auto-open the submenu based on current path
  useEffect(() => {
    setMounted(true);
    if (mounted && pathname) {
      const newOpenSubmenus = { ...openSubmenus };

      // Check if pathname starts with any of the submenu parent paths
      if (pathname.startsWith("/dashboard/configurations")) {
        newOpenSubmenus["Configurations"] = true;
      }

      setOpenSubmenus(newOpenSubmenus);
    }
  }, [pathname, mounted]);

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isActive = (href: string) => {
    if (href === "/dashboard" && pathname === "/dashboard") {
      return true;
    }
    return pathname.startsWith(href) && href !== "/dashboard";
  };

  return (
    <ShadcnSidebar className="fixed top-0 border-r border-border/40">
      <SidebarHeader className="py-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.image} alt={user?.name} />
            <AvatarFallback>
              {user ? getInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 overflow-hidden">
            <p className="text-sm font-medium leading-none truncate">
              {user?.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto">
                <ChevronDown className="h-4 w-4" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings2 className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible
                open={openSubmenus["Configurations"]}
                onOpenChange={() => toggleSubmenu("Configurations")}
                className="w-full"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(
                        "/dashboard/configurations"
                      )}
                    >
                      <Settings className="h-5 w-5" />
                      <span>Configurations</span>
                      <ChevronRight
                        className={cn(
                          "ml-auto h-4 w-4 transition-transform",
                          openSubmenus["Configurations"] && "rotate-90"
                        )}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </SidebarMenuItem>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname === "/dashboard/configurations/nft"}
                      >
                        <Link href="/dashboard/configurations/nft">
                          NFT Indexing
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={
                          pathname === "/dashboard/configurations/token"
                        }
                      >
                        <Link href="/dashboard/configurations/token">
                          Token Indexing
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild
                        isActive={
                          pathname === "/dashboard/configurations/transaction"
                        }
                      >
                        <Link href="/dashboard/configurations/transaction">
                          Transaction Indexing
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/databases"}
                >
                  <Link href="/dashboard/databases">
                    <Database className="h-5 w-5" />
                    <span>Databases</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/webhooks"}
                >
                  <Link href="/dashboard/webhooks">
                    <Server className="h-5 w-5" />
                    <span>Webhooks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/analytics"}
                >
                  <Link href="/dashboard/analytics">
                    <Activity className="h-5 w-5" />
                    <span>Analytics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/team"}
                >
                  <Link href="/dashboard/team">
                    <Users className="h-5 w-5" />
                    <span>Team</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/notifications"}
                >
                  <Link href="/dashboard/notifications">
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuBadge>3</SidebarMenuBadge>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/support"}
                >
                  <Link href="/dashboard/support">
                    <HelpCircle className="h-5 w-5" />
                    <span>Support</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="py-4">
        <div className="px-3 space-y-2">
          <div className="flex justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Pro Plan
            </p>
            <p className="text-xs font-medium">75%</p>
          </div>
          <Progress value={75} className="h-2" />
          <p className="text-xs text-muted-foreground">75% of quota used</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </ShadcnSidebar>
  );
}
