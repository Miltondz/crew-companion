'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import {
  CopilotChatConfigurationProvider,
  CopilotSidebar,
  useAgent,
  useConfigureSuggestions,
  useDefaultRenderTool,
  useFrontendTool,
} from '@copilotkit/react-core/v2'
import { ThreadsDrawer } from '@/components/threads-drawer'
import drawerStyles from '@/components/threads-drawer/threads-drawer.module.css'
import { ToolFallbackCard } from '@/components/copilot/ToolFallbackCard'
import { SurfaceRenderer } from '@/components/shared/SurfaceRenderer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SEED_STATE } from '@/lib/crew/seed'
import type { CrewState, SharedDocument } from '@/lib/crew/types'

function mergeCrewState(raw: unknown): CrewState {
  const partial = raw && typeof raw === 'object' ? (raw as Partial<CrewState>) : {}
  return {
    urgencyPhase: 'normal',
    mascotMood: 'calm',
    mascotMode: 'idle',
    highlightedTaskIds: [],
    ...SEED_STATE,
    ...partial,
  }
}

function useCrewAgent() {
  const { agent } = useAgent()
  const state = mergeCrewState(agent?.state)
  const setState = (updater: (prev: CrewState) => CrewState) => {
    agent?.setState(updater(mergeCrewState(agent?.state)))
  }
  return { agent, state, setState }
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground">
      {content}
    </pre>
  )
}

function DocsCanvas() {
  const { state, setState } = useCrewAgent()

  const openDocuments: SharedDocument[] = state.sharedDocuments.filter(d =>
    state.openDocumentIds.includes(d.id)
  )

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
      setState(prev => ({
        ...prev,
        openDocumentIds: prev.openDocumentIds.includes(documentId)
          ? prev.openDocumentIds
          : [...prev.openDocumentIds, documentId],
      }))
      return `documento ${documentId} abierto`
    },
  })

  useFrontendTool({
    name: 'renderSurface',
    description: 'Renderiza un componente UI tipado en el chat',
    parameters: z.object({
      envelope: z.object({
        type: z.string(),
        payload: z.record(z.unknown()),
      }),
    }),
    render: ({ args }) => <SurfaceRenderer envelope={args.envelope} />,
  })

  useDefaultRenderTool({
    render: ({ name, status, result, parameters }) => (
      <ToolFallbackCard name={name} status={status} result={result} parameters={parameters} />
    ),
  })

  return (
    <>
      <main className="flex h-screen flex-col overflow-hidden bg-background">
        <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Document Workspace</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {state.sharedDocuments.length} documento{state.sharedDocuments.length !== 1 ? 's' : ''} compartido{state.sharedDocuments.length !== 1 ? 's' : ''}
            </p>
          </div>

          {openDocuments.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
              <p className="max-w-md text-sm text-muted-foreground">
                Pedile al asistente que abra un documento, o seleccioná uno de la lista.
              </p>
            </div>
          ) : (
            <Tabs defaultValue={openDocuments[0]?.id} className="flex flex-1 flex-col">
              <TabsList className="w-fit">
                {openDocuments.map(doc => (
                  <TabsTrigger key={doc.id} value={doc.id} className="max-w-[180px] truncate">
                    {doc.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {openDocuments.map(doc => (
                <TabsContent
                  key={doc.id}
                  value={doc.id}
                  className="flex-1 overflow-auto rounded-xl border border-border bg-card p-6"
                >
                  <h2 className="mb-4 text-lg font-semibold text-foreground">{doc.title}</h2>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Compartido por{' '}
                    {state.members.find(m => m.id === doc.sharedBy)?.name ?? doc.sharedBy}
                    {' · '}
                    {new Date(doc.sharedAt).toLocaleDateString()}
                  </p>
                  <MarkdownContent content={doc.content} />
                </TabsContent>
              ))}
            </Tabs>
          )}

          {/* Available docs list (not open) */}
          {state.sharedDocuments.filter(d => !state.openDocumentIds.includes(d.id)).length > 0 && (
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                Otros documentos disponibles
              </p>
              <div className="space-y-1">
                {state.sharedDocuments
                  .filter(d => !state.openDocumentIds.includes(d.id))
                  .map(doc => (
                    <button
                      key={doc.id}
                      onClick={() =>
                        setState(prev => ({
                          ...prev,
                          openDocumentIds: [...prev.openDocumentIds, doc.id],
                        }))
                      }
                      className="block text-left text-sm text-foreground underline-offset-2 hover:underline"
                    >
                      {doc.title}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <CopilotSidebar
        defaultOpen
        width={420}
        input={{ disclaimer: () => null, className: 'pb-6' }}
      />
    </>
  )
}

function DocsPage() {
  const [threadId, setThreadId] = useState<string | undefined>()
  return (
    <div className={drawerStyles.layout}>
      <ThreadsDrawer agentId="crew_agent" threadId={threadId} onThreadChange={setThreadId} />
      <div className={drawerStyles.mainPanel}>
        <CopilotChatConfigurationProvider agentId="crew_agent" threadId={threadId}>
          <DocsCanvas />
        </CopilotChatConfigurationProvider>
      </div>
    </div>
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
