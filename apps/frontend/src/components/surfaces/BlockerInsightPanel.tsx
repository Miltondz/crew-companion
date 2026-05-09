'use client'

import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type TechnicalLevel = 'low-tech' | 'high-tech'

interface BlockerInsightPayload {
  blocker: {
    id: string
    description: string
    reportedAt: string
  }
  member: {
    name: string
    technicalLevel: TechnicalLevel
  }
  possibleCauses: string[]
  suggestedActions: Array<{
    action: string
    forTechnicalLevel: TechnicalLevel | 'all'
  }>
  canReassignTask: boolean
}

interface BlockerInsightPanelProps {
  payload: BlockerInsightPayload
}

export function BlockerInsightPanel({ payload }: BlockerInsightPanelProps) {
  const { blocker, member, possibleCauses, suggestedActions, canReassignTask } = payload

  const getTimeAgo = (isoDate: string) => {
    const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000)
    if (seconds < 60) return 'hace unos segundos'
    const minutes = Math.floor(seconds / 60)
    if (minutes === 1) return 'hace 1 minuto'
    return `hace ${minutes} minutos`
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-orange-200 overflow-hidden">
      <CardHeader className="bg-orange-50 border-b py-3 px-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-sm font-bold text-orange-900 flex items-center gap-2">
            <span>⚠️</span>
            <span>Blocker reportado</span>
          </CardTitle>
          <div className="flex items-center gap-2 text-[10px] text-orange-800/70 font-medium">
            <span className="font-bold">{member.name}</span>
            <span>•</span>
            <Badge variant="outline" className={cn(
              'border-none px-1.5 py-0 text-[10px] font-bold',
              member.technicalLevel === 'low-tech' ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-700'
            )}>
              {member.technicalLevel}
            </Badge>
            <span>•</span>
            <span>{getTimeAgo(blocker.reportedAt)}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        <blockquote className="border-l-4 border-orange-400 bg-orange-50/50 p-3 rounded-r-lg">
          <p className="text-sm text-slate-800 italic leading-relaxed">
            "{blocker.description}"
          </p>
        </blockquote>

        {possibleCauses.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Posibles causas:</h4>
            <ul className="space-y-1">
              {possibleCauses.map((cause, i) => (
                <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">•</span>
                  <span>{cause}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        <div className="space-y-3">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acciones sugeridas:</h4>
          <div className="space-y-2">
            {suggestedActions.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded border border-slate-100">
                <span className="text-xs text-slate-700 font-medium leading-snug">{item.action}</span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-white border-slate-200 text-slate-500 font-bold uppercase shrink-0">
                  {item.forTechnicalLevel === 'all' ? 'todos' : item.forTechnicalLevel}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {canReassignTask && (
        <CardFooter className="p-4 pt-0">
          <Button 
            variant="outline"
            className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800 font-bold h-9 text-xs"
            onClick={() => {}}
          >
            Reasignar tarea
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
