import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cookies } from 'next/headers'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

const TECH_FLOW_SCHEMA = `
{
  "id": "string (kebab-case, unique)",
  "taskLabel": "string (human-readable task name)",
  "technicalLevel": "low-tech" | "high-tech",
  "generatedBy": "coach",
  "steps": [
    {
      "id": "string (s1, s2, ...)",
      "title": "string (short action title)",
      "description": "string (plain explanation, adapt to techLevel)",
      "command": "string (optional — shell command to run)",
      "expectedOutput": "string (optional — what they should see after)",
      "errorOptions": [
        {
          "label": "string (error description option)",
          "nextStepId": "string (id of rescue step, can be a new step id)"
        }
      ]
    }
  ]
}
`

function buildPrompt(intent: string, techLevel: string, context: string): string {
  const audienceNote = techLevel === 'low-tech'
    ? 'Write for someone with zero technical background. Use plain Spanish, numbered steps, lots of encouragement. ZERO jargon.'
    : 'Write for an experienced developer. Be concise, exact, technical. Skip basic explanations.'

  return `You are the Crew Companion Coach agent. Generate a step-by-step TechFlow JSON to help a team member.

INTENT: ${intent}
TECH LEVEL: ${techLevel}
WORKSPACE CONTEXT: ${context}

AUDIENCE: ${audienceNote}

Generate 3-5 steps. Include real shell commands when applicable (use npm/npx for Node projects).
For low-tech: each step has 1 action only. Add errorOptions for the most likely failure at each step.
For high-tech: steps can be denser, include exact flags and options.
All text in Spanish.

Return ONLY valid JSON matching this schema exactly:
${TECH_FLOW_SCHEMA}

Do NOT wrap in markdown code blocks. Return raw JSON only.`
}

const INTENT_LABELS: Record<string, string> = {
  resolve_error:    'Resolver un error técnico',
  setup_env:       'Configurar el entorno',
  understand_task:  'Entender una tarea',
  team_status:     'Ver estado del equipo',
}

export async function POST(req: Request) {
  // Skip auth in dev when AUTH_SECRET is not configured
  if (process.env.AUTH_SECRET) {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 })
  }

  const body = await req.json() as {
    intent: string
    techLevel?: string
    context?: string
  }

  const intent = body.intent ?? 'resolve_error'
  const techLevel = body.techLevel ?? 'low-tech'
  const context = body.context ?? 'equipo de hackathon, proyecto web'
  const intentLabel = INTENT_LABELS[intent] ?? intent

  const prompt = buildPrompt(intentLabel, techLevel, context)

  const geminiRes = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
        maxOutputTokens: 1200,
      },
    }),
  })

  if (!geminiRes.ok) {
    const err = await geminiRes.text()
    console.error('[coach/flow] Gemini error:', err)
    return NextResponse.json({ error: 'LLM error' }, { status: 502 })
  }

  const geminiData = await geminiRes.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }

  const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  let flow: unknown
  try {
    flow = JSON.parse(rawText)
  } catch {
    console.error('[coach/flow] JSON parse failed:', rawText)
    return NextResponse.json({ error: 'Invalid flow JSON from LLM' }, { status: 502 })
  }

  return NextResponse.json({ flow })
}
