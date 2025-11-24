import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import type {
  CenterPaneView,
  LeftPaneView,
  LibraryDocument,
  ProjectSummary,
  RightPaneView,
} from "@/shared/types/domain";

interface AppState {
  // Auth state
  session: Session | null;
  user: User | null;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;

  // Project state
  projects: ProjectSummary[];
  activeProjectId: string;
  setProjects: (projects: ProjectSummary[]) => void;
  setActiveProjectId: (projectId: string) => void;

  // UI state
  leftPaneView: LeftPaneView;
  centerPaneView: CenterPaneView;
  rightPaneView: RightPaneView;
  setLeftPaneView: (view: LeftPaneView) => void;
  setCenterPaneView: (view: CenterPaneView) => void;
  setRightPaneView: (view: RightPaneView) => void;

  // Library state
  selectedLibraryDocument: LibraryDocument | null;
  setSelectedLibraryDocument: (document: LibraryDocument | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth state
  session: null,
  user: null,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),

  // Project state
  projects: [],
  activeProjectId: "",
  setProjects: (projects) => set({ projects }),
  setActiveProjectId: (projectId) => set({ activeProjectId: projectId }),

  // UI state
  leftPaneView: "files",
  centerPaneView: "writing",
  rightPaneView: "synthesis",
  setLeftPaneView: (view) => set({ leftPaneView: view }),
  setCenterPaneView: (view) => set({ centerPaneView: view }),
  setRightPaneView: (view) => set({ rightPaneView: view }),

  // Library state
  selectedLibraryDocument: null,
  setSelectedLibraryDocument: (document) =>
    set({ selectedLibraryDocument: document }),
}));
