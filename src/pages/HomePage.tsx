import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import supabase from "../services/supabaseClient";
import type { Project } from "../../database.types";

type ViewType = "card" | "table";

const HomePage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<ViewType>("card");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        setProjects(data || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.research_question
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      project.keywords?.some((keyword) =>
        keyword.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="relative">
          <span className="material-icons-outlined text-6xl text-gray-400 animate-spin">
            data_usage
          </span>
        </div>
        <div className="text-lg text-gray-600">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-7 py-6">
          <div className="flex justify-between items-center">
            <div className="flex flex-row items-center gap-4">
              <img
                src="/images/logo.png"
                alt="Logo"
                className="h-[5rem] w-auto"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  Your Projects
                </h1>
                <p className="text-gray-600">
                  Manage and organize your research projects
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={() => navigate("/newproject")}
            className="inline-flex items-center gap-2 pr-4 pl-3 py-3 bg-[#f57920] text-white rounded-lg hover:bg-[#e6651b] transition-all duration-200 hover:shadow-lg font-medium"
          >
            <span className="material-icons-outlined text-xl">add</span>
            Create New Project
          </button>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 material-icons-outlined">
                search
              </span>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f57920] focus:border-transparent"
              />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-white border border-gray-300 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewType("card")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                viewType === "card"
                  ? "bg-[#f57920] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span className="material-icons-outlined text-lg">grid_view</span>
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewType("table")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                viewType === "table"
                  ? "bg-[#f57920] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span className="material-icons-outlined text-lg">view_list</span>
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>

        {/* Projects Display */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-4">
              <span className="material-icons-outlined text-6xl text-gray-300">
                folder_open
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {projects.length === 0 ? "No projects yet" : "No projects found"}
            </h3>
            <p className="text-gray-500 mb-6">
              {projects.length === 0
                ? "Create your first project to get started."
                : "Try adjusting your search terms!"}
            </p>
            {projects.length === 0 && (
              <button
                onClick={() => navigate("/newproject")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#f57920] text-white rounded-lg hover:bg-[#e6651b] transition-all duration-200 shadow-md hover:shadow-lg font-medium"
              >
                <span className="material-icons-outlined text-xl">add</span>
                Create Your First Project
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Results Counter */}
            <div className="flex items-center justify-between mb-6">
              <p className="flex items-center gap-1 text-sm text-gray-600">
                <span className="material-icons-outlined text-3xl text-gray-500">
                  dashboard
                </span>
                {filteredProjects.length === 1
                  ? "1 project found"
                  : `${filteredProjects.length} projects found`}
              </p>
            </div>

            {/* Card View */}
            {viewType === "card" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-[#f57920] hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#f57920] transition-colors duration-200">
                          {project.name}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                          {project.research_question}
                        </p>
                      </div>
                      <span className="material-icons-outlined text-gray-400 group-hover:text-[#f57920] transition-colors duration-200">
                        arrow_forward_ios
                      </span>
                    </div>

                    {project.keywords && project.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.keywords.slice(0, 3).map((keyword, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-orange-50 text-[#f57920] text-xs font-medium rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                        {project.keywords.length > 3 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                            +{project.keywords.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="material-icons-outlined text-sm">
                          schedule
                        </span>
                        <span>
                          Created{" "}
                          {new Date(project.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <span className="material-icons-outlined text-sm">
                          visibility
                        </span>
                        <span>View</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Table View */}
            {viewType === "table" && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                          Project
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                          Research Question
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                          Keywords
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                          Created
                        </th>
                        <th className="text-right py-4 px-6 text-sm font-semibold text-gray-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredProjects.map((project) => (
                        <tr
                          key={project.id}
                          onClick={() => navigate(`/project/${project.id}`)}
                          className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                        >
                          <td className="py-4 px-6">
                            <div className="font-semibold text-gray-900 hover:text-[#f57920] transition-colors duration-200">
                              {project.name}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm text-gray-600 max-w-md truncate">
                              {project.research_question}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1">
                              {project.keywords
                                ?.slice(0, 2)
                                .map((keyword, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-orange-50 text-[#f57920] text-xs rounded-full"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              {project.keywords &&
                                project.keywords.length > 2 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    +{project.keywords.length - 2}
                                  </span>
                                )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm text-gray-600">
                              {new Date(
                                project.created_at
                              ).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button className="text-gray-400 hover:text-[#f57920] transition-colors duration-200">
                              <span className="material-icons-outlined">
                                arrow_forward_ios
                              </span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default HomePage;
