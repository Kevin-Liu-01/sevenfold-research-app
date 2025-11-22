import { AgentsPanel } from "@/modules/agents/AgentsPanel"

export const RightPane = () => {
  return (
    <div className="flex h-full flex-col gap-4">
      <p className="text-text-muted text-xs font-semibold uppercase tracking-[0.2em]">
        Agents
      </p>
      <AgentsPanel />
    </div>
  )
}

