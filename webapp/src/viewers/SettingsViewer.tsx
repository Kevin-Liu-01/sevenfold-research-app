// src/viewers/SettingsViewer.tsx
import React, { useEffect, useMemo, useState } from "react";
import supabase from "../auth/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useWorkbench } from "../context/WorkbenchContext";

import type { Project } from "../../../schema/db-types";
type Json = Record<string, unknown>;

const SettingsViewer: React.FC = () => {
    const { profile } = useAuth();
    const { projectId } = useWorkbench();

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [copied, setCopied] = useState(false);

    // form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState<string>("");
    const [settingsText, setSettingsText] = useState<string>("{}");
    const [error, setError] = useState<string | null>(null);

    const canEdit = useMemo(() => {
        if (!project || !profile) return false;
        return !project.owner_id || project.owner_id === profile.user_id;
    }, [project, profile]);

    useEffect(() => {
        const fetchProject = async () => {
            if (!projectId) return;
            setLoading(true);
            setError(null);
            const { data, error } = await supabase
                .from("projects")
                .select("id, owner_id, name, description, settings")
                .eq("id", projectId)
                .maybeSingle();

            if (error) {
                setError(error.message);
            } else if (data) {
                setProject(data as Project);
                setName(data.name ?? "");
                setDescription(data.description ?? "");
                setSettingsText(JSON.stringify(data.settings ?? {}, null, 2));
            }
            setLoading(false);
        };

        fetchProject();
    }, [projectId]);

    const onEdit = () => {
        if (!canEdit) return;
        setIsEditing(true);
    };

    const onCancel = () => {
        if (!project) return;
        setIsEditing(false);
        setName(project.name ?? "");
        setDescription(project.description ?? "");
        setSettingsText(JSON.stringify(project.settings ?? {}, null, 2));
        setError(null);
    };

    const onSave = async () => {
        if (!project) return;
        setSaving(true);
        setError(null);

        let parsed: Json = {};
        try {
            parsed = settingsText.trim() ? (JSON.parse(settingsText) as Json) : {};
        } catch {
            setSaving(false);
            setError("Settings must be valid JSON.");
            return;
        }

        const { data, error } = await supabase
            .from("projects")
            .update({
                name: name?.trim() || project.name,
                description: description?.trim() || null,
                settings: parsed,
            })
            .eq("id", project.id)
            .select("id, owner_id, name, description, settings")
            .maybeSingle();

        setSaving(false);

        if (error) {
            setError(error.message);
            return;
        }

        if (data) {
            setProject(data as Project);
            setIsEditing(false);
        }
    };

    const copyProjectId = async () => {
        if (!project) return;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(project.id);
            } else {
                const ta = document.createElement("textarea");
                ta.value = project.id;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (e) {
            console.error("Copy failed", e);
        }
    };

    const deleteProject = async () => {
        if (!project) return;
        if (!canEdit) return;
        const ok = window.confirm(
            "Are you sure you want to delete this project? This action cannot be undone."
        );
        if (!ok) return;

        const { error } = await supabase.from("projects").delete().eq("id", project.id);
        if (error) {
            setError(error.message);
            return;
        }
        // Redirect out of the project view
        window.location.href = "/"; // change if your app uses a different home route
    };

    if (loading) {
        return <div className="p-8 text-gray-500">Loading project settings…</div>;
    }

    if (!project) {
        return <div className="p-8 text-gray-500">No project found.</div>;
    }

    return (
        <div className="h-full overflow-auto bg-app-inner">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-app-inner/80 backdrop-blur py-4">
                <div className="flex items-center justify-between max-w-4xl mx-auto px-6">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800">Project Settings</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage the project name, description, and raw settings JSON.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {!isEditing ? (
                            <button
                                onClick={onEdit}
                                disabled={!canEdit}
                                className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition
                                    ${canEdit ? "bg-viix-orange text-white hover:bg-viix-orange-500" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                            >
                                Edit
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={onCancel}
                                    className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onSave}
                                    disabled={saving}
                                    className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white bg-viix-orange hover:bg-viix-orange-500 disabled:opacity-60"
                                >
                                    {saving ? "Saving…" : "Save"}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

                {/* General settings */}
                <div className="px-6 py-8 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 gap-6">
                    {/* Project ID */}
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project ID
                        </label>
                        <div className="flex items-center gap-3">
                            <code className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 border border-gray-200 flex-1">
                                {project.id}
                            </code>
                            <button
                                onClick={copyProjectId}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>

                    {/* Name */}
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={!isEditing}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 disabled:bg-gray-50"
                            placeholder="Project name"
                        />
                    </div>

                    {/* Description below name with larger box */}
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description ?? ""}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={!isEditing}
                            rows={5}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 disabled:bg-gray-50"
                            placeholder="Optional description"
                        />
                    </div>

                    {/* Settings JSON */}
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Settings (JSON)
                        </label>
                        <textarea
                            value={settingsText}
                            onChange={(e) => setSettingsText(e.target.value)}
                            disabled={!isEditing}
                            rows={12}
                            className="w-full rounded-lg border border-gray-200 bg-slate-900 text-slate-100 font-mono text-sm p-4 disabled:opacity-80"
                            placeholder="{ }"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            No settings yet — you can store arbitrary configuration here as JSON.
                        </p>
                    </div>

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {error}
                    </div>
                )}
                </div>
                </div>

            {/* Danger zone only */}
            <div className="px-6 pb-8 max-w-4xl mx-auto">
                <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-red-900">Danger zone</h3>
                            <p className="text-sm text-red-700">
                                Delete project and all associated data.
                            </p>
                        </div>
                        <button
                            onClick={deleteProject}
                            disabled={!canEdit}
                            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                                canEdit
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-red-300 cursor-not-allowed"
                            }`}
                        >
                            Delete project
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsViewer;
