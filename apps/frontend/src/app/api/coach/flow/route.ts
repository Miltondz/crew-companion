import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cookies } from 'next/headers'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ''
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

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
  const intentNote = INTENT_NOTES[intent]

  const prompt = buildPrompt(intentLabel, techLevel, context, intentNote)

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
