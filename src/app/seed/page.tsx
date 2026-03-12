"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { seedDatabase } from "@/lib/seed-client";
import { Loader2 } from "lucide-react";

export default function SeedPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const handleSeed = async () => {
    setRunning(true);
    setDone(false);
    setLogs([]);
    try {
      await seedDatabase((msg) => {
        setLogs((prev) => [...prev, msg]);
      });
      setDone(true);
    } catch (err) {
      setLogs((prev) => [...prev, `ERROR: ${err}`]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Seed Database</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Creates 60 synthetic user profiles with random ratings and
            demographic stats. Also backfills any real users who have 0 ratings.
          </p>
          <Button onClick={handleSeed} disabled={running}>
            {running && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {running ? "Seeding..." : done ? "Seed Again" : "Seed Database"}
          </Button>
          {logs.length > 0 && (
            <div className="bg-muted rounded p-3 text-sm font-mono space-y-1 max-h-64 overflow-auto">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
