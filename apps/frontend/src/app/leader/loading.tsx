import { Skeleton } from '@/components/ui/skeleton'

export default function LeaderLoading() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-5">
        <Skeleton className="h-16 w-full rounded-none" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="col-span-2 h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
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
