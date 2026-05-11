"use client";

import { useEffect } from "react";
import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import { ThemeProvider } from "next-themes";
import { bootstrapRegistry } from "@/runtime/surface-registry";

export function CopilotKitProviderShell({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    bootstrapRegistry()
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <CopilotKitProvider
        runtimeUrl="/api/copilotkit"
        showDevConsole={false}
      >
        {children}
      </CopilotKitProvider>
    </ThemeProvider>
  );
}
