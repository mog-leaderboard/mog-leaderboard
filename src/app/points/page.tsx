"use client";

import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Flame, Coins, Wallet, Gift, Star, Save, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { POINTS_PER_RATING } from "@/lib/types";
import { getRatingHistory } from "@/lib/firestore-helpers";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PointsPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [solanaWallet, setSolanaWallet] = useState("");
  const [savingWallet, setSavingWallet] = useState(false);

  useEffect(() => {
    if (profile) {
      setSolanaWallet(profile.solanaWallet || "");
    }
  }, [profile]);

  const handleSaveWallet = async () => {
    if (!user) return;
    setSavingWallet(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { solanaWallet: solanaWallet.trim() || null },
        { merge: true }
      );
      await refreshProfile();
    } catch (err) {
      console.error("Error saving wallet:", err);
    } finally {
      setSavingWallet(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const { data: recentRatings = [] } = useQuery<
    { ratedUserId: string; createdAt: string }[]
  >({
    queryKey: ["recent-ratings"],
    queryFn: () => getRatingHistory(user!.uid),
    enabled: !!user,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Flame className="h-8 w-8 animate-pulse text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Coins className="h-6 w-6 text-yellow-500" />
          Your Points
        </h1>
        <p className="text-sm text-muted-foreground">
          Earn {POINTS_PER_RATING} points for each rating you give
        </p>
      </div>

      {/* Points balance */}
      <Card className="bg-gradient-to-br from-orange-500 to-yellow-500 text-white">
        <CardContent className="p-8 text-center">
          <div className="text-sm opacity-90 mb-2">Total Points</div>
          <div className="text-5xl font-bold">{profile?.points || 0}</div>
          <div className="text-sm opacity-75 mt-2">
            {Math.floor((profile?.points || 0) / POINTS_PER_RATING)} ratings given
          </div>
        </CardContent>
      </Card>

      {/* How to earn */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="h-4 w-4" />
            How to Earn Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-orange-500">
              +{POINTS_PER_RATING}
            </Badge>
            <span className="text-sm">Rate another user (face + overall)</span>
          </div>
        </CardContent>
      </Card>

      {/* Wallet */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Solana Wallet (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={solanaWallet}
              onChange={(e) => setSolanaWallet(e.target.value)}
              placeholder="Your Solana wallet address"
              className="font-mono text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={savingWallet || solanaWallet === (profile?.solanaWallet || "")}
              onClick={handleSaveWallet}
            >
              {savingWallet ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Connect your wallet to be eligible for future token airdrops
          </p>
        </CardContent>
      </Card>

      {/* Coming soon */}
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Gift className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold">Token Claim Coming Soon</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Your points will be convertible to tokens on Solana. Keep rating to earn more!
          </p>
        </CardContent>
      </Card>

      {/* Recent activity */}
      {recentRatings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRatings.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Rated a user
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-green-600">
                      +{POINTS_PER_RATING}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
