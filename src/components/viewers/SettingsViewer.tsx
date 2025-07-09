import React, { useEffect, useState } from "react";
import supabase from "../../services/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useParams } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  research_question: string;
  keywords: string[];
  created_at: string;
  research_goal?: string;
  topic_tags?: string[];
  focus_domains?: string[];
  custom_query_boosts?: string[];
  collaborators?: string[];
  use_highlights_in_search?: boolean;
  project_aware_reranking?: boolean;
  auto_suggest_papers?: boolean;
  citation_style?: string;
  agent_tone?: string;
  memory_scope?: string;
  summarization_style?: string;
  citation_insertion?: string;
}

const SettingsViewer: React.FC = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Project>>({});
  const { user } = useAuth();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!user) return;

        // First try to get project by ID if available
        let query = supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id);

        if (projectId) {
          query = query.eq("id", projectId);
        } else {
          query = query.order("created_at", { ascending: false }).limit(1);
        }

        const { data, error } = await query.single();

        if (error) throw error;
        setProject(data);
        setFormData(data);
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [user, projectId]);

  const handleSave = async () => {
    if (!project) return;

    try {
      const { error } = await supabase
        .from("projects")
        .update(formData)
        .eq("id", project.id);

      if (error) throw error;

      setProject({ ...project, ...formData });
      setEditing(false);
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  const handleCancel = () => {
    setFormData(project || {});
    setEditing(false);
  };

  const handleArrayChange = (field: string, value: string) => {
    const array = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item);
    setFormData((prev) => ({ ...prev, [field]: array }));
  };

  if (loading) {
    return <div className="p-8">Loading project settings...</div>;
  }

  if (!project) {
    return <div className="p-8">No project found</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold">Project Settings</h1>
        <div className="space-x-2">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                className="pl-2 pr-4 py-2 text-sm font-semibold bg-red-400 text-white rounded-lg hover:bg-red-700 transition"
              >
                <span className="material-icons align-middle mr-2">save</span>
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="pl-2 pr-4 py-2 text-sm font-semibold bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                <span className="material-icons align-middle mr-2">cancel</span>
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="pl-3 pr-5 py-2 text-sm flex items-center bg-green-400 text-black rounded-lg hover:bg-green-600 transition-all"
            >
              <span className="material-icons align-middle mr-2">edit</span>
              <div className="font-semibold mb-0.5">Edit Settings</div>
            </button>
          )}
        </div>
      </div>

      <div className="flex bg-orange-100 p-3 rounded-lg border border-orange-200 flex-row items-center mb-8">
        <span className="material-icons text-orange-400 mr-2">info</span>
        <p className="text-orange-700 max-w-2xl">
          Each project in Ketspen is a self-evolving research workspace. These
          settings help personalize and control its behavior.
        </p>
      </div>

      <div className="space-y-8">
        {/* Core Project Settings */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <span className="material-icons mr-2 text-gray-400">settings</span>
            Core Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block uppercase text-xs font-bold text-gray-700 mb-2">
                Project Title
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-700">{project.name}</p>
              )}
            </div>

            <div>
              <label className="block uppercase text-xs font-bold text-gray-700 mb-2">
                Research Goal
              </label>
              {editing ? (
                <textarea
                  value={
                    formData.research_goal || formData.research_question || ""
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      research_goal: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              ) : (
                <p className="text-gray-700">
                  {project.research_goal || project.research_question}
                </p>
              )}
            </div>

            <div>
              <label className="block uppercase text-xs font-bold text-gray-700 mb-2">
                Topic Tags
              </label>
              {editing ? (
                <input
                  type="text"
                  value={(formData.topic_tags || formData.keywords || []).join(
                    ", "
                  )}
                  onChange={(e) =>
                    handleArrayChange("topic_tags", e.target.value)
                  }
                  placeholder="e.g., transformers, QA, NLP"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(project.topic_tags || project.keywords || []).map(
                    (tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                      >
                        {tag}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block uppercase text-xs font-bold text-gray-700 mb-2">
                Focus Domains
              </label>
              {editing ? (
                <input
                  type="text"
                  value={(formData.focus_domains || []).join(", ")}
                  onChange={(e) =>
                    handleArrayChange("focus_domains", e.target.value)
                  }
                  placeholder="e.g., cs.CL, cs.LG, cs.AI"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(project.focus_domains || []).map((domain, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm"
                    >
                      {domain}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block uppercase text-xs font-bold text-gray-700 mb-2">
                Custom Query Boosts
              </label>
              {editing ? (
                <input
                  type="text"
                  value={(formData.custom_query_boosts || []).join(", ")}
                  onChange={(e) =>
                    handleArrayChange("custom_query_boosts", e.target.value)
                  }
                  placeholder="Keywords or concepts to prioritize"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(project.custom_query_boosts || []).map((boost, index) => (
                    <span
                      key={index}
                      className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-sm"
                    >
                      {boost}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block uppercase text-xs font-bold text-gray-700 mb-2">
                Collaborators
              </label>
              {editing ? (
                <input
                  type="text"
                  value={(formData.collaborators || []).join(", ")}
                  onChange={(e) =>
                    handleArrayChange("collaborators", e.target.value)
                  }
                  placeholder="Email addresses of collaborators"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(project.collaborators || []).map((collaborator, index) => (
                    <span
                      key={index}
                      className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-sm"
                    >
                      {collaborator}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Smart Context Settings */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <span className="material-icons mr-2 text-gray-400">
              fingerprint
            </span>
            Smart Context Settings
          </h2>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="use_highlights"
                checked={formData.use_highlights_in_search ?? true}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    use_highlights_in_search: e.target.checked,
                  }))
                }
                disabled={!editing}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="use_highlights"
                className="ml-2 text-sm text-gray-700"
              >
                Use Highlights in Search - Toggle whether highlights influence
                retrieval
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="project_aware_reranking"
                checked={formData.project_aware_reranking ?? true}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    project_aware_reranking: e.target.checked,
                  }))
                }
                disabled={!editing}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="project_aware_reranking"
                className="ml-2 text-sm text-gray-700"
              >
                Project-Aware Reranking - Enable context-aware reranking of
                search results
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto_suggest"
                checked={formData.auto_suggest_papers ?? true}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    auto_suggest_papers: e.target.checked,
                  }))
                }
                disabled={!editing}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="auto_suggest"
                className="ml-2 text-sm text-gray-700"
              >
                Auto-suggest Papers - Recommend papers based on recent notes or
                highlights
              </label>
            </div>

            <div>
              <label className="block uppercase text-xs font-bold text-gray-700 mb-2">
                Citation Style
              </label>
              {editing ? (
                <select
                  value={formData.citation_style || "APA"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      citation_style: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="APA">APA</option>
                  <option value="MLA">MLA</option>
                  <option value="Chicago">Chicago</option>
                  <option value="Harvard">Harvard</option>
                  <option value="BibTeX">BibTeX</option>
                </select>
              ) : (
                <p className="text-gray-700">
                  {project.citation_style || "APA"}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* AI Assistant Customization */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <span className="material-icons mr-2 text-gray-400">lightbulb</span>
            AI Assistant Customization
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block uppercase text-xs font-bold text-gray-700 mb-2">
                Agent Tone
              </label>
              {editing ? (
                <select
                  value={formData.agent_tone || "Curious"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      agent_tone: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Concise">Concise</option>
                  <option value="Curious">Curious</option>
                  <option value="Pedagogical">Pedagogical</option>
                  <option value="Technical">Technical</option>
                </select>
              ) : (
                <p className="text-gray-700">
                  {project.agent_tone || "Curious"}
                </p>
              )}
            </div>

            <div>
              <label className="block uppercase text-xs font-bold text-gray-700 mb-2">
                Memory Scope
              </label>
              {editing ? (
                <select
                  value={formData.memory_scope || "Full Context"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      memory_scope: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Papers Only">Papers Only</option>
                  <option value="Notes Only">Notes Only</option>
                  <option value="Full Context">Full Context</option>
                </select>
              ) : (
                <p className="text-gray-700">
                  {project.memory_scope || "Full Context"}
                </p>
              )}
            </div>

            <div>
              <label className="block uppercase text-xs font-bold text-gray-700 mb-2">
                Summarization Style
              </label>
              {editing ? (
                <select
                  value={formData.summarization_style || "Bullet Points"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      summarization_style: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Bullet Points">Bullet Points</option>
                  <option value="Paragraph">Paragraph</option>
                  <option value="Visual">Visual</option>
                </select>
              ) : (
                <p className="text-gray-700">
                  {project.summarization_style || "Bullet Points"}
                </p>
              )}
            </div>

            <div>
              <label className="block uppercase text-xs font-bold text-gray-700 mb-2">
                Citation Insertion
              </label>
              {editing ? (
                <select
                  value={formData.citation_insertion || "Inline"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      citation_insertion: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Inline">Inline</option>
                  <option value="Footnote">Footnote</option>
                  <option value="Appendix">Appendix</option>
                </select>
              ) : (
                <p className="text-gray-700">
                  {project.citation_insertion || "Inline"}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Project Metadata */}
        <section className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Project Metadata</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">Project ID</h3>
              <p className="text-sm text-gray-600">{project.id}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Created At</h3>
              <p className="text-sm text-gray-600">
                {new Date(project.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsViewer;
