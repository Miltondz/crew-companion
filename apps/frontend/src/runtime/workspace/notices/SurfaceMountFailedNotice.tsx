'use client'

interface Props {
  reason: string
}

export function SurfaceMountFailedNotice({ reason }: Props) {
  return (
    <div className="my-1 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 ring-1 ring-amber-200">
      <span>⚠</span>
      <span>Couldn't mount surface: {reason}</span>
    </div>
  )
}
