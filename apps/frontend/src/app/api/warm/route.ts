import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BFF_URL = process.env.BFF_URL ?? 'http://localhost:4000'

export async function GET(): Promise<Response> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 75000)
    let res: Response
    try {
      res = await fetch(`${BFF_URL}/api/warm`, { signal: ctrl.signal })
    } finally {
      clearTimeout(timer)
    }
    const data = (await res.json()) as { bff: boolean; agent: boolean; ts: number }
    return NextResponse.json(data, { status: res.ok ? 200 : 502 })
  } catch {
    return NextResponse.json({ bff: false, agent: false }, { status: 502 })
  }
}
