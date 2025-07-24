// src/components/viewers/SearchViewer.tsx
import React, { useState, useEffect, FormEvent, DragEvent } from "react";
import { useSearchParams } from "react-router-dom";

//
// Data interfaces
//
interface Author {
  authorId: string;
  name: string;
}

interface Paper {
  paperId: string;
  title: string;
  abstract?: string;
  year?: number;
  url?: string;
  authors?: Author[];
}

//
// Search bar at top
//
interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSubmit: (e: FormEvent) => void;
  loading: boolean;
}
const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  onSubmit,
  loading,
}) => (
  <div className="max-w-2xl w-full mx-auto px-6">
    <div className="flex justify-center mb-4">
      <img
        src="/images/Ketspen_logo.png"
        alt="Ketspen Logo"
        className="h-12 object-contain"
      />
    </div>
    <form onSubmit={onSubmit} className="flex flex-col space-y-4">
      <div className="relative">
        <span className="material-icons absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          search
        </span>
        <input
          type="text"
          placeholder="Search for papers…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className={`
            w-full rounded-full border border-gray-300
            bg-white bg-opacity-90
            px-5 py-4 pl-12 text-gray-700 placeholder-gray-400
            focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-300
            transition
          `}
        />
      </div>
      {loading && (
        <div className="flex items-center text-gray-500">
          <span className="material-icons animate-spin mr-2">
            hourglass_empty
          </span>
          Searching…
        </div>
      )}
    </form>
  </div>
);

//
// Sidebar filters (year, weights, agent, apply button)
//
interface FiltersProps {
  yearFilter: number | "";
  onYearChange: (y: number | "") => void;
  keywordWeight: number;
  semanticWeight: number;
  contextWeight: number;
  onWeightsChange: (kw: number, sw: number, cw: number) => void;
  agent: "none" | "theta" | "phi";
  onAgentChange: (a: "none" | "theta" | "phi") => void;
  onApplyFilters: () => void;
}
const SidebarFilters: React.FC<FiltersProps> = ({
  yearFilter,
  onYearChange,
  keywordWeight,
  semanticWeight,
  contextWeight,
  onWeightsChange,
  agent,
  onAgentChange,
  onApplyFilters,
}) => (
  <aside className="relative w-64">
    <div className="fixed w-64 border-r border-gray-200 p-6 space-y-6">
      {/* Year filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Since Year
        </label>
        <input
          type="number"
          min={1900}
          max={new Date().getFullYear()}
          value={yearFilter}
          onChange={(e) =>
            onYearChange(e.target.value === "" ? "" : +e.target.value)
          }
          placeholder="e.g. 2018"
          className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </div>

      {/* Weights sliders */}
      {[
        { label: "Keyword", value: keywordWeight },
        { label: "Semantic", value: semanticWeight },
        { label: "Context", value: contextWeight },
      ].map(({ label, value }, idx) => (
        <div key={label}>
          <label className="block text-sm font-medium text-gray-700">
            {label} Weight ({value.toFixed(2)})
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={value}
            onChange={(e) => {
              const v = +e.target.value;
              const vals = [keywordWeight, semanticWeight, contextWeight];
              vals[idx] = v;
              onWeightsChange(vals[0], vals[1], vals[2]);
            }}
            className="w-full mt-1"
          />
        </div>
      ))}

      {/* Agent toggle */}
      <div>
        <div className="text-sm font-medium text-gray-700">LLM Agent</div>
        <div className="flex space-x-2 mt-2">
          {(
            [
              { id: "none", icon: "∅" },
              { id: "theta", icon: "θ" },
              { id: "phi", icon: "φ" },
            ] as const
          ).map(({ id, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onAgentChange(id)}
              className={`
                flex-1 py-2 rounded text-lg
                ${
                  agent === id
                    ? "bg-blue-100 text-blue-800"
                    : "hover:bg-gray-100 text-gray-700"
                }
              `}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Apply filters */}
      <button
        type="button"
        onClick={onApplyFilters}
        className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Apply Filters
      </button>
    </div>
  </aside>
);

interface ResultCardProps {
  paper: Paper;
}
const ResultCard: React.FC<ResultCardProps> = ({ paper }) => (
  <div key={paper.paperId}>
    <a className="text-base font-medium text-blue-800 hover:underline">
      <a href={paper.url}>{paper.title}</a>
    </a>
    <div className="mt-1 text-sm text-gray-600 flex flex-wrap items-center space-x-1">
      {(paper.authors || paper.year) && (
        <div className="flex items-center space-x-2">
          {paper.authors && (
            <div className="flex items-center space-x-2">
              <span className="material-icons text-base">person</span>
              <span>{paper.authors.map((a) => a).join(", ")}</span>
            </div>
          )}
          {paper.year && <div className="ml-1">• {paper.year}</div>}
        </div>
      )}
    </div>
    {paper.abstract && (
      <p className="mt-1 text-sm text-gray-700 line-clamp-3">
        {paper.abstract}
      </p>
    )}
  </div>
);

//
// Results list
//
interface ResultsProps {
  results: Paper[];
}
const ResultsList: React.FC<ResultsProps> = ({ results }) => (
  <main className="flex-1 overflow-y-auto py-6">
    <div className="max-w-4xl mx-auto space-y-6 px-6">
      {results.map((paper) => (
        <ResultCard key={paper.paperId} paper={paper} />
      ))}
      {results.length === 0 && (
        <p className="text-center text-gray-500">No papers found.</p>
      )}
    </div>
  </main>
);

//
// Main viewer
//
const SearchViewer: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);

  const [yearFilter, setYearFilter] = useState<number | "">("");
  const [keywordWeight, setKeywordWeight] = useState(0.33);
  const [semanticWeight, setSemanticWeight] = useState(0.33);
  const [contextWeight, setContextWeight] = useState(0.34);
  const [agent, setAgent] = useState<"none" | "theta" | "phi">("none");

  const doSearch = async (searchQuery: string) => {
    setLoading(true);
    setSearchParams({ q: searchQuery });

    try {
      const body = {
        query: searchQuery.trim(),
        limit: 20,
        ...(yearFilter !== "" && { year: yearFilter }),
        weights: {
          keyword: keywordWeight,
          semantic: semanticWeight,
          context: contextWeight,
        },
        agent,
      };

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/search/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: Paper[] = await res.json();

      const filtered = data.filter((p) =>
        yearFilter === "" ? true : !!p.year && p.year >= Number(yearFilter)
      );
      setResults(filtered);
      console.log(filtered);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) doSearch(query);
  };

  useEffect(() => {
    const initial = searchParams.get("q");
    if (initial) {
      setQuery(initial);
      doSearch(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasResults = results.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {!hasResults ? (
        <div className="flex items-center justify-center min-h-screen">
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            onSubmit={handleSearch}
            loading={loading}
          />
        </div>
      ) : (
        <>
          <header className="sticky top-0 z-10 bg-white bg-opacity-80 backdrop-blur-lg border-b border-gray-200 py-4">
            <SearchBar
              query={query}
              onQueryChange={setQuery}
              onSubmit={handleSearch}
              loading={loading}
            />
          </header>
          <div className="flex">
            <SidebarFilters
              yearFilter={yearFilter}
              onYearChange={setYearFilter}
              keywordWeight={keywordWeight}
              semanticWeight={semanticWeight}
              contextWeight={contextWeight}
              onWeightsChange={(kw, sw, cw) => {
                setKeywordWeight(kw);
                setSemanticWeight(sw);
                setContextWeight(cw);
              }}
              agent={agent}
              onAgentChange={setAgent}
              onApplyFilters={() => doSearch(query)}
            />
            <ResultsList results={results} />
          </div>
        </>
      )}
    </div>
  );
};

export default SearchViewer;
