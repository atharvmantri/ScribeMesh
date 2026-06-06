import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ScribeMesh — AI-Powered Hardware Documentation",
  description:
    "Turn any hardware video into interactive AI documentation in 60 seconds. Powered by Gemini 2.5 Flash.",
  keywords: [
    "hardware documentation",
    "AI",
    "Gemini",
    "video analysis",
    "technical documentation",
    "motherboard",
    "PCB",
  ],
  openGraph: {
    title: "ScribeMesh — AI-Powered Hardware Documentation",
    description:
      "Turn any hardware video into interactive AI documentation in 60 seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
