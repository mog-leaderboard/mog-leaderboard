"use client";

import { useAuth } from "@/lib/auth-context";
import { RatingCard } from "@/components/rating-card";
import { Button } from "@/components/ui/button";
import { Flame, Loader2, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { getNextUserToRate, submitRating } from "@/lib/firestore-helpers";

interface UserToRate {
  uid: string;
  displayName: string;
  photos: string[];
}

export default function RatePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserToRate | null>(null);
  const [fetchingNext, setFetchingNext] = useState(true);
  const [noMoreUsers, setNoMoreUsers] = useState(false);

  const fetchNextUser = useCallback(async () => {
    if (!user) return;
    setFetchingNext(true);
    setNoMoreUsers(false);
    try {
      const next = await getNextUserToRate(user.uid);
      if (!next) {
        setCurrentUser(null);
        setNoMoreUsers(true);
      } else {
        setCurrentUser(next);
      }
    } catch (err) {
      console.error("Error fetching next user:", err);
    } finally {
      setFetchingNext(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (!loading && user && profile && !profile.profileComplete) {
      router.push("/profile");
      return;
    }
    if (user && profile?.profileComplete) {
      fetchNextUser();
    }
  }, [user, profile, loading, router, fetchNextUser]);

  if (loading || (!profile && user)) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Flame className="h-8 w-8 animate-pulse text-brand" />
      </div>
    );
  }

  const handleSubmit = async (faceScore: number, overallScore: number) => {
    if (!user || !currentUser) return;
    await submitRating(user.uid, currentUser.uid, faceScore, overallScore);
    await refreshProfile();
    fetchNextUser();
  };

  const handleSkip = () => {
    fetchNextUser();
  };

  if (fetchingNext) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-muted-foreground text-sm">Scanning for the next face to PSL rate...</p>
      </div>
    );
  }

  if (noMoreUsers || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4 px-4 animate-fade-in">
        <div className="rounded-2xl bg-muted/50 p-6">
          <UserX className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold font-heading">You&apos;ve Mogged Everyone</h2>
        <p className="text-muted-foreground text-center text-sm max-w-sm">
          No more faces to judge. Touch grass and check back later for fresh moggers.
        </p>
        <Button variant="outline" onClick={fetchNextUser} className="border-border/50 hover:bg-muted/50">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <RatingCard
        photos={currentUser.photos}
        displayName={currentUser.displayName}
        onSubmit={handleSubmit}
        onSkip={handleSkip}
      />
    </div>
  );
}
