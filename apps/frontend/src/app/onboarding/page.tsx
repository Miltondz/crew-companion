'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Member = { name: string; role: string; technicalLevel: string }

export default function OnboardingPage() {
  const router = useRouter()
  const [projectName, setProjectName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [members, setMembers] = useState<Member[]>([
    { name: '', role: 'leader', technicalLevel: 'low-tech' },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addMember = () =>
    setMembers([...members, { name: '', role: 'member', technicalLevel: 'low-tech' }])

  const updateMember = (i: number, field: keyof Member, value: string) =>
    setMembers(members.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)))

  const removeMember = (i: number) => setMembers(members.filter((_, idx) => idx !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName || !deadline || members.some(m => !m.name)) {
      setError('Completá todos los campos')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName, deadline: new Date(deadline).toISOString(), members }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      router.push('/leader')
    } catch {
      setError('Error al guardar. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Configurá tu equipo</h1>
          <p className="text-gray-400 mt-1 text-sm">Estos datos reemplazarán el modo demo.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nombre del proyecto</label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="Mi proyecto"
              className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Deadline del proyecto</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Miembros del equipo</label>
              <button
                type="button"
                onClick={addMember}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                + Agregar
              </button>
            </div>

            {members.map((m, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={m.name}
                  onChange={e => updateMember(i, 'name', e.target.value)}
                  className="flex-1 rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={m.role}
                  onChange={e => updateMember(i, 'role', e.target.value)}
                  className="rounded-md bg-gray-800 border border-gray-700 text-white px-2 py-2 text-sm focus:outline-none"
                >
                  <option value="leader">Líder</option>
                  <option value="member">Miembro</option>
                </select>
                <select
                  value={m.technicalLevel}
                  onChange={e => updateMember(i, 'technicalLevel', e.target.value)}
                  className="rounded-md bg-gray-800 border border-gray-700 text-white px-2 py-2 text-sm focus:outline-none"
                >
                  <option value="low-tech">No-técnico</option>
                  <option value="high-tech">Técnico</option>
                </select>
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMember(i)}
                    className="text-gray-500 hover:text-red-400 text-sm px-1"
                  >
                    x
                  </button>
                )}
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2 text-sm transition-colors"
          >
            {loading ? 'Guardando...' : 'Comenzar'}
          </button>
        </form>
      </div>
    </div>
  )
}
