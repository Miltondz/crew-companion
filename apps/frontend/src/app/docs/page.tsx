'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { z } from 'zod'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { FileText, Plus, Pencil, Trash2, Save, X, Check, FolderOpen, Columns2, Maximize2 } from 'lucide-react'
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
import { useCrewAgent } from '@/lib/useCrewAgent'
import { useActivityStream } from '@/lib/useActivityStream'
import { WorkspaceShell } from '@/runtime/workspace/WorkspaceShell'
import { WebNav } from '@/components/shared/WebNav'
import { MemberAvatars } from '@/components/shared/MemberAvatars'
import { AgentStatusPill } from '@/components/shared/AgentStatusPill'
import type { CrewState, SharedDocument } from '@/lib/crew/types'

const SEED_MEMBER_IDS = new Set(['m1', 'm2', 'm3'])


function FolderCard({
  doc,
  sharer,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: {
  doc: SharedDocument
  sharer?: string
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      onClick={onSelect}
      className={`group relative shrink-0 w-[180px] h-[140px] flex rounded-lg overflow-hidden cursor-pointer transition-all ${
        isSelected
          ? 'bg-[var(--bg-surface)] ring-2 ring-violet-500/60 shadow-lg'
          : 'bg-[var(--bg-surface)]/60 ring-1 ring-white/10 hover:ring-white/20'
      }`}
    >
      {/* Spine */}
      <div
        className="w-[28px] flex-shrink-0 flex flex-col items-center justify-between py-2 border-r border-white/10"
        style={{ background: 'color-mix(in srgb, #8b5cf6 14%, transparent)' }}
      >
        <FolderOpen size={12} className={isSelected ? 'text-violet-300' : 'text-violet-400/80'} />
        <span
          className="font-mono text-[8px] font-bold tracking-widest uppercase text-violet-300/80 whitespace-nowrap overflow-hidden"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', maxHeight: '90px' }}
        >
          {doc.title.slice(0, 18)}
        </span>
        <div className="h-3 w-0.5 rounded-full bg-violet-400/40" />
      </div>

      {/* Content preview */}
      <div className="flex-1 min-w-0 flex flex-col p-2">
        <div className="flex items-start justify-between gap-1 mb-1">
          <p className={`text-[11px] font-semibold leading-tight line-clamp-2 ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]/90'}`}>
            {doc.title}
          </p>
        </div>
        <p className="text-[9px] font-mono text-[var(--text-muted)] line-clamp-3 flex-1">
          {doc.content.slice(0, 80) || 'Sin contenido'}
        </p>
        <p className="text-[9px] font-mono text-[var(--text-muted)] mt-1 truncate">
          {sharer ?? '—'}
        </p>

        {/* Actions on hover */}
        <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); onEdit() }}
            className="rounded p-1 bg-[var(--bg-surface)]/80 text-[var(--text-muted)] hover:text-violet-300 hover:bg-violet-500/15 transition"
            title="Editar"
          >
            <Pencil className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="rounded p-1 bg-[var(--bg-surface)]/80 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/15 transition"
            title="Eliminar"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function NewFolderCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="shrink-0 w-[140px] h-[140px] rounded-lg bg-[var(--bg-surface)]/40 ring-1 ring-dashed ring-violet-500/40 hover:ring-violet-500/70 hover:bg-violet-500/10 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
    >
      <Plus className="w-5 h-5 text-violet-400" />
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-400">Nuevo</span>
    </motion.button>
  )
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-[var(--text-primary)]">
      {content}
    </pre>
  )
}

function DocsCanvas() {
  const { data: session } = useSession()
  const { state, setState, workspaceId } = useCrewAgent()
  const { events: activityEvents, push: pushActivity } = useActivityStream()

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [compareDocId, setCompareDocId] = useState<string | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ title: '', content: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', content: '' })

  const selectedDoc = state.sharedDocuments.find(d => d.id === selectedDocId)
  const compareDoc = state.sharedDocuments.find(d => d.id === compareDocId)
  const currentMember = state.members.find(m => m.id === state.currentMemberId)
  const effectiveMembers = state.members.filter(m => !SEED_MEMBER_IDS.has(m.id))

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
    toast.success('Documento creado', { description: title })
  }

  const startEdit = (doc: SharedDocument) => {
    setShowCreate(false)
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
      { title: 'Crear nota nueva', message: 'Creá un documento con los próximos pasos del proyecto.' },
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

  useDefaultRenderTool({
    render: ({ name, status, result, parameters }) => (
      <ToolFallbackCard name={name} status={status} result={result} parameters={parameters} />
    ),
  })

  return (
    <>
      <WorkspaceShell
        phase={state.urgencyPhase}
        workspaceId={workspaceId ?? undefined}
        agentRail={<CopilotChat className="h-full" />}
        webNav={<WebNav user={session?.user ? { name: session.user.name, email: session.user.email } : undefined} />}
        user={{ name: currentMember?.name ?? 'Usuario', role: currentMember?.role === 'leader' ? 'Team Lead' : 'Miembro' }}
        activityEvents={activityEvents}
        commandSurface={{
          milestoneTitle: 'Documentos del equipo',
          agentStatus: <AgentStatusPill />,
          memberAvatars: <MemberAvatars members={effectiveMembers} blockers={state.blockers} />,
          onCommandPalette: () => {
            const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
            window.dispatchEvent(event)
          },
        }}
      >
        <div className="flex flex-1 flex-col overflow-hidden bg-[var(--bg-base)]">

          {/* Folder shelf — horizontal scrollable row */}
          <div className="shrink-0 border-b border-white/10 bg-[var(--bg-surface)]/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-thin">
              <AnimatePresence>
                {state.sharedDocuments.map(doc => {
                  const sharer = state.members.find(m => m.id === doc.sharedBy)?.name
                  return (
                    <FolderCard
                      key={doc.id}
                      doc={doc}
                      sharer={sharer}
                      isSelected={doc.id === selectedDocId}
                      onSelect={() => { setSelectedDocId(doc.id); setEditingId(null); setShowCreate(false) }}
                      onEdit={() => startEdit(doc)}
                      onDelete={() => handleDelete(doc)}
                    />
                  )
                })}
              </AnimatePresence>
              <NewFolderCard onClick={() => { setShowCreate(true); setEditingId(null); setSelectedDocId(null) }} />
            </div>
          </div>

          {/* Viewer / editor area */}
          <motion.div
            key={showCreate ? 'create' : editingId ?? selectedDocId ?? 'empty'}
            className="flex-1 overflow-y-auto p-6"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >

            {/* CREATE FORM */}
            {showCreate && (
              <div className="mx-auto max-w-3xl">
                <div className="flex rounded-xl overflow-hidden bg-[var(--bg-surface)] ring-1 ring-violet-500/30 shadow-lg">
                  {/* Spine */}
                  <div
                    className="w-[30px] flex-shrink-0 flex flex-col items-center justify-between py-3 border-r border-white/10"
                    style={{ background: 'color-mix(in srgb, #8b5cf6 18%, transparent)' }}
                  >
                    <Plus size={14} className="text-violet-300" />
                    <span
                      className="font-mono text-[8px] font-bold tracking-widest uppercase text-violet-300"
                      style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
                    >
                      Nuevo
                    </span>
                    <div className="h-3 w-0.5 rounded-full bg-violet-400/40" />
                  </div>
                  {/* Body */}
                  <div className="flex-1 min-w-0 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-bold text-[var(--text-primary)]">Crear nuevo documento</p>
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
              </div>
            )}

            {/* EDIT FORM */}
            {editingId && !showCreate && (
              <div className="mx-auto max-w-3xl">
                <div className="flex rounded-xl overflow-hidden bg-[var(--bg-surface)] ring-1 ring-violet-500/30 shadow-lg">
                  <div
                    className="w-[30px] flex-shrink-0 flex flex-col items-center justify-between py-3 border-r border-white/10"
                    style={{ background: 'color-mix(in srgb, #8b5cf6 18%, transparent)' }}
                  >
                    <Pencil size={12} className="text-violet-300" />
                    <span
                      className="font-mono text-[8px] font-bold tracking-widest uppercase text-violet-300"
                      style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
                    >
                      Editar
                    </span>
                    <div className="h-3 w-0.5 rounded-full bg-violet-400/40" />
                  </div>
                  <div className="flex-1 min-w-0 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-bold text-[var(--text-primary)]">Editar documento</p>
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
              </div>
            )}

            {/* VIEWER */}
            {!showCreate && !editingId && (
              selectedDoc ? (
                <div className="w-full">
                  {/* Toolbar */}
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => setCompareMode(m => { if (m) setCompareDocId(null); return !m })}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-mono transition ${
                        compareMode
                          ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                          : 'bg-white/5 border-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10'
                      }`}
                      title={compareMode ? 'Salir del modo comparación' : 'Comparar dos documentos lado a lado'}
                    >
                      {compareMode ? <Maximize2 className="w-3 h-3" /> : <Columns2 className="w-3 h-3" />}
                      {compareMode ? 'Vista única' : 'Comparar'}
                    </button>
                    <button
                      onClick={() => { setSelectedDocId(null); setCompareDocId(null); setCompareMode(false) }}
                      className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition"
                      title="Cerrar documento"
                    >
                      <X className="w-3 h-3" />
                      Cerrar
                    </button>
                    {compareMode && !compareDoc && (
                      <span className="text-[10px] font-mono text-[var(--text-muted)] ml-1">
                        Elegí un segundo folder de la fila superior →
                      </span>
                    )}
                  </div>

                  {/* Doc pane(s) */}
                  <div className={compareMode ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'grid grid-cols-1 gap-4'}>
                    {[selectedDoc, compareMode && compareDoc ? compareDoc : null].filter(Boolean).map((doc, idx) => {
                      const d = doc as SharedDocument
                      const sharerName = state.members.find(m => m.id === d.sharedBy)?.name ?? d.sharedBy
                      return (
                        <div key={d.id} className="flex rounded-xl overflow-hidden bg-[var(--bg-surface)] ring-1 ring-white/10 shadow-lg">
                          <div
                            className="w-[30px] flex-shrink-0 flex flex-col items-center justify-between py-3 border-r border-white/10"
                            style={{ background: 'color-mix(in srgb, #8b5cf6 14%, transparent)' }}
                          >
                            <FileText size={12} className="text-violet-300" />
                            <span
                              className="font-mono text-[8px] font-bold tracking-widest uppercase text-violet-300/80 line-clamp-1"
                              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
                            >
                              {d.title.slice(0, 20)}
                            </span>
                            <div className="h-3 w-0.5 rounded-full bg-violet-400/40" />
                          </div>
                          <div className="flex-1 min-w-0 p-8">
                            <div className="mb-4 flex items-start justify-between gap-3">
                              <h2 className="text-xl font-bold text-[var(--text-primary)]">{d.title}</h2>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => startEdit(d)}
                                  className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 px-2.5 py-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                                  title="Editar"
                                >
                                  <Pencil className="w-3 h-3" />
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDelete(d)}
                                  className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/15 hover:border-red-500/30 px-2.5 py-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-red-400 transition"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Eliminar
                                </button>
                                {compareMode && idx === 1 && (
                                  <button
                                    onClick={() => setCompareDocId(null)}
                                    className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 px-2.5 py-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                                    title="Quitar de comparación"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                Compartido por <span className="text-[var(--text-primary)]">{sharerName}</span>
                              </span>
                              <span className="text-[var(--text-muted)]">·</span>
                              <span className="text-[10px] text-[var(--text-muted)] font-mono">{new Date(d.sharedAt).toLocaleDateString('es')}</span>
                            </div>
                            <MarkdownContent content={d.content} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <EmptyState
                    icon="📂"
                    title="Sin documento abierto"
                    description="Elegí un folder de la fila superior o creá uno nuevo"
                  />
                </div>
              )
            )}
          </motion.div>

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
