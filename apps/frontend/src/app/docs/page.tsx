'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import {
  CopilotChat,
  CopilotChatConfigurationProvider,
  useConfigureSuggestions,
  useDefaultRenderTool,
  useFrontendTool,
} from '@copilotkit/react-core/v2'
import { ToolFallbackCard } from '@/components/copilot/ToolFallbackCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { MascotSVG } from '@/components/mascot/MascotSVG'
import { MobileChatDrawer } from '@/components/shared/MobileChatDrawer'
import { SurfaceHost } from '@/runtime/surface-registry/SurfaceHost'
import { adaptLegacyEnvelope, isLegacyEnvelope } from '@/runtime/surface-registry/adapter'
import { LegacyEnvelopeSchema, FullEnvelopeSchema } from '@/runtime/surface-registry/envelope-schema'
import { useRuntimeContext } from '@/runtime/surface-registry/useRuntimeContext'
import { useCrewAgent } from '@/lib/useCrewAgent'
import { WorkspaceShell } from '@/runtime/workspace/WorkspaceShell'
import { useLayoutEngine } from '@/runtime/workspace/useLayoutEngine'
import { PrimaryWorkzoneRegion } from '@/runtime/workspace/regions/PrimaryWorkzoneRegion'
import { layoutEngine } from '@/runtime/workspace/layout-engine'
import type { CrewState } from '@/lib/crew/types'


function MarkdownContent({ content }: { content: string }) {
  return (
    <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-slate-700">
      {content}
    </pre>
  )
}

function DocsCanvas() {
  const router = useRouter()
  const { state, setState } = useCrewAgent()
  const layout = useLayoutEngine()
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    state.openDocumentIds[0] ?? state.sharedDocuments[0]?.id ?? null
  )

  const selectedDoc = state.sharedDocuments.find(d => d.id === selectedDocId)

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
        <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200">
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
        habitat={<MascotSVG mood={state.mascotMood} mode={state.mascotMode} />}
      >
        <div className="flex flex-1 overflow-hidden bg-slate-100">

          {/* Doc list sidebar — keep as-is */}
          <div className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm">
        {/* Sidebar header */}
        <div className="shrink-0 bg-gradient-to-b from-violet-700 to-violet-600 px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-xl shadow-inner">📄</div>
            <div>
              <p className="text-sm font-bold text-white">Documentos</p>
              <p className="text-[10px] text-violet-200">{state.sharedDocuments.length} compartido{state.sharedDocuments.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Archivos
          </p>
          {state.sharedDocuments.length === 0 ? (
            <EmptyState icon="📂" title="Sin documentos" description="Compartí uno desde el chat" />
          ) : (
            <div className="space-y-1">
              {state.sharedDocuments.map(doc => {
                const isSelected = doc.id === selectedDocId
                const sharer = state.members.find(m => m.id === doc.sharedBy)
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left transition-all ${
                      isSelected
                        ? 'bg-violet-50 ring-1 ring-violet-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 text-base ${isSelected ? 'text-violet-600' : 'text-slate-400'}`}>📋</span>
                      <div className="min-w-0">
                        <p className={`truncate text-xs font-semibold ${isSelected ? 'text-violet-700' : 'text-slate-700'}`}>
                          {doc.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          por {sharer?.name ?? doc.sharedBy}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

          {/* Document viewer — keep as-is */}
          <div className="flex flex-1 flex-col overflow-hidden min-w-0">
            <header className="shrink-0 bg-gradient-to-r from-violet-700 via-violet-600 to-purple-600 px-6 py-4 shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/leader')}
              className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/25 transition ring-1 ring-white/20"
            >
              ← Líder
            </button>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl shadow-inner">
              📋
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                {selectedDoc?.title ?? 'Document Workspace'}
              </h1>
              {selectedDoc ? (
                <p className="mt-0.5 text-sm text-violet-200">
                  Compartido por {state.members.find(m => m.id === selectedDoc.sharedBy)?.name ?? selectedDoc.sharedBy}
                  {' · '}
                  {new Date(selectedDoc.sharedAt).toLocaleDateString()}
                </p>
              ) : (
                <p className="mt-0.5 text-sm text-violet-200">Seleccioná un documento de la lista</p>
              )}
            </div>
          </div>
        </header>

            <motion.div
              className="flex-1 overflow-y-auto p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
          <PrimaryWorkzoneRegion mounts={layout['primary-workzone'].mounts} phase={state.urgencyPhase} />
          {selectedDoc ? (
            <div className="mx-auto max-w-3xl">
              <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="mb-2 text-2xl font-bold text-slate-800">{selectedDoc.title}</h2>
                <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                  <span className="text-xs text-slate-400">
                    Compartido por <span className="font-medium text-slate-600">{state.members.find(m => m.id === selectedDoc.sharedBy)?.name}</span>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-400">{new Date(selectedDoc.sharedAt).toLocaleDateString()}</span>
                </div>
                <MarkdownContent content={selectedDoc.content} />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <EmptyState
                icon="📄"
                title="Ningún documento seleccionado"
                description="Elegí uno de la lista o pedile al asistente que lo abra"
              />
            </div>
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
