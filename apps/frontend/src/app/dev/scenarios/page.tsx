import { notFound } from 'next/navigation'
import { ScenariosInner } from './ScenariosInner'

export default function ScenariosPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <ScenariosInner />
}
