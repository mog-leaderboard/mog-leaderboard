"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Flame, Star, Trophy, BarChart3 } from "lucide-react";
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
        <Flame className="h-8 w-8 animate-pulse text-orange-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 -mt-14 md:-mt-16">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-orange-500/10 p-4">
              <Flame className="h-12 w-12 text-orange-500" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Mog or Get Mogged
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
            Upload your photos, get your PSL rating from real people, and find
            out if you&apos;re a Gigachad or still stuck at HTN.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="rounded-xl border p-4 space-y-2">
            <Star className="h-6 w-6 text-yellow-500" />
            <h3 className="font-semibold">Get Your PSL Rating</h3>
            <p className="text-sm text-muted-foreground">
              Find out your canthal tilt score, FWHR, and overall mogability from 0-10.
            </p>
          </div>
          <div className="rounded-xl border p-4 space-y-2">
            <Trophy className="h-6 w-6 text-orange-500" />
            <h3 className="font-semibold">Mog the Competition</h3>
            <p className="text-sm text-muted-foreground">
              Climb from LTN to Chad status on the top 100 mogger leaderboard.
            </p>
          </div>
          <div className="rounded-xl border p-4 space-y-2">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            <h3 className="font-semibold">Analyze Your Halo</h3>
            <p className="text-sm text-muted-foreground">
              See which demographics rate your bone structure the highest. Halo effect is real.
            </p>
          </div>
        </div>

        <Button
          size="lg"
          className="text-lg px-8 py-6 bg-orange-500 hover:bg-orange-600"
          onClick={signInWithGoogle}
        >
          Start Looksmaxxing with Google
        </Button>
      </div>
    </div>
  );
}
