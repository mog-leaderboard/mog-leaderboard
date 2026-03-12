"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Flame, BarChart3, Trophy, Coins, User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/rate", label: "Rate", icon: Flame },
  { href: "/leaderboard", label: "Moggers", icon: Trophy },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/points", label: "Points", icon: Coins },
  { href: "/profile", label: "Profile", icon: User },
];

export function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      {/* Desktop navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Flame className="h-6 w-6 text-orange-500" />
          Mog Leaderboard
        </Link>
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 ml-2">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Mobile top bar */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Flame className="h-5 w-5 text-orange-500" />
          Mog Leaderboard
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background pt-14">
          <div className="flex flex-col p-4 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 text-lg h-12"
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-lg h-12 mt-4"
              onClick={() => {
                signOut();
                setMobileOpen(false);
              }}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 flex items-center justify-around border-t bg-background/95 backdrop-blur">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1">
              <Icon
                className={cn(
                  "h-5 w-5",
                  pathname === item.href ? "text-orange-500" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-xs",
                  pathname === item.href ? "text-orange-500 font-medium" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
