import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Magneticx",
  description: "License Management Portal",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const builder = await prisma.builder.findFirst({
    include: { settings: true }
  });

  const themeStr = builder?.settings?.theme || "light:#5a56d6";
  const [mode, color] = themeStr.split(":");

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${mode === "dark" ? "dark" : ""}`}
    >
      <head>
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --primary: ${color || '#5a56d6'};
          }
        `}} />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
