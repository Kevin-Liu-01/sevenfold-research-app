import React, { useState, useEffect, useMemo, useCallback, useRef, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useWorkbench } from "../context/WorkbenchContext";

import type { Paper } from "../../../schema/db-types";
import { usePersistentState } from "../hooks/usePersistentState";

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
                            focus:outline-none focus:ring-2 focus:ring-viix-yellow
                        `}
                    />
                    {loading && (
                        <span className="material-icons animate-spin absolute top-3 right-3 text-gray-400">
                            hourglass_empty
                        </span>
                    )}
                    <button
                        type="submit"
                        className="absolute bottom-3 right-2 p-1 bg-viix-green hover:bg-green-400 text-black rounded-lg w-8 h-8 justify-center items-center"
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
                            className={`px-2 py-1 text-sm rounded ${
                                year === val
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
                    className={`px-2 py-1 text-sm rounded ${
                        year === ""
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
                onChange={(e) => onYearChange(e.target.value === "" ? "" : +e.target.value)}
                placeholder="e.g. 2018"
                className="border border-gray-300 rounded-md px-2 py-1 mt-2 text-sm focus:outline-none focus:ring-2 focus:ring-viix-yellow"
            />
        </div>
    );
};

type Preset = "OFF" | "L" | "M" | "H";
const WeightTabs: React.FC<{
    label: string;
    preset: Preset;
    onChange: (p: Preset) => void;
    tooltip?: string;
}> = ({ label, preset, onChange, tooltip }) => (
    <div className="flex flex-col space-y-1">
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">{label}</span>
            {tooltip && (
                <span className="relative inline-flex group">
                    <button
                        type="button"
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-viix-yellow"
                        aria-label={`About ${label.toLowerCase()} search`}
                    >
                        ?
                    </button>
                    <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-52 -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block group-focus-within:block">
                        {tooltip}
                    </span>
                </span>
            )}
        </div>
        <div className="flex space-x-2">
            {(["OFF", "L", "M", "H"] as Preset[]).map((p) => (
                <button
                    key={p}
                    type="button"
                    onClick={() => onChange(p)}
                    className={`px-5 py-3/4 text-sm rounded ${
                        preset === p
                            ? "bg-viix-orange-400 text-white"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                >
                    {p}
                </button>
            ))}
        </div>
    </div>
);

const PaperDetailPanel: React.FC<{
    paper: Paper | null;
}> = ({ paper }) => {
    const truncateAuthors = (authors: string[], maxAuthors: number = 10): string => {
        if (!authors || authors.length === 0) return "";
        if (authors.length <= maxAuthors) {
            return authors.join(", ");
        }
        return `${authors.slice(0, maxAuthors).join(", ")} et al. (+${authors.length - maxAuthors} more)`;
    };

    const dateStr = useMemo(() => {
        if (!paper) return null;
        const y = paper.year != null ? String(paper.year) : "";
        const m = paper.month ? String(paper.month).padStart(2, "0") : "";
        const d = paper.day ? String(paper.day).padStart(2, "0") : "";
        return [y, m, d].filter(Boolean).join("-") || null;
    }, [paper?.year, paper?.month, paper?.day]);

    const handleGoToPaper = () => {
        if (paper?.doi) {
            window.open(`https://doi.org/${paper.doi}`, "_blank", "noopener,noreferrer");
        }
    };

    if (!paper) {
        return (
            <div className="w-[420px] border-l border-gray-200 p-6 flex items-center justify-center">
                <p className="text-gray-400 text-center text-sm">
                    Click a search result to learn more about it
                </p>
            </div>
        );
    }

    return (
        <div className="w-[420px] border-l border-gray-200 p-6 overflow-y-auto">
            {/* Action Button at Top */}
            {paper.doi && (
                <button
                    onClick={handleGoToPaper}
                    className="w-full px-4 py-2 text-sm flex items-center justify-center gap-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition mb-6"
                >
                    <span className="material-icons text-sm">open_in_new</span>
                    Go to Paper
                </button>
            )}

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 leading-snug mb-4">
                {paper.title}
            </h3>

            {/* Meta Information */}
            <div className="space-y-2 text-sm text-gray-700 mb-6">
                {!!paper.authors?.length && (
                    <div>
                        <span className="font-semibold text-gray-900">Authors:</span>{" "}
                        {truncateAuthors(paper.authors)}
                    </div>
                )}
                {dateStr && (
                    <div>
                        <span className="font-semibold text-gray-900">Date:</span> {dateStr}
                    </div>
                )}
                {paper.category && (
                    <div>
                        <span className="font-semibold text-gray-900">Category:</span> {paper.category}
                    </div>
                )}
                {paper.doi && (
                    <div>
                        <span className="font-semibold text-gray-900">DOI:</span>{" "}
                        <a
                            href={`https://doi.org/${paper.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-viix-orange hover:underline break-all"
                        >
                            {paper.doi}
                        </a>
                    </div>
                )}
            </div>

            {/* Abstract */}
            {paper.abstract && (
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                        Abstract
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        {paper.abstract}
                    </p>
                </div>
            )}
        </div>
    );
};

const ResultsList: React.FC<{
    results: Paper[];
    selectedPaper: Paper | null;
    onPaperClick: (paper: Paper) => void;
}> = ({ results, selectedPaper, onPaperClick }) => {
    // Helper function to truncate authors list
    const truncateAuthors = (authors: string[], maxAuthors: number = 10): string => {
        if (!authors || authors.length === 0) return "";
        if (authors.length <= maxAuthors) {
            return authors.join(', ');
        }
        return `${authors.slice(0, maxAuthors).join(', ')} et al.`;
    };
    
    return (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {results.map((paper) => {
                const isSelected = selectedPaper?.id === paper.id;
                return (
                    <div
                        key={paper.id}
                        onClick={() => onPaperClick(paper)}
                        className={`p-3 rounded-md shadow-sm cursor-pointer transition ${
                            isSelected
                                ? "bg-viix-orange-50 border-2 border-viix-orange-400"
                                : "hover:bg-gray-50 border-2 border-transparent"
                        }`}
                    >
                        <h3 className="text-base font-semibold text-gray-900 leading-tight mb-1">
                            {paper.title}
                        </h3>
                        <div className="text-sm text-gray-600 flex flex-wrap items-center gap-1 mb-1">
                            {paper.year && <span>{paper.year} •</span>}
                            {paper.authors && <span>{truncateAuthors(paper.authors)}</span>}
                        </div>
                        {paper.abstract && (
                            <p className="text-gray-700 line-clamp-2 text-sm leading-tight">{paper.abstract}</p>
                        )}
                    </div>
                );
            })}
            {results.length === 0 && <p className="text-center text-gray-500 mt-8">No papers found.</p>}
        </div>
    );
};

const SearchViewer: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { projectId } = useWorkbench();

    const storagePrefix = projectId ? `workbench:${projectId}:search` : "workbench:search";

    const [storedQuery, setStoredQuery] = usePersistentState<string>(`${storagePrefix}:query`, "");
    const [results, setResults] = usePersistentState<Paper[]>(`${storagePrefix}:results`, []);
    const [selectedPaperId, setSelectedPaperId] = usePersistentState<string | null>(
        `${storagePrefix}:selectedPaperId`,
        null
    );
    const [yearFilter, setYearFilter] = usePersistentState<number | "">(
        `${storagePrefix}:yearFilter`,
        ""
    );
    const [kwPreset, setKwPreset] = usePersistentState<Preset>(`${storagePrefix}:kwPreset`, "M");
    const [semPreset, setSemPreset] = usePersistentState<Preset>(`${storagePrefix}:semPreset`, "L");
    const [ctxPreset, setCtxPreset] = usePersistentState<Preset>(`${storagePrefix}:ctxPreset`, "OFF");

    const [query, setQueryState] = useState(searchParams.get("q") ?? storedQuery);
    const [loading, setLoading] = useState(false);
    const initRef = useRef(false);

    const setQuery = useCallback(
        (value: string) => {
            setQueryState(value);
            setStoredQuery(value);
        },
        [setStoredQuery]
    );

    const selectedPaper = useMemo(() => {
        if (!selectedPaperId) return null;
        return results.find((paper) => paper.id === selectedPaperId) ?? null;
    }, [results, selectedPaperId]);

    const kwPresetVals: Record<Preset, number> = { OFF: 0.1, L: 0.3, M: 0.7, H: 1.0 };
    const semPresetVals: Record<Preset, number> = { OFF: 0.0, L: 0.2, M: 0.5, H: 0.9 };
    const ctxPresetVals: Record<Preset, number> = { OFF: 0.0, L: 0.1, M: 0.5, H: 0.9 };

    const doSearch = useCallback(
        async (overrideQuery?: string) => {
            const activeQuery = (overrideQuery ?? query).trim();
            if (!activeQuery) {
                setResults([]);
                setSelectedPaperId(null);
                setStoredQuery("");
                setSearchParams({}, { replace: true });
                return;
            }

            if (!projectId) {
                setStoredQuery(activeQuery);
                setSearchParams({ q: activeQuery }, { replace: true });
                return;
            }

            setLoading(true);
            setSearchParams({ q: activeQuery }, { replace: true });
            try {
                const payload = {
                    query: activeQuery,
                    project_id: projectId,
                    match_count: 30,
                    lexical_weight: kwPresetVals[kwPreset],
                    semantic_weight: semPresetVals[semPreset],
                    context_weight: ctxPresetVals[ctxPreset],
                    ...(yearFilter !== "" && { min_year: yearFilter }),
                };
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/search/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error(await res.text());
                const data: Paper[] = await res.json();
                setStoredQuery(activeQuery);
                setResults(data);
                setSelectedPaperId((prev) => {
                    if (prev && data.some((paper) => paper.id === prev)) {
                        return prev;
                    }
                    return data[0]?.id ?? null;
                });
            } catch (err) {
                console.error(err);
                setResults([]);
                setSelectedPaperId(null);
            } finally {
                setLoading(false);
            }
        },
        [
            ctxPreset,
            ctxPresetVals,
            kwPreset,
            kwPresetVals,
            projectId,
            query,
            semPreset,
            semPresetVals,
            setResults,
            setSearchParams,
            setSelectedPaperId,
            setStoredQuery,
            yearFilter,
        ]
    );

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        void doSearch();
    };

    const handlePaperClick = useCallback(
        (paper: Paper) => {
            setSelectedPaperId(paper.id);
        },
        [setSelectedPaperId]
    );

    useEffect(() => {
        if (initRef.current) {
            return;
        }
        initRef.current = true;

        const urlQuery = searchParams.get("q");
        if (urlQuery) {
            setQueryState(urlQuery);
            setStoredQuery(urlQuery);
            if (!results.length) {
                void doSearch(urlQuery);
            }
            return;
        }

        if (storedQuery) {
            setQueryState(storedQuery);
            if (!searchParams.get("q")) {
                setSearchParams({ q: storedQuery }, { replace: true });
            }
        }
    }, []);

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
                        label="Keyword Match"
                        preset={kwPreset}
                        onChange={setKwPreset}
                        tooltip="Prioritize results that include the exact words from your query."
                    />
                    <WeightTabs
                        label="Semantic Meaning"
                        preset={semPreset}
                        onChange={setSemPreset}
                        tooltip="Find papers with similar ideas, even when they use different wording."
                    />
                    <WeightTabs
                        label="Project Context"
                        preset={ctxPreset}
                        onChange={setCtxPreset}
                        tooltip="Let your current project context influence which papers appear first."
                    />
                </div>
                <div className="flex flex-col justify-between p-1">
                    <YearFilter year={yearFilter} onYearChange={setYearFilter} />
                    <button
                        onClick={() => void doSearch()}
                        className="mt-2 bg-gray-800 text-white px-4 py-2 rounded hover:bg-viix-green-dark transition"
                        disabled={loading || !query.trim()}
                    >
                        Apply Filters
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <ResultsList
                    results={results}
                    selectedPaper={selectedPaper}
                    onPaperClick={handlePaperClick}
                />
                <PaperDetailPanel paper={selectedPaper} />
            </div>
        </div>
    );
};

export default SearchViewer;
