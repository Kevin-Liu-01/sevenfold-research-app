// src/components/viewers/SearchViewer.tsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

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

// stubbed data — swap out for your real API later
const MOCK_RESULTS: Paper[] = [
  {
    paperId: "1",
    title: "Understanding React Hooks",
    abstract:
      "A deep dive into React Hooks, patterns and performance considerations.",
    year: 2021,
    url: "https://example.com/react-hooks",
    authors: [{ authorId: "a1", name: "Jane Doe" }],
  },
  {
    paperId: "2",
    title: "Advanced TypeScript Types",
    abstract:
      "Explores advanced TypeScript type system features for building robust applications.",
    year: 2022,
    url: "https://example.com/advanced-typescript",
    authors: [{ authorId: "a2", name: "John Smith" }],
  },
  {
    paperId: "3",
    title: "Understanding React Hooks",
    abstract:
      "A deep dive into React Hooks, patterns and performance considerations.",
    year: 2021,
    url: "https://example.com/react-hooks",
    authors: [{ authorId: "a1", name: "Jane Doe" }],
  },
  {
    paperId: "4",
    title: "Advanced TypeScript Types",
    abstract:
      "Explores advanced TypeScript type system features for building robust applications.",
    year: 2022,
    url: "https://example.com/advanced-typescript",
    authors: [{ authorId: "a2", name: "John Smith" }],
  },
  {
    paperId: "5",
    title: "Understanding React Hooks",
    abstract:
      "A deep dive into React Hooks, patterns and performance considerations.",
    year: 2021,
    url: "https://example.com/react-hooks",
    authors: [{ authorId: "a1", name: "Jane Doe" }],
  },
  {
    paperId: "6",
    title: "Advanced TypeScript Types",
    abstract:
      "Explores advanced TypeScript type system features for building robust applications.",
    year: 2022,
    url: "https://example.com/advanced-typescript",
    authors: [{ authorId: "a2", name: "John Smith" }],
  },
];

const SearchViewer: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);

  // central search routine: stubbed
  const performSearch = (searchQuery: string) => {
    setLoading(true);
    setTimeout(() => {
      setResults(MOCK_RESULTS);
      setLoading(false);
    }, 500);
    setSearchParams({ q: searchQuery });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    performSearch(trimmed);
  };

  //   const handleSearch = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!query.trim()) return;
  //   setLoading(true);
  //   try {
  //     const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/search/papers`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ query, limit: 20 }),
  //     });
  //     if (!response.ok) {
  //       console.error('Search API error', await response.text());
  //       setResults([]);
  //     } else {
  //       const data = await response.json();
  //       setResults(data);
  //     }
  //   } catch (err) {
  //     console.error(err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    const initial = searchParams.get("q");
    if (initial) {
      setQuery(initial);
      performSearch(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasResults = results.length > 0;
  const SearchCard = (
    <div className="max-w-2xl w-full mx-auto px-6">
      <div className="flex justify-center mb-4">
        <img
          src="/images/Ketspen_logo.png"
          alt="Ketspen Logo"
          className="h-12 object-contain"
        />
      </div>
      <form onSubmit={handleSearch}>
        <div className="relative">
          <span className="material-icons absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            placeholder="Search for papers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`
                w-full rounded-full border border-gray-300
                bg-white bg-opacity-90
                px-5 py-4 pl-12 text-gray-700 placeholder-gray-400
                focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-300
                transition
              `}
          />
        </div>
      </form>
      {loading && (
        <div className="mt-4 flex justify-center text-gray-500">
          <span className="material-icons animate-spin mr-2">
            hourglass_empty
          </span>
          Searching…
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {!hasResults ? (
        // initial, centered
        <div className="flex items-center justify-center min-h-screen">
          {SearchCard}
        </div>
      ) : (
        // results view
        <>
          <header className="sticky top-0 z-10 bg-white bg-opacity-80 backdrop-blur-lg border-b border-gray-200">
            <div className="py-6">{SearchCard}</div>
          </header>

          <div className="flex-1 overflow-y-auto py-6">
            <div className="max-w-2xl mx-auto flex flex-col space-y-6 px-6">
              {results.map((paper) => (
                <div
                  key={paper.paperId}
                  className="
                    bg-white bg-opacity-70 backdrop-blur-lg
                    p-6 rounded-2xl border border-gray-200
                    hover:border-blue-300 transition-colors
                  "
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <span className="material-icons text-blue-600 text-3xl">
                        article
                      </span>
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                      >
                        {paper.title}
                      </a>
                    </div>
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="material-icons text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      launch
                    </a>
                  </div>

                  {(paper.authors || paper.year) && (
                    <div className="mt-3 flex flex-wrap items-center text-gray-600 text-sm space-x-4">
                      {paper.authors && (
                        <div className="flex items-center space-x-1">
                          <span className="material-icons text-base">
                            person
                          </span>
                          <span>
                            {paper.authors.map((a) => a.name).join(", ")}
                          </span>
                        </div>
                      )}
                      {paper.year && <div>• {paper.year}</div>}
                    </div>
                  )}

                  {paper.abstract && (
                    <p className="mt-4 text-gray-700 text-sm line-clamp-4">
                      {paper.abstract}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchViewer;
