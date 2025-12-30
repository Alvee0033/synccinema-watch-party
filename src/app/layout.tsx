import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SyncCinema",
  description: "Watch movies in perfect sync with friends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} bg-background text-foreground antialiased min-h-screen selection:bg-white/20`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
