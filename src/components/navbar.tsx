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
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 items-center justify-between glass-strong px-6">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl group">
          <div className="relative">
            <Flame className="h-6 w-6 text-brand transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 blur-lg bg-brand/30 -z-10" />
          </div>
          <span className="font-heading tracking-tight">Mog Leaderboard</span>
        </Link>
        <div className="flex items-center gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2 transition-all duration-200",
                    isActive && "bg-brand/10 text-brand border-brand/20 border"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive && "text-brand")} />
                  {item.label}
                </Button>
              </Link>
            );
          })}
          <div className="w-px h-6 bg-border mx-2" />
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Mobile top bar */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between glass-strong px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="relative">
            <Flame className="h-5 w-5 text-brand" />
            <div className="absolute inset-0 blur-md bg-brand/30 -z-10" />
          </div>
          <span className="font-heading tracking-tight">Mog Leaderboard</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="hover:bg-brand/10">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-14 animate-fade-in">
          <div className="flex flex-col p-4 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 text-lg h-12 transition-all",
                      isActive && "bg-brand/10 text-brand"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isActive && "text-brand")} />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <div className="h-px bg-border my-3" />
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-lg h-12 text-muted-foreground hover:text-destructive"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200",
                  isActive && "bg-brand/10"
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-brand" : "text-muted-foreground"
                    )}
                  />
                  {isActive && <div className="absolute inset-0 blur-md bg-brand/40 -z-10" />}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-brand" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
