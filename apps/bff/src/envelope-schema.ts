import { z } from "zod";

export const RuntimeContextSchema = z.object({
  role: z.string(),
  techLevel: z.string().optional(),
  phase: z.string(),
  hasActiveBlocker: z.boolean(),
  workspaceId: z.string(),
});

export const FullEnvelopeSchema = z.object({
  envelopeId: z.string(),
  agentId: z.string(),
  emittedAt: z.number(),
  intent: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  surfaceId: z.string(),
  payload: z.record(z.unknown()),
  context: RuntimeContextSchema,
  requiredCapabilities: z.array(z.string()),
  hibernatable: z.boolean(),
  pinnable: z.boolean(),
  ephemeral: z.number().optional(),
});

export type FullEnvelope = z.infer<typeof FullEnvelopeSchema>;
