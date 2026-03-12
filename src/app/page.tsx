"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Flame, Star, Trophy, BarChart3, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/rate");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Flame className="h-8 w-8 animate-pulse text-brand" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 -mt-14 md:-mt-16">
      <div className="max-w-3xl text-center space-y-10 animate-fade-in">
        {/* Hero */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="rounded-2xl bg-brand/10 p-5 border border-brand/20">
                <Flame className="h-14 w-14 text-brand" />
              </div>
              <div className="absolute inset-0 blur-2xl bg-brand/20 -z-10 rounded-full" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight font-heading">
            Mog or Get{" "}
            <span className="text-gradient">Mogged</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Upload your photos, get your PSL rating from real people, and find
            out if you&apos;re a Gigachad or still stuck at HTN.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-3 card-hover">
            <div className="rounded-xl bg-yellow-500/10 w-10 h-10 flex items-center justify-center">
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <h3 className="font-semibold font-heading text-[15px]">Get Your PSL Rating</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Find out your canthal tilt score, FWHR, and overall mogability from 0-10.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-3 card-hover">
            <div className="rounded-xl bg-brand/10 w-10 h-10 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-brand" />
            </div>
            <h3 className="font-semibold font-heading text-[15px]">Mog the Competition</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Climb from LTN to Chad status on the top 100 mogger leaderboard.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-3 card-hover">
            <div className="rounded-xl bg-blue-500/10 w-10 h-10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="font-semibold font-heading text-[15px]">Analyze Your Halo</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              See which demographics rate your bone structure the highest. Halo effect is real.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            className="text-lg px-8 py-6 bg-brand hover:bg-brand/90 text-brand-foreground glow-brand-sm transition-all duration-300 hover:scale-[1.02] font-heading font-semibold"
            onClick={signInWithGoogle}
          >
            Start Looksmaxxing with Google
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <p className="text-xs text-muted-foreground">Free to join. No cap.</p>
        </div>
      </div>
    </div>
  );
}
