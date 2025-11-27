import { PaneToggleGroup } from '@/shared/components/ui/PaneToggleGroup'
import { useAppStore } from '@/shared/state/appStore'
import { SynthesisPanel } from './SynthesisPanel'
import { ReviewPanel } from './ReviewPanel'

export const AgentsPanel = () => {
  const { rightPaneView, setRightPaneView } = useAppStore()

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Agents</p>
        <PaneToggleGroup
          value={rightPaneView}
          onChange={setRightPaneView}
          options={[
            { label: 'Synthesis', value: 'synthesis' },
            { label: 'Review', value: 'review' },
          ]}
        />
      </div>
      {rightPaneView === 'synthesis' ? <SynthesisPanel /> : <ReviewPanel />}
    </div>
  )
}

