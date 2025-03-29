"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Database,
  Menu,
  ChevronDown,
  LayoutDashboard,
  Settings,
  LogOut,
  User,
  Bell,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { clearAuth, getAuth } from "@/lib/localStorage";

interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

interface NavbarProps {
  variant?: "landing" | "dashboard";
  items?: NavItem[];
}

interface AuthData {
  token: string;
  user: {
    id: string;
    email: string;
  };
  message?: string;
  expiresAt: number;
}

export function Navbar({
  variant = "landing",
  items = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [authData, setAuthData] = useState<AuthData | null>(null);

  const isDashboard = variant === "dashboard";

  useEffect(() => {
    const authData = getAuth();
    if (authData) {
      console.log("User is authenticated");
      console.log(authData);
    }
  });

  useEffect(() => {
    const authData = getAuth();
    setAuthData(authData);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        {
          "bg-background/80 backdrop-blur-md py-3 shadow-md":
            isScrolled || isDashboard,
          "bg-transparent py-5": !isScrolled && !isDashboard,
          "border-b border-border/40": isDashboard,
        }
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">HeliusIndex</span>
          </Link>

          {!isDashboard && (
            <nav className="hidden md:flex items-center ml-10 gap-1">
              {items.map((item) => (
                <div key={item.label} className="relative group">
                  {item.children ? (
                    <button
                      onClick={() => handleDropdownToggle(item.label)}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                      {item.label}
                      <ChevronDown
                        className={cn("h-4 w-4 transition-transform", {
                          "rotate-180": openDropdown === item.label,
                        })}
                      />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}

                  {item.children && openDropdown === item.label && (
                    <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-popover border border-border overflow-hidden">
                      <div className="py-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="block px-4 py-2 text-sm hover:bg-accent transition-colors"
                            onClick={() => setOpenDropdown(null)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          )}

          {isDashboard && (
            <nav className="hidden md:flex items-center ml-10 gap-1">
              {items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isDashboard && (
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                3
              </span>
            </Button>
          )}

          {authData ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {authData.user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">User</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {authData.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    clearAuth();
                    window.location.href = "/";
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}

          <div className="flex md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      <span>HeliusIndex</span>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <div className="py-6">
                  <nav className="flex flex-col gap-4">
                    {items.map((item) => (
                      <div key={item.label}>
                        {item.children ? (
                          <>
                            <button
                              onClick={() => handleDropdownToggle(item.label)}
                              className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                            >
                              {item.label}
                              <ChevronDown
                                className={cn("h-4 w-4 transition-transform", {
                                  "rotate-180": openDropdown === item.label,
                                })}
                              />
                            </button>
                            <AnimatePresence>
                              {openDropdown === item.label && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pl-4 py-2 space-y-2">
                                    {item.children.map((child) => (
                                      <Link
                                        key={child.label}
                                        href={child.href}
                                        className="block px-2 py-1 text-sm rounded-md hover:bg-accent transition-colors"
                                      >
                                        {child.label}
                                      </Link>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        ) : (
                          <Link
                            href={item.href}
                            className="px-2 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                          >
                            {item.label}
                          </Link>
                        )}
                      </div>
                    ))}
                  </nav>

                  {!authData && (
                    <div className="mt-6 space-y-3">
                      <Link href="/login">
                        <Button variant="outline" className="w-full">
                          Log In
                        </Button>
                      </Link>
                      <Link href="/signup">
                        <Button className="w-full">Sign Up</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
