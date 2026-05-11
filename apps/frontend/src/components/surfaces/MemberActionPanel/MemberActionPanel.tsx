'use client'

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { MemberActionPayload } from './manifest'

export default function MemberActionPanel({ payload }: SurfaceProps<MemberActionPayload>) {
  const { urgencyPhase, actions, message } = payload

  const phaseStyles = {
    urgent: 'bg-orange-100 border-orange-300 text-orange-900',
    panic: 'bg-red-100 border-red-400 text-red-900 animate-pulse',
    expired: 'bg-red-200 border-red-600 text-red-950 animate-pulse',
    normal: 'bg-slate-50 border-slate-200 text-slate-800',
    focus: 'bg-slate-50 border-slate-200 text-slate-800',
  }

  const priorityConfig = {
    immediate: { badge: 'bg-red-500 text-white', label: 'YA', dot: '●' },
    soon: { badge: 'bg-orange-400 text-white', label: 'PRONTO', dot: '●' },
    optional: { badge: 'bg-slate-200 text-slate-600', label: 'LUEGO', dot: '○' },
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-2 overflow-hidden border-slate-100">
      <CardHeader className={cn('py-4 px-5 border-b transition-colors duration-500', phaseStyles[urgencyPhase])}>
        <div className="space-y-1">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <span>{['panic', 'expired'].includes(urgencyPhase) ? '🚨' : '⚡'}</span>
            <span>Acciones inmediatas</span>
          </CardTitle>
          <p className="text-[11px] font-medium leading-relaxed opacity-90">
            {message}
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex flex-col">
          {actions.map((action, index) => {
            const config = priorityConfig[action.priority]
            return (
              <div key={index}>
                <div className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-2.5">
                      <span className={cn(
                        'text-sm mt-0.5 shrink-0',
                        action.priority === 'immediate' ? 'text-red-500' :
                        action.priority === 'soon' ? 'text-orange-400' : 'text-slate-400'
                      )}>
                        {config.dot}
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800 leading-snug">
                          {action.label}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {action.description}
                        </p>
                        {action.assignedTo && (
                          <div className="text-[10px] font-bold text-slate-400 mt-1">
                            Para: <span className="text-slate-600">{action.assignedTo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('border-none text-[9px] px-2 py-0 font-black tracking-tighter shrink-0 h-5', config.badge)}>
                      {config.label}
                    </Badge>
                  </div>
                </div>
                {index < actions.length - 1 && <Separator />}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
