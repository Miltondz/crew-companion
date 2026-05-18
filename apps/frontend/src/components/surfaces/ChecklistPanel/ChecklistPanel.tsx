'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { ChecklistPayload } from './manifest'

type TaskPriority = 'low' | 'medium' | 'high'

interface ChecklistItem {
  id: string
  text: string
  done: boolean
  priority?: TaskPriority
}

export default function ChecklistPanel({ payload }: SurfaceProps<ChecklistPayload>) {
  const [items, setItems] = useState<ChecklistItem[]>(Array.isArray(payload?.items) ? payload.items : [])

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, done: !item.done } : item
    ))
  }

  const completedCount = items.filter(i => i.done).length
  const totalCount = items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  const isAllDone = completedCount === totalCount

  const priorityStyles = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  }

  const priorityLabel = {
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-2 border-slate-100 overflow-hidden">
      <CardHeader className="bg-slate-50 border-b py-4 px-5">
        <div className="space-y-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <span>✅</span>
            <span>{typeof payload?.title === 'string' ? payload.title : 'Sin título'}</span>
          </CardTitle>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>{completedCount} / {totalCount} completados</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex flex-col divide-y divide-slate-100">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
              onClick={() => toggleItem(item.id)}
            >
              <div className="flex items-center gap-3 pr-4">
                <div className={cn(
                  'w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors',
                  item.done ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                )}>
                  {item.done && <span className="text-[10px] font-bold">✓</span>}
                </div>
                <span className={cn(
                  'text-xs font-medium leading-relaxed transition-all',
                  item.done ? 'line-through text-slate-400' : 'text-slate-700'
                )}>
                  {item.text}
                </span>
              </div>

              {item.priority && (
                <Badge variant="outline" className={cn(
                  'border-none text-[9px] px-1.5 py-0 font-bold shrink-0',
                  priorityStyles[item.priority]
                )}>
                  {priorityLabel[item.priority]}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>

      {isAllDone && payload?.completionMessage && (
        <CardFooter className="bg-green-50 p-3 border-t">
          <p className="text-xs text-green-700 font-bold flex items-center gap-2 w-full justify-center">
            <span>🎉</span>
            {payload.completionMessage}
          </p>
        </CardFooter>
      )}
    </Card>
  )
}
