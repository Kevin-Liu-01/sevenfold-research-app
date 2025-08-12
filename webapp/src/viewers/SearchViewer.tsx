// src/components/viewers/SearchViewer.tsx
import React, { useState, useEffect, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useWorkbench } from "../context/WorkbenchContext";
import supabase from "../auth/supabaseClient";

import PaperDetailsModal from "./PaperDetailsModal";

interface Paper {
    id: string;
    paper_id: string;
    title: string;
    abstract?: string;
    year?: number;
    authors?: string[];
    pdf_uri?: string;
    doi?: string;
}

const SearchBox: React.FC<{
    query: string;
    onQueryChange: (q: string) => void;
    onSubmit: (e: FormEvent) => void;
    loading: boolean;
}> = ({ query, onQueryChange, onSubmit, loading }) => {

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const form = e.currentTarget.form;
            if (form) {
                form.requestSubmit();
            }
        }
    };

    return (
        <div className="flex flex-col space-y-1 max-w-2xl w-full">
            <h1 className="text-2xl font-semibold mb-4 text-gray-700">
                What Will You Discover Today?
            </h1>
            <form onSubmit={onSubmit} className="flex-1">
                <label className="sr-only">Search for papers</label>
                <div className="relative">
                    <textarea
                        rows={4}
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search for papers…"
                        className={`
                            w-full resize-none rounded-md border border-gray-300
                            px-3 py-2 pr-10 text-gray-700 placeholder-gray-400
                            focus:outline-none focus:ring-2 focus:ring-kets-yellow
                        `}
                    />
                    {loading && (
                        <span className="material-icons animate-spin absolute top-3 right-3 text-gray-400">
                            hourglass_empty
                        </span>
                    )}
                    <button
                        type="submit"
                        className="absolute bottom-3 right-2 p-1 bg-kets-green hover:bg-green-400 text-black rounded-lg w-8 h-8 justify-center items-center"
                        aria-label="Submit search"
                    >
                        <span className="material-icons text-base">arrow_forward</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

const YearFilter: React.FC<{
    year: number | "";
    onYearChange: (y: number | "") => void;
}> = ({ year, onYearChange }) => {
    const current = new Date().getFullYear();
    return (
        <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-gray-500">Since Year</span>
            <div className="flex space-x-2">
                {[1, 5].map((n) => {
                    const val = current - n;
                    return (
                        <button
                            key={n}
                            type="button"
                            onClick={() => onYearChange(val)}
                            className={`px-2 py-1 text-sm rounded ${year === val
                                ? "bg-gray-800 text-white"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                }`}
                        >
                            {n}Y
                        </button>
                    );
                })}
                <button
                    type="button"
                    onClick={() => onYearChange("")}
                    className={`px-2 py-1 text-sm rounded ${year === ""
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                >
                    Custom
                </button>
            </div>
            <input
                type="number"
                max={current}
                value={year}
                onChange={(e) =>
                    onYearChange(e.target.value === "" ? "" : +e.target.value)
                }
                placeholder="e.g. 2018"
                className="border border-gray-300 rounded-md px-2 py-1 mt-2 text-sm focus:outline-none focus:ring-2 focus:ring-kets-yellow"
            />
        </div>
    );
};

type Preset = "OFF" | "L" | "M" | "H";
const WeightTabs: React.FC<{
    label: string;
    preset: Preset;
    onChange: (p: Preset) => void;
}> = ({ label, preset, onChange }) => (
    <div className="flex flex-col space-y-1">
        <span className="text-sm font-medium text-gray-500">{label} Weight</span>
        <div className="flex space-x-2">
            {(["OFF", "L", "M", "H"] as Preset[]).map((p) => (
                <button
                    key={p}
                    type="button"
                    onClick={() => onChange(p)}
                    className={`px-5 py-3/4 text-sm rounded ${preset === p
                        ? "bg-kets-orange-400 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                >
                    {p}
                </button>
            ))}
        </div>
    </div>
);


const ResultsList: React.FC<{ 
    results: Paper[];
    onPaperClick: (paper: Paper) => void;
}> = ({ results, onPaperClick }) => (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {results.map((paper) => (
            <div
                key={paper.paper_id}
                onClick={onPaperClick}
                className="p-4 rounded-md shadow-sm space-y-1"
            >
                <a
                    href={paper.pdf_uri}
                    className="block text-lg font-semibold text-blue-800 hover:underline"
                >
                    {paper.title}
                </a>
                <div className="text-sm text-gray-600 flex flex-wrap items-center gap-1">
                    {paper.year && <span>{paper.year} •</span>}
                    {paper.authors && (
                        <span>{paper.authors.join(", ")}</span>
                    )}
                </div>
                {paper.abstract && (
                    <p className="text-gray-700 line-clamp-3 text-sm">
                        {paper.abstract}
                    </p>
                )}
            </div>
        ))}
        {results.length === 0 && (
            <p className="text-center text-gray-500 mt-8">No papers found.</p>
        )}
    </div>
);

const SearchViewer: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get("q") ?? "");
    const [results, setResults] = useState<Paper[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Modal state
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

    // Get workbench context for project management
    const { refreshPapers } = useWorkbench();

    // filters state
    const [yearFilter, setYearFilter] = useState<number | "">("");
    const [kwPreset, setKwPreset] = useState<Preset>("M");
    const [semPreset, setSemPreset] = useState<Preset>("M");
    const [ctxPreset, setCtxPreset] = useState<Preset>("M");

    const kwPresetVals: Record<Preset, number> = { OFF: 0.1, L: 0.3, M: 0.7, H: 1.0 };
    const semPresetVals: Record<Preset, number> = { OFF: 0.0, L: 0.2, M: 0.5, H: 0.9 };
    const ctxPresetVals: Record<Preset, number> = { OFF: 0.0, L: 0.1, M: 0.5, H: 0.9 };

    const doSearch = async () => {
        setLoading(true);
        setSearchParams({ q: query });
        try {
            const payload = {
                query: query.trim(),
                match_count: 30,
                lexical_weight: kwPresetVals[kwPreset],
                semantic_weight: semPresetVals[semPreset],
                context_weight: ctxPresetVals[ctxPreset],
                ...(yearFilter !== "" && { min_year: yearFilter }),
            };
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/search/`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );
            if (!res.ok) throw new Error(await res.text());
            const data: Paper[] = await res.json();
            setResults(data);
        } catch (err) {
            console.error(err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        doSearch();
    };

    const handlePaperClick = (paper: Paper) => {
        setSelectedPaper(paper);
    };

    const handleCloseModal = () => {
        setSelectedPaper(null);
    };

    const handleAddToProject = async (paper: Paper) => {
        try {
            // Get auth session from Supabase
            const { data, error: authErr } = await supabase.auth.getSession();
            if (authErr || !data?.session?.access_token) {
                throw new Error('No auth session found');
            }

            // Get project ID from URL or context
            const urlParams = new URLSearchParams(window.location.search);
            const projectId = urlParams.get('project') || window.location.pathname.split('/').pop();
            
            if (!projectId) {
                throw new Error('No project ID found');
            }

            if (!paper.pdf_uri) {
                throw new Error('No PDF URI available for this paper');
            }

            // Create FormData for copy-from-library endpoint
            const formData = new FormData();
            formData.append('pdf_uri', paper.pdf_uri);
            formData.append('project_id', projectId);
            formData.append('paper_type', 'candidate');
            formData.append('filename', `${paper.title || paper.paper_id}.pdf`);

            // Use the new copy-from-library endpoint
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/papers/copy-from-library`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${data.session.access_token}`,
                    },
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to add paper: ${errorData.detail || 'Unknown error'}`);
            }

            // Refresh papers in the workbench
            await refreshPapers();
            
            // Close modal and show success
            setSelectedPaper(null);
            console.log('Paper added to project successfully!');
            
        } catch (error) {
            console.error("Failed to add paper to project:", error);
            throw error; // Re-throw so the modal can handle the error state
        }
    };

    useEffect(() => { if (query) doSearch(); }, []);

    return (
        <div className="flex flex-col h-screen p-6">
            <div className="flex flex-row gap-8 p-3 mb-4 border-b border-gray-200">
                <SearchBox
                    query={query}
                    onQueryChange={setQuery}
                    onSubmit={handleSubmit}
                    loading={loading}
                />

                <div className="flex flex-col justify-between p-1">
                    <WeightTabs
                        label="Keyword"
                        preset={kwPreset}
                        onChange={setKwPreset}
                    />
                    <WeightTabs
                        label="Semantic"
                        preset={semPreset}
                        onChange={setSemPreset}
                    />
                    <WeightTabs
                        label="Context"
                        preset={ctxPreset}
                        onChange={setCtxPreset}
                    />
                </div>
                <div className="flex flex-col justify-between p-1">
                    <YearFilter year={yearFilter} onYearChange={setYearFilter} />
                    <button
                        onClick={doSearch}
                        className="mt-2 bg-gray-800 text-white px-4 py-2 rounded hover:bg-kets-green-dark transition"
                        disabled={loading || !query.trim()}
                    >
                        Apply Filters
                    </button>
                </div>
            </div>

            <ResultsList results={results} onPaperClick={handlePaperClick} />
            
            <PaperDetailsModal 
                paper={selectedPaper}
                onClose={handleCloseModal}
                onAddToProject={handleAddToProject}
            />
        </div>
    );
};

export default SearchViewer;
