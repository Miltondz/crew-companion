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
          // "Cannot read properties of undefined (reading 'name')" is CopilotKit
          // crashing in onRunErrorEvent when it receives a non-SSE error response
          // (our 503 AGENT_COLD_START or a raw 502 from LangGraph). Any stream
          // error that reaches this handler means the agent or BFF is down.
          const isAgentDown =
            msg.includes("AGENT_COLD_START") ||
            msg.includes("INCOMPLETE_STREAM") ||
            msg.includes("Cannot read properties") ||
            msg.includes("Failed to retrieve assistant") ||
            msg.includes("502") ||
            msg.includes("503");
          toast.error(
            isAgentDown ? "Agent temporarily unavailable" : "Chat error",
            {
              description: isAgentDown
                ? "The agent is warming up (free tier cold start). Wait 30 seconds and retry."
                : msg.slice(0, 120),
              duration: 12_000,
            },
          );
        }}
      >
        {children}
      </CopilotKitProvider>
    </ThemeProvider>
  );
}
