"use client";

import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, BarChart3, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { RatingStats, DemographicStat } from "@/lib/types";
import { getAgeRange } from "@/lib/types";
import { getUserStats, getUserRatingsRaw } from "@/lib/firestore-helpers";

// [SYNTHETIC DATA] Generate fake demo stats for users with no real ratings.
function generateDemoStats() {
  const rand = (lo: number, hi: number) => Math.round((lo + Math.random() * (hi - lo)) * 10) / 10;
  const makeBucket = (count: number) => ({
    count,
    avgFace: rand(4, 8.5),
    avgOverall: rand(4, 8.5),
  });
  return {
    stats: {
      byGender: { male: makeBucket(12), female: makeBucket(18) },
      byHairColor: {
        blonde: makeBucket(8),
        brown: makeBucket(10),
        black: makeBucket(6),
        red: makeBucket(3),
      },
      byRace: {
        white: makeBucket(11),
        asian: makeBucket(7),
        hispanic: makeBucket(5),
        black: makeBucket(4),
        middle_eastern: makeBucket(3),
      },
      byAgeRange: {
        "18-24": makeBucket(14),
        "25-30": makeBucket(9),
        "31-40": makeBucket(5),
        "41-50": makeBucket(2),
      },
    } as RatingStats,
    avgFaceRating: rand(5, 8),
    avgOverallRating: rand(5, 8),
    totalRatingsReceived: 30,
  };
}

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const COLORS = ["#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];

function DemographicChart({
  title,
  data,
  metric = "avgOverall",
}: {
  title: string;
  data: Record<string, DemographicStat>;
  metric?: "avgOverall" | "avgFace";
}) {
  const chartData = Object.entries(data)
    .map(([key, stat]) => ({
      name: key.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: metric === "avgOverall" ? stat.avgOverall : stat.avgFace,
      count: stat.count,
    }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-heading">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-heading">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 70 }}>
            <XAxis type="number" domain={[0, 10]} stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis type="category" dataKey="name" width={65} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
            <Tooltip
              formatter={(value) => [Number(value).toFixed(1), "Avg Rating"]}
              labelFormatter={(label) => {
                const item = chartData.find((d) => d.name === label);
                return `${label} (${item?.count || 0} ratings)`;
              }}
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function AttractivenessRadar({ data }: { data: Record<string, DemographicStat> }) {
  const chartData = Object.entries(data)
    .map(([key, stat]) => ({
      race: key.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      overall: stat.avgOverall,
      face: stat.avgFace,
      count: stat.count,
    }))
    .filter((d) => d.count > 0);

  if (chartData.length < 2) {
    return null;
  }

  return (
    <Card className="border-border/50 card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-heading">Attractiveness by Phenotype</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="race"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <PolarRadiusAxis
              domain={[0, 10]}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
            />
            <Radar
              name="Overall"
              dataKey="overall"
              stroke="#f97316"
              fill="#f97316"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Radar
              name="Face"
              dataKey="face"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                fontSize: "12px",
              }}
              formatter={(value) => [Number(value).toFixed(1), "Rating"]}
              labelFormatter={(label) => {
                const item = chartData.find((d) => d.race === label);
                return `${label} (${item?.count || 0} raters)`;
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#f97316] rounded" />
            <span className="text-[11px] text-muted-foreground">Overall</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#3b82f6] rounded" />
            <span className="text-[11px] text-muted-foreground">Face</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type RawRating = {
  faceScore: number;
  overallScore: number;
  raterGender: string;
  raterAge: number;
  raterHairColor: string;
  raterRace: string;
};

function computeFilteredStats(ratings: RawRating[], minScore: number) {
  const filtered = ratings.filter(
    (r) => r.faceScore >= minScore && r.overallScore >= minScore
  );

  if (filtered.length === 0) {
    return {
      stats: { byGender: {}, byHairColor: {}, byRace: {}, byAgeRange: {} } as RatingStats,
      avgFaceRating: 0,
      avgOverallRating: 0,
      totalRatingsReceived: 0,
    };
  }

  let totalFace = 0;
  let totalOverall = 0;
  const buckets: Record<string, Record<string, { count: number; totalFace: number; totalOverall: number }>> = {
    byGender: {},
    byHairColor: {},
    byRace: {},
    byAgeRange: {},
  };

  for (const r of filtered) {
    totalFace += r.faceScore;
    totalOverall += r.overallScore;

    const addTo = (category: string, key: string) => {
      if (!key) return;
      if (!buckets[category][key]) buckets[category][key] = { count: 0, totalFace: 0, totalOverall: 0 };
      buckets[category][key].count += 1;
      buckets[category][key].totalFace += r.faceScore;
      buckets[category][key].totalOverall += r.overallScore;
    };

    addTo("byGender", r.raterGender);
    addTo("byHairColor", r.raterHairColor);
    addTo("byRace", r.raterRace);
    addTo("byAgeRange", getAgeRange(r.raterAge));
  }

  const toStats = (bucket: Record<string, { count: number; totalFace: number; totalOverall: number }>) => {
    const result: Record<string, DemographicStat> = {};
    for (const [key, val] of Object.entries(bucket)) {
      result[key] = {
        count: val.count,
        avgFace: val.totalFace / val.count,
        avgOverall: val.totalOverall / val.count,
      };
    }
    return result;
  };

  return {
    stats: {
      byGender: toStats(buckets.byGender),
      byHairColor: toStats(buckets.byHairColor),
      byRace: toStats(buckets.byRace),
      byAgeRange: toStats(buckets.byAgeRange),
    } as RatingStats,
    avgFaceRating: totalFace / filtered.length,
    avgOverallRating: totalOverall / filtered.length,
    totalRatingsReceived: filtered.length,
  };
}

export default function StatsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [filterNoise, setFilterNoise] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const { data: realData, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => getUserStats(user!.uid),
    enabled: !!user,
  });

  const { data: rawRatings } = useQuery({
    queryKey: ["stats-raw"],
    queryFn: () => getUserRatingsRaw(user!.uid),
    enabled: !!user,
  });

  // [SYNTHETIC DATA] Use demo data if no real ratings exist.
  const demoStats = useMemo(() => generateDemoStats(), []);
  const isDemo = !realData?.totalRatingsReceived || realData.totalRatingsReceived === 0;

  const data = useMemo(() => {
    if (isDemo) return demoStats;
    if (filterNoise && rawRatings) {
      return computeFilteredStats(rawRatings, 1.5);
    }
    return {
      ...realData,
      stats: realData!.stats as unknown as RatingStats,
    };
  }, [isDemo, demoStats, filterNoise, rawRatings, realData]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Flame className="h-8 w-8 animate-pulse text-brand" />
      </div>
    );
  }

  const removedCount = filterNoise && rawRatings
    ? rawRatings.length - (data?.totalRatingsReceived || 0)
    : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 font-heading">
            <div className="relative">
              <BarChart3 className="h-6 w-6 text-blue-500" />
              <div className="absolute inset-0 blur-md bg-blue-500/30 -z-10" />
            </div>
            Your Mog Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detailed halo effect breakdown — see who rates your bone structure highest
          </p>
        </div>
      </div>

      {/* Filter toggle */}
      <button
        onClick={() => setFilterNoise(!filterNoise)}
        className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-all ${
          filterNoise
            ? "border-brand/30 bg-brand/10 text-brand"
            : "border-border/50 text-muted-foreground hover:border-border"
        }`}
      >
        <Filter className="h-3.5 w-3.5" />
        {filterNoise ? "Noise filtered" : "Filter noise ratings"}
        {filterNoise && removedCount > 0 && (
          <span className="text-[10px] bg-brand/20 px-1.5 py-0.5 rounded-full tabular-nums">
            -{removedCount}
          </span>
        )}
      </button>

      {isDemo && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-sm text-yellow-600 dark:text-yellow-400">
          Demo data shown — real analytics will appear once you receive ratings.
        </div>
      )}

      {/* Overall scores */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center p-5 border-border/50 card-hover">
          <div className="text-3xl font-bold text-brand tabular-nums">
            {data?.avgFaceRating?.toFixed(1) || "—"}
          </div>
          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">Face PSL</div>
        </Card>
        <Card className="text-center p-5 border-border/50 card-hover">
          <div className="text-3xl font-bold text-brand tabular-nums">
            {data?.avgOverallRating?.toFixed(1) || "—"}
          </div>
          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">Overall Mog</div>
        </Card>
        <Card className="text-center p-5 border-border/50 card-hover">
          <div className="text-3xl font-bold tabular-nums">
            {data?.totalRatingsReceived || 0}
          </div>
          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">Total Ratings</div>
        </Card>
      </div>

      {/* Radar chart */}
      <AttractivenessRadar data={data?.stats.byRace || {}} />

      <div className="space-y-4">
        <DemographicChart
          title="Mog Rating by Gender"
          data={data?.stats.byGender || {}}
        />
        <DemographicChart
          title="Mog Rating by Hair Color"
          data={data?.stats.byHairColor || {}}
        />
        <DemographicChart
          title="Mog Rating by Phenotype"
          data={data?.stats.byRace || {}}
        />
        <DemographicChart
          title="Mog Rating by Age Range"
          data={data?.stats.byAgeRange || {}}
        />
      </div>
    </div>
  );
}
