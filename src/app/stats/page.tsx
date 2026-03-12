"use client";

import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import type { RatingStats, DemographicStat } from "@/lib/types";
import { getUserStats } from "@/lib/firestore-helpers";

// [SYNTHETIC DATA] Generate fake demo stats for users with no real ratings.
// Remove this function (and the isDemo logic below) once we have enough real users.
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

export default function StatsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const { data: realData, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => getUserStats(user!.uid),
    enabled: !!user,
  });

  // [SYNTHETIC DATA] Use demo data if no real ratings exist.
  // Remove this block (and generateDemoStats, isDemo, yellow banner) once we have enough real users.
  const demoStats = useMemo(() => generateDemoStats(), []);
  const isDemo = !realData?.totalRatingsReceived || realData.totalRatingsReceived === 0;
  const data = isDemo ? demoStats : {
    ...realData,
    stats: realData.stats as unknown as RatingStats,
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Flame className="h-8 w-8 animate-pulse text-brand" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
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
