"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Database,
  HelpCircle,
  ChevronRight,
  User,
  LogOut,
  Settings2,
  CreditCard,
  ChevronDown,
  Menu,
  X,
  Search,
  Clock,
  BarChart3,
  Webhook,
  PanelLeft,
  Moon,
  Sun,
  Laptop,
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
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AuthData } from "@/lib/localStorage";

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    image: string;
    role?: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [recentlyVisited, setRecentlyVisited] = useState<string[]>([]);
  const { theme, setTheme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [authData, setAuthData] = useState<AuthData | null>(null);

  useEffect(() => {
    const fetchAuth = async () => {
      const { getAuth } = await import("@/lib/localStorage");
      const data = getAuth();
      setAuthData(data);
    };
    fetchAuth();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  useEffect(() => {
    setMounted(true);
    if (mounted && pathname) {
      const newOpenSubmenus = { ...openSubmenus };

      if (pathname.startsWith("/dashboard/configurations")) {
        newOpenSubmenus["Configurations"] = true;
      }

      setOpenSubmenus(newOpenSubmenus);

      if (pathname !== "/dashboard" && !recentlyVisited.includes(pathname)) {
        setRecentlyVisited((prev) => [pathname, ...prev].slice(0, 5));
      }
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

  const getPageName = (path: string) => {
    if (path === "/dashboard") return "Dashboard";
    return path
      .split("/")
      .pop()
      ?.split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const mainMenuItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Databases",
      href: "/dashboard/databases",
      icon: <Database className="h-5 w-5" />,
    },
    {
      title: "Webhooks",
      href: "/dashboard/webhooks",
      icon: <Webhook className="h-5 w-5" />,
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Support",
      href: "/dashboard/support",
      icon: <HelpCircle className="h-5 w-5" />,
    },
  ];

  const filteredMenuItems = searchQuery
    ? mainMenuItems.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mainMenuItems;

  const DesktopSidebar = () => (
    <ShadcnSidebar className="fixed top-0 border-r border-border/40 hidden md:block">
      <SidebarHeader className="py-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.image} alt={authData?.user?.email} />
            <AvatarFallback>
              {authData?.user?.email
                ? authData.user.email.charAt(0).toUpperCase()
                : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 overflow-hidden">
            <p className="text-sm font-medium leading-none truncate">
              {authData?.user?.email || "User"}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto">
                <ChevronDown className="h-4 w-4" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings2 className="mr-2 h-4 w-4" />
                  Settings
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Sun
                    className="mr-2 h-4 w-4"
                    onClick={() => setTheme("light")}
                  />
                  Light Mode
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Moon
                    className="mr-2 h-4 w-4"
                    onClick={() => setTheme("dark")}
                  />
                  Dark Mode
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Laptop
                    className="mr-2 h-4 w-4"
                    onClick={() => setTheme("system")}
                  />
                  System
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500 focus:text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarHeader>

      <div className="px-3 py-2">
        <div className="relative">
          {isSearchOpen ? (
            <div className="flex items-center space-x-2">
              <Input
                type="search"
                placeholder="Search..."
                className="h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                onBlur={() => {
                  if (!searchQuery) {
                    setIsSearchOpen(false);
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              Search...
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          )}
        </div>
      </div>

      <SidebarContent>
        {searchQuery && (
          <SidebarGroup>
            <SidebarGroupLabel>Search Results</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMenuItems.length > 0 ? (
                  filteredMenuItems.map((item) => (
                    <div key={item.title}>
                      {
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive(item.href)}
                          >
                            <Link href={item.href}>
                              {item.icon}
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      }
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No results found
                  </div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {!searchQuery && recentlyVisited.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Recently Visited</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recentlyVisited.map((path) => {
                  const menuItem = mainMenuItems.find(
                    (item) => item.href === path
                  );

                  if (!menuItem) return null;

                  return (
                    <SidebarMenuItem key={path}>
                      <SidebarMenuButton asChild isActive={isActive(path)}>
                        <Link href={path}>
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{getPageName(path)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <div key={item.title}>
                  {
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive(item.href)}>
                        <Link href={item.href}>
                          {item.icon}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  }
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="py-4">
        <div className="px-3 space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-xs font-medium text-muted-foreground">
              Pro Plan
            </p>
            <Badge variant="outline" className="text-xs">
              75% Used
            </Badge>
          </div>
          <Progress value={75} className="h-2" />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">75% of quota used</p>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
              Upgrade
            </Button>
          </div>
        </div>
        <div className="mt-4 px-3">
          <Button variant="outline" size="sm" className="w-full">
            <PanelLeft className="mr-2 h-4 w-4" />
            {state === "expanded" ? "Collapse" : "Expand"} Sidebar
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </ShadcnSidebar>
  );

  const MobileSidebar = () => (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden fixed top-4 left-4 z-40"
          aria-label="Open Menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[300px] sm:w-[350px]">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b">
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
                  {user?.role || "Admin"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Navigation</h3>
                <div className="space-y-1">
                  {(searchQuery ? filteredMenuItems : mainMenuItems).map(
                    (item) => (
                      <div key={item.title}>
                        {
                          <Button
                            variant={
                              isActive(item.href) ? "secondary" : "ghost"
                            }
                            className="w-full justify-start"
                            asChild
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Link href={item.href}>
                              {item.icon}
                              <span className="ml-2">{item.title}</span>
                            </Link>
                          </Button>
                        }
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Pro Plan</p>
                    <Badge variant="outline">75% Used</Badge>
                  </div>
                  <Progress value={75} className="h-2" />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      75% of quota used
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                    >
                      Upgrade
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/dashboard/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/dashboard/settings">
                      <Settings2 className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start">
                        {theme === "dark" ? (
                          <Moon className="mr-2 h-4 w-4" />
                        ) : theme === "light" ? (
                          <Sun className="mr-2 h-4 w-4" />
                        ) : (
                          <Laptop className="mr-2 h-4 w-4" />
                        )}
                        Theme
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      <DropdownMenuItem onClick={() => setTheme("light")}>
                        <Sun className="mr-2 h-4 w-4" />
                        Light
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("dark")}>
                        <Moon className="mr-2 h-4 w-4" />
                        Dark
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("system")}>
                        <Laptop className="mr-2 h-4 w-4" />
                        System
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-500 hover:bg-red-500/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
}
