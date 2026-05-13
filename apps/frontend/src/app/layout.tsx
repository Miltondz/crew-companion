import type { Metadata } from "next";

import { Plus_Jakarta_Sans, Spline_Sans_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { CopilotKitProviderShell } from "@/components/copilot/CopilotKitProviderShell";
import { LocaleProvider } from "@/lib/i18n";
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
  openGraph: {
    title: "Crew Companion — AI Team Dashboard",
    description: "A runtime where three specialized agents build the interface based on who you are, how technical you are, and how urgent things are.",
    url: "https://crew-companion.vercel.app",
    siteName: "Crew Companion",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Crew Companion — AI Team Dashboard",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crew Companion — AI Team Dashboard",
    description: "A runtime where three specialized agents build the interface based on who you are, how technical you are, and how urgent things are.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development'
  return (
    <html lang="es" className={`${jakarta.variable} ${splineMono.variable}`} suppressHydrationWarning>
      <body className={`${jakarta.variable} ${splineMono.variable} subpixel-antialiased`}>
        {isDev && (
          <div className="fixed top-0 inset-x-0 z-[9999] flex items-center justify-center gap-2 bg-amber-400 px-4 py-1 text-xs font-semibold text-amber-950">
            <span>Demo — datos simulados</span>
          </div>
        )}
        <div className={isDev ? 'pt-6' : ''}>
          <LocaleProvider>
            <SessionProvider>
              <CopilotKitProviderShell>{children}</CopilotKitProviderShell>
            </SessionProvider>
          </LocaleProvider>
        </div>
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
