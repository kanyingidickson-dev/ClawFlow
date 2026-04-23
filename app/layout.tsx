import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: "ClawFlow — OpenClaw-Powered Micro Automation Engine",
  description:
    "A modular workflow execution engine that orchestrates deterministic skills to transform raw input into structured, actionable outputs. Powered by OpenClaw.",
  keywords: ["OpenClaw", "automation", "workflow", "engine", "ClawFlow", "skills"],
  openGraph: {
    title: "ClawFlow — Micro Automation Engine",
    description: "Orchestrate deterministic workflows with modular skills. No AI dependency required.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
