// src/components/viewers/SearchViewer.tsx
import React, { useState, useEffect, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useWorkbench } from "../context/WorkbenchContext";
import supabase from "../auth/supabaseClient";

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
}> = ({ query, onQueryChange, onSubmit, loading }) => (
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
                    placeholder="Search for papers…"
                    className={`
                        w-full resize-none rounded-md border border-gray-300
                        px-3 py-2 pr-10 text-gray-700 placeholder-gray-400
                        focus:outline-none focus:ring-2 focus:ring-kets-yellow
                    `}
                />
                {loading && (
                    <span className="material-icons animate-spin absolute top-2 right-10 text-gray-400">
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

type Preset = "L" | "M" | "H";

const WeightTabs: React.FC<{
    label: string;
    preset: Preset;
    onChange: (p: Preset) => void;
}> = ({ label, preset, onChange }) => (
    <div className="flex flex-col space-y-1">
        <span className="text-sm font-medium text-gray-500">{label} Weight</span>
        <div className="flex space-x-2">
            {(["L", "M", "H"] as Preset[]).map((p) => (
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

const PaperModal: React.FC<{
    paper: Paper | null;
    onClose: () => void;
    onAddToProject: (paper: Paper) => void;
}> = ({ paper, onClose, onAddToProject }) => {
    const [isAddingToProject, setIsAddingToProject] = useState(false);

    if (!paper) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    const handleViewPDF = async () => {
        if (!paper.pdf_uri) {
            console.error('No PDF URI available for this paper');
            return;
        }

        try {
            // Get auth session from Supabase
            const { data, error: authErr } = await supabase.auth.getSession();
            if (authErr || !data?.session?.access_token) {
                console.error('No auth session found');
                return;
            }

            // Remove "library/" prefix if present to get the file path
            const filePath = paper.pdf_uri.replace("library/", "");
            
            // Get signed URL for the library file
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/papers/library/${filePath}/signed-url`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${data.session.access_token}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                window.open(data.signed_url, '_blank');
            } else {
                console.error('Failed to get signed URL for PDF');
            }
        } catch (error) {
            console.error('Error getting PDF URL:', error);
        }
    };

    const handleAddClick = async () => {
        setIsAddingToProject(true);
        try {
            await onAddToProject(paper);
        } finally {
            setIsAddingToProject(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
        >
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 pr-4">
                            {paper.title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                            aria-label="Close modal"
                        >
                            <span className="material-icons">close</span>
                        </button>
                    </div>

                    {/* Authors and Year */}
                    <div className="text-sm text-gray-600 mb-4 flex flex-wrap items-center gap-1">
                        {paper.year && <span className="font-medium">{paper.year}</span>}
                        {paper.year && paper.authors && <span>•</span>}
                        {paper.authors && (
                            <span>{paper.authors.join(", ")}</span>
                        )}
                    </div>

                    {/* DOI */}
                    {paper.doi && (
                        <div className="text-sm text-gray-600 mb-4">
                            <span className="font-medium">DOI: </span>
                            <a 
                                href={`https://doi.org/${paper.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                {paper.doi}
                            </a>
                        </div>
                    )}

                    {/* Abstract */}
                    {paper.abstract && (
                        <div className="mb-6">
                            <h3 className="font-medium text-gray-900 mb-2">Abstract</h3>
                            <p className="text-gray-700 leading-relaxed">
                                {paper.abstract}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            onClick={handleAddClick}
                            disabled={isAddingToProject}
                            className={`flex-1 font-medium py-2 px-4 rounded-md transition-colors ${
                                isAddingToProject 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-kets-green hover:bg-green-500 text-black'
                            }`}
                        >
                            {isAddingToProject ? 'Adding...' : 'Add to Project'}
                        </button>
                        {paper.pdf_uri && (
                            <button
                                onClick={handleViewPDF}
                                className="flex-1 font-medium py-2 px-4 rounded-md transition-colors bg-gray-100 hover:bg-gray-200 text-gray-800"
                            >
                                View PDF
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResultsList: React.FC<{ 
    results: Paper[];
    onPaperClick: (paper: Paper) => void;
}> = ({ results, onPaperClick }) => (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {results.map((paper) => (
            <div
                key={paper.paper_id}
                className="p-4 rounded-md shadow-sm space-y-1 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onPaperClick(paper)}
            >
                <h3 className="text-lg font-semibold text-blue-800 hover:underline">
                    {paper.title}
                </h3>
                <div className="text-sm text-gray-600 flex flex-wrap items-center gap-1">
                    {paper.year && <span>{paper.year} •</span>}
                    {paper.authors && (
                        <span>{paper.authors.join(", ")}</span>
                    )}
                </div>
                {paper.abstract && (
                    <p className="text-gray-700 line-clamp-3">{paper.abstract}</p>
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

    const kwPresetVals: Record<Preset, number> = { L: 0.1, M: 0.5, H: 0.9 };
    const semPresetVals: Record<Preset, number> = { L: 0.1, M: 0.5, H: 0.9 };
    const ctxPresetVals: Record<Preset, number> = { L: 0.1, M: 0.5, H: 0.9 };

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
            <div className="flex flex-row gap-8 p-3">
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
            
            <PaperModal 
                paper={selectedPaper}
                onClose={handleCloseModal}
                onAddToProject={handleAddToProject}
            />
        </div>
    );
};

export default SearchViewer;