import { Skeleton } from '@/components/ui/skeleton'

export default function DocsLoading() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <div className="flex w-60 shrink-0 flex-col gap-3 border-r border-slate-200 bg-white p-3">
        <Skeleton className="h-20 rounded-none" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-16 rounded-none" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
      <div className="flex w-[380px] shrink-0 flex-col gap-3 border-l border-slate-200 bg-white p-4">
        <Skeleton className="h-12 rounded-xl" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
