import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { QueryProvider } from "@/lib/query-provider";
import { Navbar } from "@/components/navbar";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mog Leaderboard - Do You Mog or Get Mogged?",
  description: "Upload your photos, get your PSL rating from real people, and find out if you're a Gigachad or an LTN. The ultimate looksmaxxing leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${plusJakarta.variable} ${inter.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <Navbar />
            <main className="min-h-screen pt-14 md:pt-16 pb-20 md:pb-4">
              {children}
            </main>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
