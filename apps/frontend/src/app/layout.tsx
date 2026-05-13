import type { Metadata } from "next";

import { Plus_Jakarta_Sans, Spline_Sans_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { CopilotKitProviderShell } from "@/components/copilot/CopilotKitProviderShell";
import { Toaster } from "sonner";
import "./globals.css";
// v2 owns its own stylesheet. Do NOT import @copilotkit/react-ui/styles.css —
// v1's .copilotKitButton / .copilotKitSidebar / .copilotKitWindow rules
// collide with v2's same-name selectors (different DOM, different positioning)
// and break the sidebar layout when both are loaded.
import "@copilotkit/react-core/v2/styles.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Crew Companion — AI Team Dashboard",
  description: "Intelligent crew management: tasks, milestones, blockers, and AI assistance for every team member.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${splineMono.variable}`} suppressHydrationWarning>
      <body className={`${jakarta.variable} ${splineMono.variable} subpixel-antialiased`}>
        <div className="fixed top-0 inset-x-0 z-[9999] flex items-center justify-center gap-2 bg-amber-400 px-4 py-1 text-xs font-semibold text-amber-950">
          <span>🧪</span>
          <span>Demo — datos simulados. Equipo real y despliegue completo: próximamente.</span>
        </div>
        <div className="pt-6">
          <SessionProvider>
            <CopilotKitProviderShell>{children}</CopilotKitProviderShell>
          </SessionProvider>
        </div>
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
