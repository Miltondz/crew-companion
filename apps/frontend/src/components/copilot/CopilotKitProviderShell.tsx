"use client";

import { useEffect, useState } from "react";
import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import { ThemeProvider } from "next-themes";
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
      >
        {children}
      </CopilotKitProvider>
    </ThemeProvider>
  );
}
