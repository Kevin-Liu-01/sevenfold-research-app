import React, { useState } from "react";
import type { SearchResultsData } from "../../types/compose";

interface SearchResultsSummaryProps {
    searchData: SearchResultsData;
    onResultClick?: (compositionId: string, line: number) => void;
}

const SearchResultsSummary: React.FC<SearchResultsSummaryProps> = ({ searchData, onResultClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-purple-50 border border-purple-200 rounded-lg mt-2 text-xs overflow-hidden">
            <div
                className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-purple-100 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <span className="material-icons text-sm text-purple-700">search</span>
                    <span className="text-purple-900 font-medium">
                        {searchData.results.length} result
                        {searchData.results.length !== 1 ? "s" : ""} for "{searchData.query}"
                    </span>
                </div>
                <span className="material-icons text-sm text-purple-700">
                    {isExpanded ? "expand_less" : "expand_more"}
                </span>
            </div>

            {isExpanded && (
                <div className="border-t border-purple-200 bg-white max-h-64 overflow-y-auto">
                    {searchData.results.map((result, idx) => (
                        <div
                            key={idx}
                            className="px-3 py-2 border-b border-purple-100 last:border-b-0 hover:bg-purple-50 cursor-pointer transition-colors"
                            onClick={() => onResultClick?.(result.composition_id, result.start_line)}
                        >
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <span className="material-icons text-xs text-purple-600">description</span>
                                    <span className="font-medium text-purple-900 truncate">
                                        {result.composition_title}
                                    </span>
                                    <span className="text-purple-600 text-[10px] flex-shrink-0">
                                        Lines {result.start_line}-{result.end_line}
                                    </span>
                                </div>
                                <span className="text-[10px] text-purple-700 font-semibold bg-purple-100 px-1.5 py-0.5 rounded flex-shrink-0">
                                    {(result.similarity * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div className="text-[11px] text-gray-600 line-clamp-2 font-mono bg-gray-50 px-2 py-1 rounded">
                                {result.chunk_text}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchResultsSummary;
