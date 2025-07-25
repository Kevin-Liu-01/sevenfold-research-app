export interface Paper {
  id: string;
  project_id: string;
  file_url: string;
  filename: string;
  type: 'source' | 'candidate';
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  research_question: string;
  keywords: string[];
  created_at: string;
}