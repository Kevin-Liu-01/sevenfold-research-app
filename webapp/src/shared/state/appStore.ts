import { create } from "zustand";
import type {
  CenterPaneView,
  LeftPaneView,
  ProjectSummary,
  RightPaneView,
} from "@/shared/types/domain";

interface AppState {
  projects: ProjectSummary[];
  activeProjectId: string;
  leftPaneView: LeftPaneView;
  centerPaneView: CenterPaneView;
  rightPaneView: RightPaneView;
  setActiveProjectId: (projectId: string) => void;
  setLeftPaneView: (view: LeftPaneView) => void;
  setCenterPaneView: (view: CenterPaneView) => void;
  setRightPaneView: (view: RightPaneView) => void;
}

const demoProjects: ProjectSummary[] = [
  { id: "proj-sample-001", name: "Sample Dissertation" },
  { id: "proj-sample-002", name: "Quantum Notes" },
];

export const useAppStore = create<AppState>((set) => ({
  projects: demoProjects,
  activeProjectId: demoProjects[0]?.id ?? "",
  leftPaneView: "files",
  centerPaneView: "writing",
  rightPaneView: "synthesis",
  setActiveProjectId: (projectId) => set({ activeProjectId: projectId }),
  setLeftPaneView: (view) => set({ leftPaneView: view }),
  setCenterPaneView: (view) => set({ centerPaneView: view }),
  setRightPaneView: (view) => set({ rightPaneView: view }),
}));
