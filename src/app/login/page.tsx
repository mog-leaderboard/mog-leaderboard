"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [greeting, setGreeting] = useState("Welcome Back");

  useEffect(() => {
    const lastGender = localStorage.getItem("lastGender");
    setGreeting(lastGender === "female" ? "Welcome Back, Queen" : "Welcome Back, King");
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push("/rate");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Flame className="h-8 w-8 animate-pulse text-brand" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md glass border-border/50 animate-slide-up">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="flex justify-center">
            <div className="relative">
              <div className="rounded-2xl bg-brand/10 p-4 border border-brand/20">
                <Flame className="h-10 w-10 text-brand" />
              </div>
              <div className="absolute inset-0 blur-2xl bg-brand/20 -z-10 rounded-full" />
            </div>
          </div>
          <CardTitle className="text-2xl font-heading">{greeting}</CardTitle>
          <CardDescription>Sign in to continue mogging and getting PSL rated</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Button
            className="w-full bg-brand hover:bg-brand/90 text-brand-foreground font-medium transition-all duration-200 hover:scale-[1.01] glow-brand-sm"
            size="lg"
            onClick={signInWithGoogle}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
