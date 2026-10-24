import type { Metadata } from "next";
import { Archivo, Geist, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

const display = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Setpiece Picks — AI Football DFS Picks",
    template: "%s | Setpiece Picks",
  },
  icons: {
    icon: "/LOGO.svg",
    shortcut: "/LOGO.svg",
    apple: "/LOGO.svg",
  },
  description:
    "AI-powered football player prop picks. Data-driven analysis, confidence scores, and full AI reasoning on every pick.",
  keywords: ["football picks", "DFS", "AI picks", "football props", "player props", "Premier League picks", "club football props"],
  metadataBase: new URL("https://setpiecepicks.com"),
  openGraph: {
    title: "Setpiece Picks — AI Football DFS Picks",
    description: "AI-powered football player prop picks. Edge-focused. Data-driven.",
    url: "https://setpiecepicks.com",
    siteName: "Setpiece Picks",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
