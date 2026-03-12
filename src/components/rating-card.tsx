"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { SkipForward, Send, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface RatingCardProps {
  photos: string[];
  displayName: string;
  onSubmit: (faceScore: number, overallScore: number) => Promise<void>;
  onSkip: () => void;
}

export function RatingCard({ photos, displayName, onSubmit, onSkip }: RatingCardProps) {
  const [faceScore, setFaceScore] = useState(5);
  const [overallScore, setOverallScore] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(faceScore, overallScore);
      setFaceScore(5);
      setOverallScore(5);
      setActivePhoto(0);
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 6) return "text-yellow-500";
    if (score >= 4) return "text-orange-500";
    return "text-red-500";
  };

  const getPslTier = (score: number) => {
    if (score >= 9) return { label: "Mogger", color: "text-green-400" };
    if (score >= 8) return { label: "Gigachad", color: "text-green-500" };
    if (score >= 6.5) return { label: "Chad", color: "text-emerald-500" };
    if (score >= 5.5) return { label: "Chadlite", color: "text-yellow-500" };
    if (score >= 4.5) return { label: "HTN", color: "text-orange-400" };
    if (score >= 3.5) return { label: "MTN", color: "text-orange-500" };
    if (score >= 2) return { label: "LTN", color: "text-red-400" };
    return { label: "Sub-5", color: "text-red-500" };
  };

  return (
    <Card className="w-full max-w-lg mx-auto overflow-hidden">
      {/* Photos */}
      <div className="relative">
        {/* Desktop: side by side */}
        <div className="hidden md:grid grid-cols-2">
          {photos.map((photo, i) => (
            <div key={i} className="relative aspect-[3/4]">
              <Image
                src={photo}
                alt={`${displayName} photo ${i + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Mobile: swipeable */}
        <div className="md:hidden relative aspect-[3/4]">
          <Image
            src={photos[activePhoto]}
            alt={`${displayName} photo ${activePhoto + 1}`}
            fill
            className="object-cover"
          />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {photos.map((_, i) => (
              <button
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  i === activePhoto ? "bg-white" : "bg-white/50"
                )}
                onClick={() => setActivePhoto(i)}
              />
            ))}
          </div>
          {/* Tap areas for mobile photo switching */}
          <button
            className="absolute inset-y-0 left-0 w-1/2"
            onClick={() => setActivePhoto(0)}
          />
          <button
            className="absolute inset-y-0 right-0 w-1/2"
            onClick={() => setActivePhoto(1)}
          />
        </div>

        <Badge className="absolute top-3 left-3 bg-black/50 text-white border-none">
          {displayName}
        </Badge>
      </div>

      <CardContent className="p-6 space-y-5">
        {/* Face Rating */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Face</span>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs font-medium", getPslTier(faceScore).color)}>
                {getPslTier(faceScore).label}
              </span>
              <span className={cn("text-2xl font-bold", getScoreColor(faceScore))}>
                {faceScore.toFixed(1)}
              </span>
            </div>
          </div>
          <Slider
            value={[faceScore]}
            onValueChange={(v) => setFaceScore(Array.isArray(v) ? v[0] : v)}
            min={0}
            max={10}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* Overall Rating */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Mog Factor</span>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs font-medium", getPslTier(overallScore).color)}>
                {getPslTier(overallScore).label}
              </span>
              <span className={cn("text-2xl font-bold", getScoreColor(overallScore))}>
                {overallScore.toFixed(1)}
              </span>
            </div>
          </div>
          <Slider
            value={[overallScore]}
            onValueChange={(v) => setOverallScore(Array.isArray(v) ? v[0] : v)}
            min={0}
            max={10}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* AI Analysis teaser */}
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            AI-powered hunter eyes, jawline &amp; canthal tilt analysis coming soon
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onSkip} disabled={submitting}>
            <SkipForward className="h-4 w-4 mr-2" />
            Skip
          </Button>
          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Mog +10pts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
