import React, { useState, useContext } from "react";
import { papers, type Paper } from "./papers";
import { ResearchContext } from "../../context/ResearchContext";

const SearchWindow: React.FC = () => {
  const { setPdfUrl } = useContext(ResearchContext);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"Relevance" | "Date">("Relevance");
  const [filters, setFilters] = useState({
    author: "All",
    tags: "",
    dateFrom: "",
    dateTo: "",
  });

  const authors = Array.from(new Set(papers.flatMap((p) => p.authors)));
  let results = papers.filter((p) => {
    const byQ =
      !query ||
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.summary.toLowerCase().includes(query.toLowerCase());
    const byA = filters.author === "All" || p.authors.includes(filters.author);
    const byT =
      !filters.tags ||
      p.summary.toLowerCase().includes(filters.tags.toLowerCase());
    const byF = !filters.dateFrom || p.date >= filters.dateFrom;
    const byT2 = !filters.dateTo || p.date <= filters.dateTo;
    return byQ && byA && byT && byF && byT2;
  });
  if (sortBy === "Date")
    results = [...results].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="h-full bg-white flex flex-col text-xs">
      <div className="p-2 flex items-center space-x-2 border-b">
        <span className="material-icons">search</span>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="flex-1 border p-1 rounded"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="border p-1 rounded"
        >
          <option>Relevance</option>
          <option>Date</option>
        </select>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-40 p-2 bg-gray-50 border-r space-y-2">
          <div>
            <label className="block">Author</label>
            <select
              className="w-full border p-1 rounded"
              value={filters.author}
              onChange={(e) =>
                setFilters((f) => ({ ...f, author: e.target.value }))
              }
            >
              <option>All</option>
              {authors.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block">Tags</label>
            <input
              className="w-full border p-1 rounded"
              placeholder="tags"
              value={filters.tags}
              onChange={(e) =>
                setFilters((f) => ({ ...f, tags: e.target.value }))
              }
            />
          </div>
          <label className="block text-xs mb-1">Date From</label>
          <input
            type="date"
            className="w-full border rounded p-1 mb-3 text-sm"
            value={filters.dateFrom}
            onChange={(e) =>
              setFilters((f) => ({ ...f, dateFrom: e.target.value }))
            }
          />

          <label className="block text-xs mb-1">Date To</label>
          <input
            type="date"
            className="w-full border rounded p-1 text-sm"
            value={filters.dateTo}
            onChange={(e) =>
              setFilters((f) => ({ ...f, dateTo: e.target.value }))
            }
          />
        </aside>
        <main className="flex-1 p-2 overflow-auto space-y-2">
          {results.length ? (
            results.map((p) => (
              <div
                key={p.url}
                onClick={() => setPdfUrl(p.url)}
                className="p-2 border rounded hover:bg-gray-50 cursor-pointer"
              >
                <div className="font-semibold">{p.title}</div>
                <div className="text-gray-600 truncate">{p.summary}</div>
                <div className="text-gray-500 text-[10px]">
                  By {p.authors.join(", ")} | {p.date}
                </div>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener"
                  className="material-icons text-xs h-2 w-2 mt-1"
                >
                  open_in_new
                </a>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center">No results</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchWindow;
