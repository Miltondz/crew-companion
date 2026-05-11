import { serve } from "@hono/node-server";
import {
  CopilotRuntime,
  CopilotKitIntelligence,
  createCopilotEndpoint,
} from "@copilotkit/runtime/v2";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";
import { FullEnvelopeSchema } from "./envelope-schema.js";

const intelligence = new CopilotKitIntelligence({
  apiKey:
    process.env.INTELLIGENCE_API_KEY ?? "cpk_sPRVSEED_seed0privat0longtoken00",
  apiUrl: process.env.INTELLIGENCE_API_URL ?? "http://localhost:4203",
  wsUrl: process.env.INTELLIGENCE_GATEWAY_WS_URL ?? "ws://localhost:4403",
});

const agent = new LangGraphAgent({
  deploymentUrl:
    process.env.LANGGRAPH_DEPLOYMENT_URL ?? "http://localhost:8123",
  graphId: "default",
  langsmithApiKey: process.env.LANGSMITH_API_KEY ?? "",
  assistantConfig: {
    recursion_limit: Number(process.env.LANGGRAPH_RECURSION_LIMIT ?? 60),
  },
});

const app = createCopilotEndpoint({
  basePath: "/api/copilotkit",
  runtime: new CopilotRuntime({
    intelligence,
    identifyUser: (ctx) => {
      // Middleware injects x-workspace-id from the NextAuth session.
      // Falls back to 'default' during local dev without auth.
      const workspaceId =
        (ctx as unknown as Request).headers?.get("x-workspace-id") ?? "default";
      return { id: workspaceId, name: `workspace:${workspaceId}` };
    },
    licenseToken: process.env.COPILOTKIT_LICENSE_TOKEN,
    agents: { default: agent, crew_agent: agent },
    openGenerativeUI: true,
    a2ui: { injectA2UITool: false },
    mcpApps: {
      servers: [
        {
          type: "http",
          url: process.env.MCP_SERVER_URL || "http://localhost:3001/mcp",
          serverId: "manufact_local",
        },
      ],
    },
  }),
});

// Envelope correlation logging — validate on /api/copilotkit, never block.
app.use("/api/copilotkit/*", async (c, next) => {
  const ctype = c.req.header("content-type") ?? "";
  if (ctype.includes("application/json")) {
    try {
      const cloned = c.req.raw.clone();
      const body = (await cloned.json()) as Record<string, unknown>;
      const messages = Array.isArray(body["messages"])
        ? (body["messages"] as Record<string, unknown>[])
        : [];
      const toolCalls = messages.flatMap((m) =>
        Array.isArray(m["tool_calls"])
          ? (m["tool_calls"] as Record<string, unknown>[])
          : []
      );
      for (const call of toolCalls) {
        const fn = call["function"] as Record<string, unknown> | undefined;
        const rawArgs =
          fn && typeof fn["arguments"] === "string"
            ? (JSON.parse(fn["arguments"]) as Record<string, unknown>)
            : (call["args"] as Record<string, unknown> | undefined);
        const envelope = rawArgs?.["envelope"];
        if (envelope) {
          const result = FullEnvelopeSchema.safeParse(envelope);
          if (result.success) {
            const { envelopeId, agentId, intent, surfaceId } = result.data;
            console.log(
              `[envelope] ${envelopeId} agent=${agentId} intent=${intent} surfaceId=${surfaceId}`
            );
          } else {
            console.warn(
              "[envelope] validation failed — passing through for legacy adapter",
              result.error.issues
            );
          }
        }
      }
    } catch {
      // Body parse failure — not a JSON tool call body, skip
    }
  }
  await next();
});

// Rewrite known 5xx error bodies into structured { error, hint, command } payloads.
app.use("*", async (c, next) => {
  await next();
  const status = c.res.status;
  if (status < 500 || status > 599) return;
  const cloned = c.res.clone();
  const ctype = cloned.headers.get("content-type") || "";
  if (!ctype.includes("json") && !ctype.includes("text")) return;
  let body: string;
  try {
    body = await cloned.text();
  } catch {
    return;
  }
  const isThreadFkey =
    body.includes("threads_user_id_fkey") ||
    (body.includes("Failed to initialize thread") &&
      body.includes("user_id"));
  if (isThreadFkey) {
    const remapped = {
      error: "Postgres user seed missing",
      hint: "Run `npm run seed` to seed the default user, then retry.",
      command: "npm run seed",
    };
    c.res = new Response(JSON.stringify(remapped), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
    return;
  }

  const isThreadLocked =
    body.includes("AgentThreadLockedError") ||
    /Thread\s+[0-9a-f-]{36}\s+is locked/i.test(body);
  if (isThreadLocked) {
    const remapped = {
      error: "Thread is locked",
      hint:
        "A previous turn errored mid-stream and didn't release the run " +
        "lock. Start a new conversation (sidebar → +) to continue.",
      command: "new-thread",
    };
    c.res = new Response(JSON.stringify(remapped), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
    return;
  }
});

// Approval stubs — replace body with graph.invoke(Command(resume={...})) on thread_id post-auth.
app.post("/api/approvals/:envelopeId/approve", async (c) => {
  const { envelopeId } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  console.log(`[approvals] approve envelopeId=${envelopeId} token=${body.approval_token ?? "?"}`);
  return c.json({ ok: true, envelopeId, decision: "approved" });
});

app.post("/api/approvals/:envelopeId/reject", async (c) => {
  const { envelopeId } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  console.log(`[approvals] reject envelopeId=${envelopeId}`, body);
  return c.json({ ok: true, envelopeId, decision: "rejected" });
});

const port = Number(process.env.PORT) || 4000;

serve({ fetch: app.fetch, port }, () => {
  console.log(`BFF ready at http://localhost:${port}`);
});
