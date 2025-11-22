import { LeftPane } from "@/app/panes/LeftPane"
import { CenterPane } from "@/app/panes/CenterPane"
import { RightPane } from "@/app/panes/RightPane"
import { ProjectContextBar } from "@/modules/projects/ProjectContextBar"

export const SevenfoldApp = () => {
  return (
    <div className="bg-surface-base text-text-primary flex min-h-screen flex-col">
      <ProjectContextBar />
      <div className="grid flex-1 grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(280px,360px)]">
        <section className="pane-surface">
          <LeftPane />
        </section>
        <section className="pane-surface">
          <CenterPane />
        </section>
        <section className="pane-surface">
          <RightPane />
        </section>
      </div>
    </div>
  )
}

