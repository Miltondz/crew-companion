'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { FileText, Plus, Pencil, Trash2, Save, X, ArrowLeft, Check } from 'lucide-react'
import {
  CopilotChat,
  CopilotChatConfigurationProvider,
  useConfigureSuggestions,
  useDefaultRenderTool,
  useFrontendTool,
} from '@copilotkit/react-core/v2'
import { ToolFallbackCard } from '@/components/copilot/ToolFallbackCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { MobileChatDrawer } from '@/components/shared/MobileChatDrawer'
import { SurfaceHost } from '@/runtime/surface-registry/SurfaceHost'
import { adaptLegacyEnvelope, isLegacyEnvelope } from '@/runtime/surface-registry/adapter'
import { LegacyEnvelopeSchema, FullEnvelopeSchema } from '@/runtime/surface-registry/envelope-schema'
import { useRuntimeContext } from '@/runtime/surface-registry/useRuntimeContext'
import { useCrewAgent } from '@/lib/useCrewAgent'
import { useActivityStream } from '@/lib/useActivityStream'
import { WorkspaceShell } from '@/runtime/workspace/WorkspaceShell'
import { useLayoutEngine } from '@/runtime/workspace/useLayoutEngine'
import { PrimaryWorkzoneRegion } from '@/runtime/workspace/regions/PrimaryWorkzoneRegion'
import { layoutEngine } from '@/runtime/workspace/layout-engine'
import { companionBus } from '@/runtime/companion/EventBus'
import type { CrewState, SharedDocument } from '@/lib/crew/types'


function MarkdownContent({ content }: { content: string }) {
  return (
    <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-[var(--text-primary)]">
      {content}
    </pre>
  )
}

function DocsCanvas() {
  const router = useRouter()
  const { state, setState } = useCrewAgent()
  const layout = useLayoutEngine()
  const { events: activityEvents, push: pushActivity } = useActivityStream()

  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    state.openDocumentIds[0] ?? state.sharedDocuments[0]?.id ?? null
  )
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ title: '', content: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', content: '' })

  const selectedDoc = state.sharedDocuments.find(d => d.id === selectedDocId)
  const currentMember = state.members.find(m => m.id === state.currentMemberId)

  const handleCreate = () => {
    const title = createForm.title.trim()
    const content = createForm.content.trim()
    if (!title) {
      toast.error('Falta el título')
      return
    }
    const doc: SharedDocument = {
      id: crypto.randomUUID(),
      title,
      content,
      sharedBy: state.currentMemberId,
      sharedAt: new Date().toISOString(),
    }
    setState(prev => ({ ...prev, sharedDocuments: [...prev.sharedDocuments, doc] }))
    setSelectedDocId(doc.id)
    setShowCreate(false)
    setCreateForm({ title: '', content: '' })
    pushActivity('doc_opened', `${currentMember?.name ?? 'Alguien'} compartió "${title}"`, '📄')
    companionBus.emit({ type: 'AGENT_SPOKE' })
    toast.success('Documento creado', { description: title })
  }

  const startEdit = (doc: SharedDocument) => {
    setEditingId(doc.id)
    setEditForm({ title: doc.title, content: doc.content })
  }

  const handleSaveEdit = () => {
    if (!editingId) return
    const title = editForm.title.trim()
    if (!title) {
      toast.error('Falta el título')
      return
    }
    setState(prev => ({
      ...prev,
      sharedDocuments: prev.sharedDocuments.map(d =>
        d.id === editingId ? { ...d, title, content: editForm.content } : d
      ),
    }))
    pushActivity('doc_opened', `${currentMember?.name ?? 'Alguien'} actualizó "${title}"`, '✏️')
    setEditingId(null)
    toast.success('Documento actualizado')
  }

  const handleDelete = (doc: SharedDocument) => {
    if (!confirm(`¿Eliminar "${doc.title}"?`)) return
    setState(prev => ({
      ...prev,
      sharedDocuments: prev.sharedDocuments.filter(d => d.id !== doc.id),
      openDocumentIds: prev.openDocumentIds.filter(id => id !== doc.id),
    }))
    if (selectedDocId === doc.id) setSelectedDocId(null)
    pushActivity('doc_opened', `${currentMember?.name ?? 'Alguien'} eliminó "${doc.title}"`, '🗑️')
    toast.info('Documento eliminado')
  }

  useConfigureSuggestions({
    available: 'before-first-message',
    suggestions: [
      { title: 'Resumir documento', message: 'Dame un resumen del documento abierto.' },
      { title: 'Buscar info técnica', message: '¿Cómo instalo el proyecto según los docs?' },
      { title: 'Stack técnico', message: '¿Cuál es el stack tecnológico del proyecto?' },
    ],
  })

  useFrontendTool({
    name: 'setCrewState',
    description: 'Actualiza el estado del equipo',
    parameters: z.object({ state: z.record(z.unknown()) }),
    handler: async ({ state: partial }) => {
      setState(prev => ({ ...prev, ...(partial as Partial<CrewState>) }))
      return 'estado actualizado'
    },
  })

  useFrontendTool({
    name: 'openDocument',
    description: 'Abre un documento en el workspace',
    parameters: z.object({ documentId: z.string() }),
    handler: async ({ documentId }) => {
      setSelectedDocId(documentId)
      let docTitle: string | undefined
      setState(prev => {
        docTitle = prev.sharedDocuments.find(d => d.id === documentId)?.title
        return {
          ...prev,
          openDocumentIds: prev.openDocumentIds.includes(documentId)
            ? prev.openDocumentIds
            : [...prev.openDocumentIds, documentId],
        }
      })
      toast.info('Documento abierto', { description: docTitle })
      return `documento ${documentId} abierto`
    },
  })

  useFrontendTool({
    name: 'shareDocument',
    description: 'Crea y comparte un documento con el equipo',
    parameters: z.object({ title: z.string(), content: z.string() }),
    handler: async ({ title, content }) => {
      const doc: SharedDocument = {
        id: crypto.randomUUID(),
        title,
        content,
        sharedBy: state.currentMemberId,
        sharedAt: new Date().toISOString(),
      }
      setState(prev => ({ ...prev, sharedDocuments: [...prev.sharedDocuments, doc] }))
      pushActivity('doc_opened', `Asistente compartió "${title}"`, '📄')
      toast.success(`Documento compartido: ${title}`)
      return `documento ${doc.id} compartido`
    },
  })

  useFrontendTool({
    name: 'updateDocument',
    description: 'Actualiza un documento existente',
    parameters: z.object({ documentId: z.string(), title: z.string().optional(), content: z.string().optional() }),
    handler: async ({ documentId, title, content }) => {
      let updated = false
      let updatedTitle = ''
      setState(prev => {
        const docs = prev.sharedDocuments.map(d => {
          if (d.id !== documentId) return d
          updated = true
          updatedTitle = title ?? d.title
          return { ...d, ...(title !== undefined ? { title } : {}), ...(content !== undefined ? { content } : {}) }
        })
        return { ...prev, sharedDocuments: docs }
      })
      if (!updated) return `documento ${documentId} no encontrado`
      pushActivity('doc_opened', `Asistente actualizó "${updatedTitle}"`, '✏️')
      toast.success(`Documento actualizado`)
      return `documento ${documentId} actualizado`
    },
  })

  useFrontendTool({
    name: 'deleteDocument',
    description: 'Elimina un documento del equipo',
    parameters: z.object({ documentId: z.string() }),
    handler: async ({ documentId }) => {
      let removedTitle = ''
      setState(prev => {
        removedTitle = prev.sharedDocuments.find(d => d.id === documentId)?.title ?? documentId
        return {
          ...prev,
          sharedDocuments: prev.sharedDocuments.filter(d => d.id !== documentId),
          openDocumentIds: prev.openDocumentIds.filter(id => id !== documentId),
        }
      })
      if (selectedDocId === documentId) setSelectedDocId(null)
      pushActivity('doc_opened', `Asistente eliminó "${removedTitle}"`, '🗑️')
      toast.info(`Documento eliminado`)
      return `documento ${documentId} eliminado`
    },
  })

  const actorRole = state.members.find(m => m.id === state.currentMemberId)?.role ?? 'leader'
  const runtimeContext = useRuntimeContext({
    role: actorRole,
    phase: state.urgencyPhase,
    hasActiveBlocker: state.blockers.some(b => !b.resolved),
  })

  useFrontendTool({
    name: 'renderSurface',
    description: 'Renderiza un componente UI tipado en el chat',
    parameters: z.object({
      envelope: z.union([LegacyEnvelopeSchema, FullEnvelopeSchema]),
    }),
    render: ({ args }) => {
      if (!args.envelope) return null
      const fullEnvelope = isLegacyEnvelope(args.envelope)
        ? adaptLegacyEnvelope(args.envelope, runtimeContext)
        : (args.envelope as import('@/runtime/surface-registry/types').SurfaceEnvelope)
      const result = layoutEngine.mount(fullEnvelope, runtimeContext)
      if (!result.ok) {
        return <SurfaceHost envelope={fullEnvelope} context={runtimeContext} />
      }
      return (
        <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs text-[var(--text-muted)] ring-1 ring-white/10">
          <span>🧩</span>
          <span>Superficie montada en workspace</span>
        </div>
      )
    },
  })

  useDefaultRenderTool({
    render: ({ name, status, result, parameters }) => (
      <ToolFallbackCard name={name} status={status} result={result} parameters={parameters} />
    ),
  })

  return (
    <>
      <WorkspaceShell
        phase={state.urgencyPhase}
        agentRail={<CopilotChat className="h-full" />}
        user={{ name: currentMember?.name ?? 'Usuario', role: currentMember?.role === 'leader' ? 'Team Lead' : 'Miembro' }}
        activityEvents={activityEvents}
        commandSurface={{
          onCommandPalette: () => {
            const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
            window.dispatchEvent(event)
          },
        }}
      >
        <div className="flex flex-1 overflow-hidden bg-[var(--bg-base)]">

          {/* Doc list sidebar */}
          <div className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-[var(--bg-surface)]">
            <div className="shrink-0 flex items-center justify-between px-3 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-400" />
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">Documentos</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">
                    {state.sharedDocuments.length} compartido{state.sharedDocuments.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowCreate(true); setEditingId(null) }}
                className="flex items-center gap-1 rounded-full bg-violet-500/15 border border-violet-500/30 px-2 py-1 text-[10px] font-bold text-violet-400 hover:bg-violet-500/25 transition"
                title="Crear documento"
              >
                <Plus className="w-3 h-3" />
                Nuevo
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {state.sharedDocuments.length === 0 && !showCreate ? (
                <div className="p-4 text-center">
                  <p className="text-[10px] text-[var(--text-muted)] font-mono mb-2">Sin documentos</p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="text-[10px] text-violet-400 hover:text-violet-300"
                  >
                    + Crear el primero
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {state.sharedDocuments.map(doc => {
                    const isSelected = doc.id === selectedDocId
                    const sharer = state.members.find(m => m.id === doc.sharedBy)
                    return (
                      <div
                        key={doc.id}
                        className={`group rounded-lg px-2.5 py-2 transition-colors ${
                          isSelected
                            ? 'bg-violet-500/15 ring-1 ring-violet-500/30'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <button
                          onClick={() => { setSelectedDocId(doc.id); setEditingId(null) }}
                          className="w-full text-left"
                        >
                          <div className="flex items-start gap-2">
                            <FileText className={`mt-0.5 w-3 h-3 shrink-0 ${isSelected ? 'text-violet-400' : 'text-[var(--text-muted)]'}`} />
                            <div className="min-w-0 flex-1">
                              <p className={`truncate text-xs font-semibold ${isSelected ? 'text-violet-300' : 'text-[var(--text-primary)]'}`}>
                                {doc.title}
                              </p>
                              <p className="mt-0.5 text-[10px] text-[var(--text-muted)] font-mono truncate">
                                por {sharer?.name ?? doc.sharedBy}
                              </p>
                            </div>
                          </div>
                        </button>
                        <div className="mt-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(doc)}
                            className="rounded p-1 text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)] transition"
                            title="Editar"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc)}
                            className="rounded p-1 text-[var(--text-muted)] hover:bg-red-500/15 hover:text-red-400 transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Document viewer */}
          <div className="flex flex-1 flex-col overflow-hidden min-w-0 bg-[var(--bg-base)]">
            <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[var(--bg-surface)]/60 backdrop-blur-sm">
              <button
                onClick={() => router.push('/leader')}
                className="flex items-center gap-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
              >
                <ArrowLeft className="w-3 h-3" />
                Líder
              </button>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                <h1 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {showCreate ? 'Nuevo documento' : editingId ? 'Editando' : selectedDoc?.title ?? 'Documentos'}
                </h1>
              </div>
              {selectedDoc && !showCreate && !editingId && (
                <p className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                  {state.members.find(m => m.id === selectedDoc.sharedBy)?.name ?? selectedDoc.sharedBy}
                  {' · '}
                  {new Date(selectedDoc.sharedAt).toLocaleDateString('es')}
                </p>
              )}
            </header>

            <motion.div
              key={showCreate ? 'create' : editingId ?? selectedDocId ?? 'empty'}
              className="flex-1 overflow-y-auto p-6"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <PrimaryWorkzoneRegion mounts={layout['primary-workzone'].mounts} phase={state.urgencyPhase} />

              {/* CREATE FORM */}
              {showCreate && (
                <div className="mx-auto max-w-3xl">
                  <div className="rounded-xl border border-violet-500/30 bg-white/5 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-bold text-[var(--text-primary)]">📄 Crear nuevo documento</p>
                      <button
                        onClick={() => { setShowCreate(false); setCreateForm({ title: '', content: '' }) }}
                        className="rounded p-1 text-[var(--text-muted)] hover:bg-white/10 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Título *</label>
                        <input
                          type="text"
                          value={createForm.title}
                          autoFocus
                          onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                          placeholder="Ej: Setup del proyecto"
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-violet-500/50 focus:bg-white/10"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Contenido (markdown)</label>
                        <textarea
                          value={createForm.content}
                          onChange={e => setCreateForm(f => ({ ...f, content: e.target.value }))}
                          placeholder="# Encabezado&#10;&#10;Contenido del documento..."
                          rows={14}
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-violet-500/50 focus:bg-white/10"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={handleCreate}
                        disabled={!createForm.title.trim()}
                        className="flex items-center gap-1.5 rounded-lg bg-violet-500/20 border border-violet-500/40 px-4 py-2 text-xs font-bold text-violet-300 hover:bg-violet-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Check className="w-3 h-3" />
                        Crear y compartir
                      </button>
                      <button
                        onClick={() => { setShowCreate(false); setCreateForm({ title: '', content: '' }) }}
                        className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:bg-white/10 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* EDIT FORM */}
              {editingId && !showCreate && (
                <div className="mx-auto max-w-3xl">
                  <div className="rounded-xl border border-violet-500/30 bg-white/5 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-bold text-[var(--text-primary)]">✏️ Editar documento</p>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded p-1 text-[var(--text-muted)] hover:bg-white/10 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Título</label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-violet-500/50 focus:bg-white/10"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Contenido</label>
                        <textarea
                          value={editForm.content}
                          onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                          rows={14}
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-[var(--text-primary)] outline-none focus:border-violet-500/50 focus:bg-white/10"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editForm.title.trim()}
                        className="flex items-center gap-1.5 rounded-lg bg-violet-500/20 border border-violet-500/40 px-4 py-2 text-xs font-bold text-violet-300 hover:bg-violet-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Save className="w-3 h-3" />
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:bg-white/10 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEWER */}
              {!showCreate && !editingId && (
                selectedDoc ? (
                  <div className="mx-auto max-w-3xl">
                    <div className="rounded-xl border border-white/10 bg-[var(--bg-surface)] p-8">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">{selectedDoc.title}</h2>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => startEdit(selectedDoc)}
                            className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 px-2.5 py-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                            title="Editar"
                          >
                            <Pencil className="w-3 h-3" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(selectedDoc)}
                            className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/15 hover:border-red-500/30 px-2.5 py-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-red-400 transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3 h-3" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                      <div className="mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          Compartido por <span className="text-[var(--text-primary)]">{state.members.find(m => m.id === selectedDoc.sharedBy)?.name ?? selectedDoc.sharedBy}</span>
                        </span>
                        <span className="text-[var(--text-muted)]">·</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">{new Date(selectedDoc.sharedAt).toLocaleDateString('es')}</span>
                      </div>
                      <MarkdownContent content={selectedDoc.content} />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <EmptyState
                      icon="📄"
                      title="Ningún documento seleccionado"
                      description="Elegí uno de la lista o creá uno nuevo"
                    />
                  </div>
                )
              )}
            </motion.div>
          </div>

        </div>
      </WorkspaceShell>

      <MobileChatDrawer accentClass="from-violet-600 to-purple-600" label="AI Doc Assistant" />
    </>
  )
}

function DocsPage() {
  return (
    <CopilotChatConfigurationProvider agentId="crew_agent">
      <DocsCanvas />
    </CopilotChatConfigurationProvider>
  )
}

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <>{children}</>
}

export default function Page() {
  return (
    <ClientOnly>
      <DocsPage />
    </ClientOnly>
  )
}
