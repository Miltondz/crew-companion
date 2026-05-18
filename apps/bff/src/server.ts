import { Hono } from "hono";
import { serve } from "@hono/node-server";
import {
  CopilotRuntime,
  CopilotKitIntelligence,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";
import pg from "pg";
import { FullEnvelopeSchema } from "./envelope-schema.js";

const { Pool } = pg;

let _pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

const intelligence =
  process.env.INTELLIGENCE_API_URL && process.env.INTELLIGENCE_API_KEY
    ? new CopilotKitIntelligence({
        apiKey: process.env.INTELLIGENCE_API_KEY,
        apiUrl: process.env.INTELLIGENCE_API_URL,
        wsUrl: process.env.INTELLIGENCE_GATEWAY_WS_URL ?? "ws://localhost:4403",
      })
    : undefined;

function makeAgent(graphId: string): LangGraphAgent {
  return new LangGraphAgent({
    deploymentUrl: process.env.LANGGRAPH_DEPLOYMENT_URL ?? "http://localhost:8123",
    graphId,
    langsmithApiKey: process.env.LANGSMITH_API_KEY ?? "",
    assistantConfig: {
      recursion_limit: Number(process.env.LANGGRAPH_RECURSION_LIMIT ?? 60),
    },
  });
}

const agent        = makeAgent("default");
const plannerAgent = makeAgent("planner");
const coachAgent   = makeAgent("coach");

// In-memory agent health cache — avoids a ping on every warm request
let agentLastOk = 0
const AGENT_HEALTH_TTL_MS = 5 * 60 * 1000

interface OwnershipEntry { allowed: boolean; expiry: number }
const ownershipCache = new Map<string, OwnershipEntry>()
const OWNERSHIP_TTL_MS = 60_000
const OWNERSHIP_CACHE_MAX = 1000

async function checkWorkspaceOwnership(userId: string, workspaceId: string): Promise<boolean> {
  const cacheKey = `${userId}:${workspaceId}`
  const cached = ownershipCache.get(cacheKey)
  if (cached && cached.expiry > Date.now()) return cached.allowed

  let allowed = false
  if (process.env.DATABASE_URL) {
    try {
      const result = await getPool().query(
        "SELECT 1 FROM user_projects WHERE user_id = $1 AND workspace_id = $2 LIMIT 1",
        [userId, workspaceId]
      )
      allowed = (result.rowCount ?? 0) > 0
    } catch {
      // DB unavailable — fail open to avoid blocking legitimate traffic during cold start
      return true
    }
  } else {
    // No DB configured (dev without DB) — skip ownership enforcement
    return true
  }

  if (ownershipCache.size >= OWNERSHIP_CACHE_MAX) {
    const oldest = ownershipCache.keys().next().value
    if (oldest !== undefined) ownershipCache.delete(oldest)
  }
  ownershipCache.set(cacheKey, { allowed, expiry: Date.now() + OWNERSHIP_TTL_MS })
  return allowed
}

async function ensureAgentAlive(lgUrl: string): Promise<{ ok: boolean }> {
  if (Date.now() - agentLastOk < AGENT_HEALTH_TTL_MS) return { ok: true }
  try {
    const r = await fetch(`${lgUrl}/info`, { signal: AbortSignal.timeout(3000) })
    if (r.ok) { agentLastOk = Date.now(); return { ok: true } }
    console.warn(`[agent-health] ${lgUrl}/info → HTTP ${r.status}`)
    return { ok: false }
  } catch (e) {
    console.warn(`[agent-health] ${lgUrl}/info unreachable: ${(e as Error).message}`)
    return { ok: false }
  }
}

const copilotHandler = createCopilotRuntimeHandler({
  basePath: "/api/copilotkit",
  runtime: new CopilotRuntime({
    ...(intelligence ? { intelligence } : {}),
    identifyUser: (ctx: unknown) => {
      const workspaceId =
        (ctx as unknown as Request).headers?.get("x-workspace-id") ?? "default";
      return { id: workspaceId, name: `workspace:${workspaceId}` };
    },
    licenseToken: process.env.COPILOTKIT_LICENSE_TOKEN,
    agents: {
      default:    agent,
      crew_agent: agent,
      planner:    plannerAgent,
      coach:      coachAgent,
    },
    openGenerativeUI: true,
    a2ui: { injectA2UITool: false },
    ...(process.env.MCP_SERVER_URL
      ? {
          mcpApps: {
            servers: [
              {
                type: "http" as const,
                url: process.env.MCP_SERVER_URL,
                serverId: "manufact_local",
              },
            ],
          },
        }
      : {}),
  }),
  cors: true,
});

// Root app — all custom routes live here, CopilotKit is a delegate.
const app = new Hono();

// Envelope correlation logging
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
      // not a JSON tool-call body
    }
  }
  await next();
});

// Rewrite known 5xx bodies into structured payloads
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
    (body.includes("Failed to initialize thread") && body.includes("user_id"));
  if (isThreadFkey) {
    c.res = new Response(
      JSON.stringify({
        error: "Postgres user seed missing",
        hint: "Run `npm run seed` to seed the default user, then retry.",
        command: "npm run seed",
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
    return;
  }
  const isThreadLocked =
    body.includes("AgentThreadLockedError") ||
    /Thread\s+[0-9a-f-]{36}\s+is locked/i.test(body);
  if (isThreadLocked) {
    c.res = new Response(
      JSON.stringify({
        error: "Thread is locked",
        hint:
          "A previous turn errored mid-stream and didn't release the run lock. " +
          "Start a new conversation (sidebar → +) to continue.",
        command: "new-thread",
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
    return;
  }
});

app.get("/api/ping", (c) => c.json({ ok: true, ts: Date.now() }))

app.get("/api/warm", async (c) => {
  const lgUrl = process.env.LANGGRAPH_DEPLOYMENT_URL ?? "http://localhost:8123"
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  let agentOk = false
  try {
    const res = await fetch(`${lgUrl}/info`, { signal: ctrl.signal })
    agentOk = res.ok
  } catch {}
  clearTimeout(timer)
  return c.json({ bff: true, agent: agentOk, ts: Date.now() })
})

app.get("/api/health", async (c) => {
  const lgUrl = process.env.LANGGRAPH_DEPLOYMENT_URL ?? "http://localhost:8123";
  const t0 = Date.now();
  let langgraph: Record<string, unknown> = {};
  try {
    const r = await fetch(`${lgUrl}/info`, { signal: AbortSignal.timeout(5000) });
    const d = (await r.json()) as Record<string, unknown>;
    langgraph = { ok: r.ok, latencyMs: Date.now() - t0, status: r.status, data: d };
  } catch (e: unknown) {
    langgraph = { ok: false, latencyMs: Date.now() - t0, error: (e as Error).message };
  }
  const m = process.memoryUsage();
  return c.json({
    ok: true,
    timestamp: new Date().toISOString(),
    bff: {
      uptimeSeconds: Math.round(process.uptime()),
      memory: { rssBytes: m.rss, heapUsedBytes: m.heapUsed, heapTotalBytes: m.heapTotal },
      nodeVersion: process.version,
      env: {
        LANGGRAPH_DEPLOYMENT_URL: !!process.env.LANGGRAPH_DEPLOYMENT_URL,
        INTELLIGENCE_API_URL: !!process.env.INTELLIGENCE_API_URL,
        INTELLIGENCE_API_KEY: !!process.env.INTELLIGENCE_API_KEY,
        COPILOTKIT_LICENSE_TOKEN: !!process.env.COPILOTKIT_LICENSE_TOKEN,
        MCP_SERVER_URL: !!process.env.MCP_SERVER_URL,
        LANGSMITH_API_KEY: !!process.env.LANGSMITH_API_KEY,
      },
    },
    langgraph,
  });
});

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

// CopilotKit — preflight checks agent is alive, then delegates
app.all("/api/copilotkit/*", async (c) => {
  if (c.req.method === "OPTIONS") {
    return copilotHandler(c.req.raw);
  }

  const path = new URL(c.req.url).pathname;
  const isMutating = ["POST", "PATCH", "PUT"].includes(c.req.method);
  const isMessageSend = isMutating && (
    path.endsWith("/chat/completions") ||
    path.endsWith("/actions/execute") ||
    path === "/api/copilotkit"
  );

  if (isMessageSend) {
    const workspaceId = c.req.header("x-workspace-id");
    const userId = c.req.header("x-user-id");
    if (!workspaceId) {
      return c.json({ error: "Missing x-workspace-id header" }, 401);
    }
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const owned = await checkWorkspaceOwnership(userId, workspaceId);
    if (!owned) {
      return c.json({ error: "Forbidden: workspace not owned by caller" }, 403);
    }
  }

  const lgUrl = process.env.LANGGRAPH_DEPLOYMENT_URL ?? "http://localhost:8123";
  const health = await ensureAgentAlive(lgUrl);
  if (!health.ok) {
    return c.json(
      {
        error: "Agent is warming up (free tier cold start). Wait 30 seconds and retry.",
        code: "AGENT_COLD_START",
      },
      503,
    );
  }
  return copilotHandler(c.req.raw);
});

const port = Number(process.env.PORT) || 4000;

serve({ fetch: app.fetch, port }, () => {
  console.log(`BFF ready at http://localhost:${port}`);
});
