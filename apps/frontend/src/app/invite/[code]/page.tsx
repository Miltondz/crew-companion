'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { UserPlus, Sparkles, Users, ArrowRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'

const PROJECT_TYPE_EMOJI: Record<string, string> = {
  hackathon: '🏆', sprint: '💻', 'remote-team': '🌍', launch: '🚀', consulting: '🤝', other: '⚙️',
}

interface UnclaimedMember {
  id: string
  name: string
  role: string
}

interface ProjectInfo {
  projectName: string
  memberCount: number
  projectType: string
  unclaimedMembers: UnclaimedMember[]
}

export default function InvitePage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [project, setProject] = useState<ProjectInfo | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/invite/${code}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: ProjectInfo) => {
        setProject(d)
        if (d.unclaimedMembers?.length === 1) setSelectedMemberId(d.unclaimedMembers[0].id)
      })
      .catch(() => setNotFound(true))
  }, [code])

  const handleJoin = async () => {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/invite/${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: selectedMemberId || undefined }),
    })
    if (res.status === 401) {
      router.push(`/auth/signin?callbackUrl=/invite/${code}`)
      return
    }
    if (res.status === 409) { setError('Ese perfil ya fue reclamado por otro usuario.'); setLoading(false); return }
    if (!res.ok) { setError('Error al unirse. Intentá de nuevo.'); setLoading(false); return }
    const { workspaceId, memberId } = await res.json() as { workspaceId: string; memberId: string | null }
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId }),
    })
    if (memberId) {
      router.push(`/member/${memberId}`)
    } else {
      router.push('/leader')
    }
  }

  if (notFound) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
      Link inválido o expirado.
    </div>
  )

  const hasUnclaimedSlots = (project?.unclaimedMembers?.length ?? 0) > 0
  const canJoin = !hasUnclaimedSlots || selectedMemberId !== ''

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">Crew Companion</span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center">
          {!project ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <span className="text-5xl">{PROJECT_TYPE_EMOJI[project.projectType] ?? '⚙️'}</span>
              <h1 className="text-xl font-bold text-white mt-4 mb-1">{project.projectName}</h1>
              <div className="flex items-center justify-center gap-1.5 text-zinc-500 text-sm mb-6">
                <Users className="w-3.5 h-3.5" />
                {project.memberCount} miembro{project.memberCount !== 1 ? 's' : ''} en el equipo
              </div>

              {hasUnclaimedSlots ? (
                <div className="text-left mb-6">
                  <p className="text-sm text-zinc-400 mb-3 text-center">
                    ¿Cuál es tu perfil en el equipo?
                  </p>
                  <div className="relative">
                    <select
                      value={selectedMemberId}
                      onChange={e => setSelectedMemberId(e.target.value)}
                      className="w-full appearance-none bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="">— Seleccioná tu perfil —</option>
                      {project.unclaimedMembers.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}{m.role && m.role !== 'member' ? ` (${m.role})` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                  <p className="text-xs text-zinc-600 mt-2 text-center">
                    El líder te agregó al equipo con un nombre. Seleccioná el tuyo.
                  </p>
                </div>
              ) : (
                <p className="text-zinc-400 text-sm mb-6">
                  Fuiste invitado a unirte a este proyecto como <strong className="text-white">miembro</strong>.
                </p>
              )}

              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

              <button onClick={handleJoin} disabled={loading || !canJoin}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-colors">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><UserPlus className="w-4 h-4" /> Unirse al proyecto</>
                )}
              </button>

              <p className="text-xs text-zinc-600 mt-4">
                Al unirte aceptás los términos del proyecto.{' '}
                <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  Ver landing <ArrowRight className="inline w-3 h-3" />
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
