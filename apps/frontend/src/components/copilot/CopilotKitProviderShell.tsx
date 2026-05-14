"use client";

import { useEffect, useState } from "react";
import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import { ThemeProvider } from "next-themes";
import { toast } from "sonner";
import { bootstrapRegistry } from "@/runtime/surface-registry";

export function CopilotKitProviderShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [workspaceId, setWorkspaceId] = useState<string>("")

  useEffect(() => {
    bootstrapRegistry()
    fetch("/api/me/identity")
      .then(r => r.json())
      .then((d: { workspaceId?: string }) => {
        if (d.workspaceId) setWorkspaceId(d.workspaceId)
      })
      .catch(() => {})
  }, [])

  const headers: Record<string, string> | undefined = workspaceId ? { "x-workspace-id": workspaceId } : undefined

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <CopilotKitProvider
        runtimeUrl="/api/copilotkit"
        showDevConsole={false}
        headers={headers}
        onError={(event) => {
          const msg = (event as { error?: { message?: string } })?.error?.message ?? String(event);
          const isColdStart =
            msg.includes("AGENT_COLD_START") ||
            msg.includes("warming up") ||
            msg.includes("INCOMPLETE_STREAM") ||
            msg.includes("502") ||
            msg.includes("503");
          toast.error(
            isColdStart ? "Agent warming up" : "Chat error",
            {
              description: isColdStart
                ? "Free tier cold start — wait 30 seconds and retry your message."
                : msg.slice(0, 120),
              duration: 10_000,
            },
          );
        }}
      >
        {children}
      </CopilotKitProvider>
    </ThemeProvider>
  );
}
