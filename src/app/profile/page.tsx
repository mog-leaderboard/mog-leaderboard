"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhotoUpload } from "@/components/photo-upload";
import {
  GENDER_OPTIONS,
  HAIR_COLOR_OPTIONS,
  RACE_OPTIONS,
  type Gender,
  type HairColor,
  type Race,
} from "@/lib/types";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Flame, Loader2, Save } from "lucide-react";

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState("");
  const [hairColor, setHairColor] = useState<HairColor>("brown");
  const [race, setRace] = useState<Race>("white");
  const [photos, setPhotos] = useState<string[]>(["", ""]);


  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setGender(profile.gender || "male");
      setAge(profile.age?.toString() || "");
      setHairColor(profile.hairColor || "brown");
      setRace(profile.race || "white");
      setPhotos(profile.photos?.length === 2 ? profile.photos : ["", ""]);
    } else if (user) {
      setDisplayName(user.displayName || "");
    }
  }, [profile, user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Flame className="h-8 w-8 animate-pulse text-brand" />
      </div>
    );
  }

  const handlePhotoUpload = (index: number, url: string) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = url;
      return next;
    });
  };

  const isValid =
    displayName.trim() &&
    gender &&
    age &&
    parseInt(age) >= 18 &&
    parseInt(age) <= 100 &&
    hairColor &&
    race &&
    photos[0] &&
    photos[1];

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          displayName: displayName.trim(),
          gender,
          age: parseInt(age),
          hairColor,
          race,
          photos,

          profileComplete: true,
          avgFaceRating: profile?.avgFaceRating || 0,
          avgOverallRating: profile?.avgOverallRating || 0,
          totalRatingsReceived: profile?.totalRatingsReceived || 0,
          points: profile?.points || 0,
          updatedAt: new Date().toISOString(),
          ...(profile ? {} : { createdAt: new Date().toISOString() }),
        },
        { merge: true }
      );
      await refreshProfile();
      router.push("/rate");
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-heading">
          {profile?.profileComplete ? "Edit Profile" : "Complete Your Profile"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {profile?.profileComplete
            ? "Update your photos and information"
            : "Upload two photos and fill in your details to start getting rated"}
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-heading">Your Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <PhotoUpload
              uid={user.uid}
              index={0}
              currentUrl={photos[0]}
              onUpload={(url) => handlePhotoUpload(0, url)}
            />
            <PhotoUpload
              uid={user.uid}
              index={1}
              currentUrl={photos[1]}
              onUpload={(url) => handlePhotoUpload(1, url)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-heading">About You</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="bg-muted/30 border-border/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                <SelectTrigger className="bg-muted/30 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={18}
                max={100}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="18-100"
                className="bg-muted/30 border-border/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hair Color</Label>
              <Select value={hairColor} onValueChange={(v) => setHairColor(v as HairColor)}>
                <SelectTrigger className="bg-muted/30 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HAIR_COLOR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Race / Ethnicity</Label>
              <Select value={race} onValueChange={(v) => setRace(v as Race)}>
                <SelectTrigger className="bg-muted/30 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RACE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {profile?.profileComplete && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading">Your Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-brand tabular-nums">
                  {profile.avgFaceRating?.toFixed(1) || "—"}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">Face</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-brand tabular-nums">
                  {profile.avgOverallRating?.toFixed(1) || "—"}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">Overall</div>
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums">
                  {profile.totalRatingsReceived || 0}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">Ratings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        className="w-full bg-brand hover:bg-brand/90 text-brand-foreground font-semibold transition-all duration-200 hover:scale-[1.005] glow-brand-sm"
        size="lg"
        disabled={!isValid || saving}
        onClick={handleSave}
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        {profile?.profileComplete ? "Save Changes" : "Complete Profile & Start Rating"}
      </Button>
    </div>
  );
}
