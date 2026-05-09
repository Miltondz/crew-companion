'use client'

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface BeginnerGuidePayload {
  topic: string
  steps: Array<{
    stepNumber: number
    title: string
    content: string
    tip?: string
  }>
  estimatedMinutes: number
}

interface BeginnerGuidePanelProps {
  payload: BeginnerGuidePayload
}

export function BeginnerGuidePanel({ payload }: BeginnerGuidePanelProps) {
  const { topic, steps, estimatedMinutes } = payload

  return (
    <Card className="w-full max-w-md shadow-lg border-2 border-blue-100 overflow-hidden">
      <CardHeader className="bg-blue-50 border-b py-3 px-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <span>📚</span>
              <span className="truncate">{topic}</span>
            </CardTitle>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-none text-[10px] px-2 py-0 shrink-0 font-bold">
              ⏱ {estimatedMinutes} min
            </Badge>
          </div>
          <p className="text-[11px] text-blue-800/70 font-medium">
            Seguí estos pasos, uno a la vez
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="flex flex-col divide-y divide-slate-100">
          {steps.map((step, index) => (
            <div key={index} className="p-5 space-y-3">
              <div className="flex items-start gap-4">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm mt-0.5">
                  {step.stepNumber}
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-800 leading-snug">
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {step.content}
                  </p>
                  
                  {step.tip && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 pl-3 py-1.5 mt-2 rounded-r">
                      <p className="text-[11px] text-yellow-900 leading-tight">
                        <span className="font-bold mr-1">💡 Tip:</span>
                        {step.tip}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
