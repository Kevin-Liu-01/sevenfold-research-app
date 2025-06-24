import React, { useState } from 'react';

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

const SearchViewer: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/search/papers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: 20 }),
      });
      if (!response.ok) {
        console.error('Search API error', await response.text());
        setResults([]);
      } else {
        const data = await response.json();
        setResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const hasResults = results.length > 0;

  return (
    <div
      className={`min-h-screen bg-gray-50 transition-all duration-300 
        ${hasResults ? 'flex flex-col items-center pt-8 pb-8' : 'flex items-center justify-center'}`
      }
    >
      <form
        onSubmit={handleSearch}
        className={`transition-all duration-300 ${hasResults ? 'w-full px-4 max-w-xl' : 'w-3/4 max-w-lg'}`}
      >
        <input
          type="text"
          placeholder="Ask anything..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className={`w-full rounded-full border border-gray-300 bg-white px-4 py-3 text-gray-700 
            focus:outline-none focus:ring-2 focus:ring-blue-400
          `}
        />
      </form>

      {loading && (
        <div className="mt-4 text-gray-500">Searching...</div>
      )}

      {hasResults && (
        <div className="mt-6 w-full px-4 max-w-3xl space-y-6 overflow-auto">
          {results.map(paper => (
            <div
              key={paper.paperId}
              className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <a
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-blue-600 hover:underline"
              >
                {paper.title}
              </a>
              {paper.authors && (
                <p className="mt-1 text-sm text-gray-600">
                  {paper.authors.map(a => a.name).join(', ')}{paper.year ? ` • ${paper.year}` : ''}
                </p>
              )}
              {paper.abstract && (
                <p className="mt-2 text-gray-700 text-sm line-clamp-3">
                  {paper.abstract}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchViewer;
