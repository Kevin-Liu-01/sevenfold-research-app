import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import supabase from "../auth/supabaseClient";

import type { Project } from "../../../schema/db-types";

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
                    .eq("owner_id", user.id)
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
            project.research_question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.keywords?.some((keyword: string) =>
                keyword.toLowerCase().includes(searchTerm.toLowerCase())
            )
    );

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-app-outer">
                <div className="relative">
                    <span className="material-icons-outlined text-6xl text-gray-400 animate-spin">
                        data_usage
                    </span>
                </div>
                <div className="text-lg text-gray-700">Loading projects...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app-outer">
            {/* Header */}
            <header className="bg-app-inner border-b border-gray-300">
                <div className="max-w-7xl mx-auto px-6 py-5">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-row items-center gap-3">
                            <img
                                src="/branding/logo-sq.png"
                                alt="Logo"
                                className="h-12 w-auto"
                            />
                            <div>
                                <h1 className="text-2xl font-semibold text-[var(--color-off-black)]">
                                    Your Projects
                                </h1>
                                <p className="text-sm text-gray-600">
                                    Manage and organize your research projects
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">{user?.email}</span>
                            <button
                                onClick={() => navigate("/settings", { state: { from: "home" } })}
                                className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-[var(--color-off-black)] hover:bg-gray-100 rounded-lg transition-all duration-200"
                                title="Settings"
                            >
                                <span className="material-icons-outlined text-xl">settings</span>
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="text-sm text-gray-600 hover:text-[var(--color-off-black)] hover:bg-gray-100 rounded-lg px-3 py-2 transition-all duration-200 font-medium"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => navigate("/newproject")}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-viix-orange text-white rounded-lg hover:bg-viix-orange-500 transition-all duration-200 font-medium text-sm"
                        >
                            <span className="material-icons-outlined text-lg">add</span>
                            New Project
                        </button>

                        <div className="flex-1 sm:flex-initial sm:w-80">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 material-icons-outlined text-lg">
                                    search
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search projects..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-app-inner border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-viix-orange-400 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center bg-app-inner border border-gray-300 rounded-lg p-1">
                        <button
                            onClick={() => setViewType("card")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 text-sm ${
                                viewType === "card"
                                    ? "bg-viix-orange text-white font-medium"
                                    : "text-gray-600 hover:text-[var(--color-off-black)] hover:bg-gray-100"
                            }`}
                        >
                            <span className="material-icons-outlined text-base">grid_view</span>
                            <span>Cards</span>
                        </button>
                        <button
                            onClick={() => setViewType("table")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 text-sm ${
                                viewType === "table"
                                    ? "bg-viix-orange text-white font-medium"
                                    : "text-gray-600 hover:text-[var(--color-off-black)] hover:bg-gray-100"
                            }`}
                        >
                            <span className="material-icons-outlined text-base">view_list</span>
                            <span>Table</span>
                        </button>
                    </div>
                </div>

                {/* Projects Display */}
                {filteredProjects.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="mb-4">
                            <span className="material-icons-outlined text-6xl text-gray-400">
                                folder_open
                            </span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">
                            {projects.length === 0 ? "No projects yet" : "No projects found"}
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            {projects.length === 0
                                ? "Create your first project to get started."
                                : "Try adjusting your search terms"}
                        </p>
                        {projects.length === 0 && (
                            <button
                                onClick={() => navigate("/newproject")}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-viix-orange text-white rounded-lg hover:bg-viix-orange-500 transition-all duration-200 font-medium text-sm"
                            >
                                <span className="material-icons-outlined text-lg">add</span>
                                Create Your First Project
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Results Counter */}
                        <div className="mb-5">
                            <p className="text-sm text-gray-600">
                                {filteredProjects.length === 1
                                    ? "1 project"
                                    : `${filteredProjects.length} projects`}
                            </p>
                        </div>

                        {/* Card View */}
                        {viewType === "card" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredProjects.map((project) => (
                                    <div
                                        key={project.id}
                                        onClick={() => navigate(`/project/${project.id}`)}
                                        className="group bg-app-inner p-5 rounded-xl border border-gray-300 hover:border-viix-orange-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col min-h-[140px]"
                                    >
                                        <div className="flex items-start justify-between mb-3 flex-1">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-semibold text-[var(--color-off-black)] mb-1.5 group-hover:text-viix-orange transition-colors duration-200 truncate">
                                                    {project.name}
                                                </h3>
                                                <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                                                    {project.description}
                                                </p>
                                            </div>
                                            <span className="material-icons-outlined text-lg text-gray-400 group-hover:text-viix-orange transition-colors duration-200 ml-2 flex-shrink-0">
                                                arrow_forward_ios
                                            </span>
                                        </div>

                                        <div className="mt-auto">
                                            <span className="text-xs text-gray-500">
                                                {new Date(project.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Table View */}
                        {viewType === "table" && (
                            <div className="bg-app-inner rounded-2xl border border-gray-300 overflow-hidden shadow-md">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-100 border-b border-gray-300">
                                            <tr>
                                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--color-off-black)]">
                                                    Project
                                                </th>
                                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--color-off-black)]">
                                                    Description
                                                </th>
                                                <th className="text-left py-4 px-6 text-sm font-semibold text-[var(--color-off-black)]">
                                                    Created
                                                </th>
                                                <th className="text-right py-4 px-6 text-sm font-semibold text-[var(--color-off-black)]">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-300">
                                            {filteredProjects.map((project) => (
                                                <tr
                                                    key={project.id}
                                                    onClick={() =>
                                                        navigate(`/project/${project.id}`)
                                                    }
                                                    className="hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                                                >
                                                    <td className="py-4 px-6">
                                                        <div className="font-semibold text-[var(--color-off-black)] hover:text-viix-orange transition-colors duration-200">
                                                            {project.name}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="text-sm text-gray-700 max-w-md truncate">
                                                            {project.description}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="text-sm text-gray-700">
                                                            {new Date(
                                                                project.created_at
                                                            ).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <button className="text-gray-500 hover:text-viix-orange transition-colors duration-200">
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
