"use client";

import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Flame, Trophy, Crown, Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { LeaderboardEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getLeaderboard } from "@/lib/firestore-helpers";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
  return <span className="text-xs font-medium text-muted-foreground tabular-nums">{rank}</span>;
}

function RankChange({ currentRank, previousRank }: { currentRank: number; previousRank?: number }) {
  if (previousRank === undefined || previousRank === null) {
    return <span className="text-[10px] text-emerald-400 font-medium">NEW</span>;
  }
  const diff = previousRank - currentRank;
  if (diff > 0) {
    return (
      <span className="flex items-center gap-0.5 text-[11px] text-emerald-400 font-semibold tabular-nums">
        <TrendingUp className="h-3 w-3" />
        {diff}
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="flex items-center gap-0.5 text-[11px] text-red-400 font-semibold tabular-nums">
        <TrendingDown className="h-3 w-3" />
        {Math.abs(diff)}
      </span>
    );
  }
  return (
    <span className="flex items-center text-[11px] text-muted-foreground">
      <Minus className="h-3 w-3" />
    </span>
  );
}

function getPslTier(score: number) {
  if (score >= 9) return { label: "Mogger", color: "text-emerald-400" };
  if (score >= 8) return { label: "Gigachad", color: "text-green-400" };
  if (score >= 6.5) return { label: "Chad", color: "text-green-500" };
  if (score >= 5.5) return { label: "Chadlite", color: "text-yellow-400" };
  if (score >= 4.5) return { label: "HTN", color: "text-orange-400" };
  if (score >= 3.5) return { label: "MTN", color: "text-orange-500" };
  if (score >= 2) return { label: "LTN", color: "text-red-400" };
  return { label: "Sub-5", color: "text-red-500" };
}

export default function LeaderboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [gender, setGender] = useState<string>("all");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const { data: entries = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard", gender],
    queryFn: () => getLeaderboard(gender !== "all" ? gender : undefined),
    enabled: !!user,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Flame className="h-8 w-8 animate-pulse text-brand" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 font-heading">
            <div className="relative">
              <Trophy className="h-6 w-6 text-brand" />
              <div className="absolute inset-0 blur-md bg-brand/30 -z-10" />
            </div>
            Mog Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Top 100 moggers — certified Chads and Stacys only
          </p>
        </div>
      </div>

      <Tabs value={gender} onValueChange={setGender}>
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="male">Chads</TabsTrigger>
          <TabsTrigger value="female">Stacys</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Flame className="h-8 w-8 animate-pulse text-brand" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No moggers yet.</p>
          <p className="text-sm mt-1">Be the first to ascend!</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden divide-y divide-border/40 animate-fade-in">
          {entries.map((entry, i) => {
            const rank = i + 1;
            const tier = getPslTier(entry.avgOverallRating);
            const isTop3 = rank <= 3;
            return (
              <div
                key={entry.uid}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-muted/30",
                  isTop3 && "bg-brand/[0.03]"
                )}
              >
                <div className="w-6 shrink-0">
                  <RankBadge rank={rank} />
                </div>

                <Avatar className={cn("h-8 w-8 shrink-0", isTop3 && "ring-1 ring-brand/30")}>
                  <AvatarImage src={entry.photo} />
                  <AvatarFallback className="bg-muted text-xs">{entry.displayName[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <span className="font-medium text-sm truncate">{entry.displayName}</span>
                  <span className={cn("text-[9px] font-semibold uppercase tracking-wide shrink-0", tier.color)}>
                    {tier.label}
                  </span>
                  <RankChange currentRank={rank} previousRank={entry.previousRank} />
                </div>

                <div className="flex items-baseline gap-3 shrink-0 tabular-nums text-right">
                  <span className="text-xs text-muted-foreground">{entry.avgFaceRating.toFixed(1)}</span>
                  <span className="font-bold text-sm text-brand">{entry.avgOverallRating.toFixed(1)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
