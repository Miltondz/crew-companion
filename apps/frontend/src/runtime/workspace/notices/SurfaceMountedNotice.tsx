'use client'

interface Props {
  mountId: string
  surfaceId: string
}

export function SurfaceMountedNotice({ mountId: _mountId, surfaceId }: Props) {
  return (
    <div className="my-1 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700 ring-1 ring-indigo-200">
      <span>🆕</span>
      <span>Surface added to dashboard: <strong>{surfaceId}</strong></span>
    </div>
  )
}
