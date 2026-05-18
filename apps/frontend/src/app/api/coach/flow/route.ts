import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'

const TECH_FLOW_SCHEMA = `
{
  "id": "string (kebab-case, unique)",
  "taskLabel": "string (human-readable task name)",
  "technicalLevel": "low-tech" | "high-tech",
  "generatedBy": "coach",
  "steps": [
    {
      "id": "string — use s1, s2, s3... for MAIN steps only. Rescue steps use r1, r2... and appear at the END of the array.",
      "title": "string (short action title)",
      "description": "string (plain explanation, adapt to techLevel)",
      "command": "string (optional — real shell command)",
      "expectedOutput": "string (optional — what success looks like)",
      "errorOptions": [
        {
          "label": "string — ONE short error scenario the user might hit",
          "nextStepId": "string — id of a rescue step (r1, r2...) that appears later in the steps array"
        }
      ]
    }
  ]
}

IMPORTANT RULES:
- steps array = 3 to 5 MAIN steps (s1..s5) + optionally 1-2 rescue steps (r1, r2) at the end
- NEVER put rescue/error-recovery actions as main steps
- errorOptions inside a step point to rescue steps, not to other main steps
- Total steps array length: 3 to 7 items maximum
`

function buildPrompt(intent: string, techLevel: string, context: string, intentNote?: string): string {
  const audienceNote = techLevel === 'low-tech'
    ? 'Write for someone with zero technical background. Use plain Spanish, numbered steps, lots of encouragement. ZERO jargon.'
    : 'Write for an experienced developer. Be concise, exact, technical. Skip basic explanations.'

  return `You are the Crew Companion Coach agent helping a hackathon team member navigate their PROJECT WORK — tasks, blockers, and team collaboration. You are NOT an infrastructure or DevOps assistant.

CONTEXT FRAMING: All questions, steps, and guidance must be about what team members are working on: their assigned tasks, pending items, active blockers, progress on features, and coordination with teammates. Never about server health, deployments, or running application status unless the intent is explicitly a dev environment setup.

INTENT: ${intent}
TECH LEVEL: ${techLevel}
TEAM WORKSPACE STATE: ${context}
${intentNote ? `INTENT-SPECIFIC RULE: ${intentNote}` : ''}

AUDIENCE: ${audienceNote}

Generate EXACTLY 3 to 5 steps — never more than 5. Include real shell commands when applicable (use npm/npx for Node projects).
For low-tech: each step has 1 action only. Add errorOptions for the most likely failure at each step.
For high-tech: steps can be denser, include exact flags and options.
All text in Spanish.

Return ONLY valid JSON matching this schema exactly:
${TECH_FLOW_SCHEMA}

Do NOT wrap in markdown code blocks. Return raw JSON only.`
}

const INTENT_LABELS: Record<string, string> = {
  resolve_error:    'Resolver un error técnico en el código o la terminal',
  setup_env:       'Configurar el entorno de desarrollo local',
  understand_task:  'Entender y desglosar una tarea del proyecto',
  team_status:     'Revisar el avance del equipo en el tablero web del proyecto: ver tareas completadas, pendientes y blockers activos',
}

const INTENT_NOTES: Record<string, string> = {
  team_status: 'This is a VISUAL dashboard review — do NOT generate any shell commands or CLI tools. Steps describe what to look at in the web UI: task list, blocker panel, team member cards. No commands field on any step.',
  understand_task: 'Focus on breaking down the task into sub-items. Shell commands only if the task involves running code.',
}

const errorOptionSchema = z.object({
  label: z.string(),
  nextStepId: z.string(),
})

const flowStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  command: z.string().optional(),
  expectedOutput: z.string().optional(),
  errorOptions: z.array(errorOptionSchema).optional(),
})

const flowResponseSchema = z.object({
  id: z.string(),
  taskLabel: z.string(),
  technicalLevel: z.enum(['low-tech', 'high-tech']),
  generatedBy: z.string(),
  steps: z.array(flowStepSchema).min(3).max(7),
})

type FlowResponse = z.infer<typeof flowResponseSchema>

function parseAndValidate(rawText: string): FlowResponse {
  const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  const parsed = JSON.parse(cleaned) as unknown
  return flowResponseSchema.parse(parsed)
}

// In-memory rate limiter: 10 requests / 60s per identifier.
// Single-instance only — multi-instance deployments should replace with Upstash Redis.
const _rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW = 60_000

function checkRateLimit(id: string): boolean {
  const now = Date.now()
  const entry = _rateMap.get(id)
  if (!entry || entry.resetAt < now) {
    _rateMap.set(id, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(req: Request) {
  // Skip auth in dev when AUTH_SECRET is not configured
  let userId: string | undefined
  if (process.env.AUTH_SECRET) {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = session.user.id
  }

  const apiKey = process.env.GEMINI_API_KEY ?? ''
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 })
  }

  const rateLimitId = userId ?? req.headers.get('x-forwarded-for') ?? 'anon'
  if (!checkRateLimit(rateLimitId)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: { intent?: string; techLevel?: string; context?: string }
  try {
    body = await req.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Whitelist intent and techLevel — never pass raw user input into the prompt
  const intent = Object.hasOwn(INTENT_LABELS, body.intent ?? '') ? (body.intent as string) : 'resolve_error'
  const techLevel = body.techLevel === 'high-tech' ? 'high-tech' : 'low-tech'
  // Truncate context to prevent prompt injection via large payloads
  const context = (body.context ?? 'equipo de hackathon, proyecto web').slice(0, 2_000)

  const intentLabel = INTENT_LABELS[intent]
  const intentNote = INTENT_NOTES[intent]
  const prompt = buildPrompt(intentLabel, techLevel, context, intentNote)

  const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite'
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  async function callGemini(activePrompt: string): Promise<string> {
    const res = await fetch(geminiUrl, {
      method: 'POST',
      signal: AbortSignal.timeout(25_000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: activePrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: 1200,
        },
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[coach/flow] Gemini error:', err)
      throw new Error(`Gemini ${res.status}`)
    }
    const data = await res.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  }

  const retryPrompt = `Tu respuesta anterior falló la validación JSON. Devuelve ÚNICAMENTE JSON puro sin bloques de markdown, sin comentarios.\n\n${prompt}`

  let attempts = 0
  let lastError: unknown = null
  while (attempts < 2) {
    attempts++
    try {
      const rawText = await callGemini(attempts === 2 ? retryPrompt : prompt)
      try {
        const flow = parseAndValidate(rawText)
        return NextResponse.json({ flow })
      } catch (err) {
        lastError = err
        console.error('[coach/flow] parse/validate failed attempt', attempts, err, 'raw:', rawText.slice(0, 500))
      }
    } catch (err) {
      lastError = err
      console.error('[coach/flow] network/LLM error attempt', attempts, String(err).slice(0, 200))
    }
  }
  return NextResponse.json({ error: 'Invalid flow JSON from LLM', details: String(lastError) }, { status: 502 })
}
