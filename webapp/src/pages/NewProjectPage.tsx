// src/pages/NewProjectPage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../auth/supabaseClient";

const NewProjectPage: React.FC = () => {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSubmit = useMemo(() => {
        return name.trim().length > 0 && !submitting;
    }, [name, submitting]);

    const handleCancel = () => {
        navigate("/");
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setSubmitting(true);
        setError(null);

        // Ensure user is signed in
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            setError("You must be signed in to create a project.");
            setSubmitting(false);
            return;
        }

        // Insert to projects with correct columns
        const { data, error: insertError } = await supabase
            .from("projects")
            .insert({
                owner_id: user.id,
                name: name.trim(),
                description: description.trim() || null,
                settings: {}, // default empty jsonb
            })
            .select("id")
            .single();

        if (insertError) {
            setError(insertError.message);
            setSubmitting(false);
            return;
        }

        // Navigate on success (adjust if you have a project detail route)
        // e.g., navigate(`/projects/${data.id}`);
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-inter font-medium text-gray-900 mb-3">
                        Create a new project
                    </h1>
                    <p className="text-gray-600">
                        Name your project and add a short description. You can edit these later.
                    </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <form onSubmit={handleCreate} className="space-y-6" noValidate>
                        {/* Project name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Project name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Few-shot Learning Survey"
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Description (optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description (optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                placeholder="What is this project about?"
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-600" role="alert" aria-live="polite">
                                {error}
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="px-4 py-2 bg-kets-green text-white rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {submitting ? "Creating…" : "Create project"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewProjectPage;
