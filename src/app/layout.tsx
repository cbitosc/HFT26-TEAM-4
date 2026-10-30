import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ResuArchitect AI — Tailored Resume Architect & Interactive Editor",
  description:
    "AI-Powered Tailored Resume Architect with real-time deterministic JD match scoring, keyword gap analyzer, visual A4 canvas, and dual ATS exports (PDF & DOCX).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-screen antialiased bg-slate-950 text-slate-100`}>
        {children}
      </body>
    </html>
  );
}
