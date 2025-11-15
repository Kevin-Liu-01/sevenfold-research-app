export interface EditOperation {
    type: "insert" | "delete" | "replace";
    start_line: number;
    end_line: number;
    old_text?: string;
    new_text?: string;
}

export interface EditProposal {
    id: string;
    section_name: string;
    operations: EditOperation[];
    rationale: string;
    status: "pending" | "accepted" | "rejected";
}

export interface SearchResult {
    composition_title: string;
    composition_id: string;
    start_line: number;
    end_line: number;
    similarity: number;
    chunk_text: string;
}

export interface SearchResultsData {
    query: string;
    results: SearchResult[];
}
