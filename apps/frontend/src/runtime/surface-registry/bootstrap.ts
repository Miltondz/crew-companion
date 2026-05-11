// Bootstrap runs exactly once, client-side, before the first <SurfaceHost>.
// Called from CopilotKitProviderShell — do NOT call from app/layout.tsx (server component)
// or individual pages (races + duplicate work).
//
// INVARIANT: Never import __fixture_* manifests here. Fixtures are test-only.
import { surfaceRegistry } from './registry'
import { manifest as taskSuggestion } from '@/components/surfaces/TaskSuggestionPanel/manifest'
import { manifest as beginnerGuide } from '@/components/surfaces/BeginnerGuidePanel/manifest'
import { manifest as blockerInsight } from '@/components/surfaces/BlockerInsightPanel/manifest'
import { manifest as checklist } from '@/components/surfaces/ChecklistPanel/manifest'
import { manifest as documentSummary } from '@/components/surfaces/DocumentSummaryPanel/manifest'
import { manifest as memberAction } from '@/components/surfaces/MemberActionPanel/manifest'
import { manifest as milestoneSummary } from '@/components/surfaces/MilestoneSummaryPanel/manifest'
import { manifest as troubleshooting } from '@/components/surfaces/TroubleshootingWizard/manifest'

let bootstrapped = false

export function bootstrapRegistry(): void {
  if (bootstrapped) return
  bootstrapped = true

  ;[
    taskSuggestion,
    beginnerGuide,
    blockerInsight,
    checklist,
    documentSummary,
    memberAction,
    milestoneSummary,
    troubleshooting,
  ].forEach(m => surfaceRegistry.register(m))
}
