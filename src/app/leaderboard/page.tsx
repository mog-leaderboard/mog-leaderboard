"use client";

import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Flame, Trophy, Crown, Medal } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { LeaderboardEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getLeaderboard } from "@/lib/firestore-helpers";

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
        <Flame className="h-8 w-8 animate-pulse text-orange-500" />
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm text-muted-foreground w-5 text-center">{rank}</span>;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-orange-500" />
            Mog Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground">Top 100 moggers — certified Chads and Stacys only</p>
        </div>
      </div>

      <Tabs value={gender} onValueChange={setGender}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="male">Chads</TabsTrigger>
          <TabsTrigger value="female">Stacys</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Flame className="h-8 w-8 animate-pulse text-orange-500" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No moggers yet. Be the first to ascend!
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => {
            const rank = i + 1;
            return (
              <Card
                key={entry.uid}
                className={cn(
                  "flex items-center gap-4 p-4",
                  rank <= 3 && "border-orange-500/30 bg-orange-500/5"
                )}
              >
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(rank)}
                </div>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={entry.photo} />
                  <AvatarFallback>{entry.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{entry.displayName}</div>
                  <div className="text-xs text-muted-foreground">
                    {entry.totalRatingsReceived} ratings
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="text-xs text-muted-foreground">Face</div>
                    <div className="font-semibold">{entry.avgFaceRating.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Overall</div>
                    <div className="font-bold text-lg text-orange-500">
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
