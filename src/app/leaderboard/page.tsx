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
  if (rank === 1) {
    return (
      <div className="relative flex items-center justify-center w-8 h-8">
        <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-sm" />
        <Crown className="h-5 w-5 text-yellow-500 relative z-10" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-8 h-8">
        <Medal className="h-5 w-5 text-gray-400" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-8 h-8">
        <Medal className="h-5 w-5 text-amber-600" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-8 h-8">
      <span className="text-sm font-medium text-muted-foreground tabular-nums">{rank}</span>
    </div>
  );
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
        <div className="space-y-2 animate-fade-in">
          {entries.map((entry, i) => {
            const rank = i + 1;
            const tier = getPslTier(entry.avgOverallRating);
            const isTop3 = rank <= 3;
            return (
              <Card
                key={entry.uid}
                className={cn(
                  "flex items-center gap-3 p-3.5 card-hover border-border/50",
                  isTop3 && "border-brand/20 bg-brand/[0.03]",
                  rank === 1 && "glow-brand-sm"
                )}
              >
                {/* Rank */}
                <RankBadge rank={rank} />

                {/* Avatar */}
                <div className={cn(
                  "relative",
                  isTop3 && "ring-2 ring-brand/30 rounded-full"
                )}>
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={entry.photo} />
                    <AvatarFallback className="bg-muted text-sm font-medium">
                      {entry.displayName[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{entry.displayName}</span>
                    <span className={cn("text-[10px] font-semibold uppercase tracking-wide", tier.color)}>
                      {tier.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {entry.totalRatingsReceived} ratings
                    </span>
                    <RankChange currentRank={rank} previousRank={entry.previousRank} />
                  </div>
                </div>

                {/* Scores */}
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Face</div>
                    <div className="font-semibold text-sm tabular-nums">{entry.avgFaceRating.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Overall</div>
                    <div className="font-bold text-lg text-brand tabular-nums">
                      {entry.avgOverallRating.toFixed(1)}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
