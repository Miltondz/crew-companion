'use client'

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type TaskPriority = 'low' | 'medium' | 'high'

interface TaskSuggestionPayload {
  suggestions: Array<{
    title: string
    description: string
    priority: TaskPriority
    assignTo?: string
    estimatedMinutes?: number
  }>
  context: string
}

interface TaskSuggestionPanelProps {
  payload: TaskSuggestionPayload
}

export function TaskSuggestionPanel({ payload }: TaskSuggestionPanelProps) {
  const priorityStyles = {
    high: { border: 'border-l-red-500', badge: 'bg-red-100 text-red-700 hover:bg-red-100', label: 'Alta' },
    medium: { border: 'border-l-yellow-500', badge: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100', label: 'Media' },
    low: { border: 'border-l-green-500', badge: 'bg-green-100 text-green-700 hover:bg-green-100', label: 'Baja' }
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-2 border-slate-100 overflow-hidden">
      <CardHeader className="bg-slate-50 border-b py-3 px-4">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <span>💡</span>
            <span>Sugerencias de tareas</span>
          </CardTitle>
          <p className="text-[11px] text-slate-500 font-medium leading-tight">
            {payload.context}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="flex flex-col">
          {payload.suggestions.map((suggestion, index) => (
            <div key={index}>
              <div className={cn(
                'p-4 border-l-4 transition-colors hover:bg-slate-50/50',
                priorityStyles[suggestion.priority].border
              )}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-bold text-slate-800 leading-snug">
                      {suggestion.title}
                    </h4>
                    <Badge variant="outline" className={cn('border-none text-[10px] px-2 py-0', priorityStyles[suggestion.priority].badge)}>
                      {priorityStyles[suggestion.priority].label}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {suggestion.description}
                  </p>
                  
                  <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400 mt-1">
                    {suggestion.assignTo && (
                      <div className="flex items-center gap-1">
                        <span>👤</span>
                        <span>{suggestion.assignTo}</span>
                      </div>
                    )}
                    {suggestion.estimatedMinutes && (
                      <div className="flex items-center gap-1">
                        <span>⏱</span>
                        <span>~{suggestion.estimatedMinutes} min</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {index < payload.suggestions.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
