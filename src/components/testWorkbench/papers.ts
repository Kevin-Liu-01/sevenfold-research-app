export interface Paper {
  title: string;
  authors: string[];
  summary: string;
  url: string;
  date: string;
}

export const papers: Paper[] = [
  {
    title: "MapReduce: Simplified Data Processing on Large Clusters",
    authors: ["Jeffrey Dean", "Sanjay Ghemawat"],
    summary:
      "Describes the MapReduce programming model and its implementation for processing large data sets in parallel.",
    url: "https://static.googleusercontent.com/media/research.google.com/en//archive/mapreduce-osdi04.pdf",
    date: "2008-12-01",
  },
  {
    title: "The Google File System",
    authors: ["Sanjay Ghemawat", "Howard Gobioff", "Shun-Tak Leung"],
    summary:
      "Introduces a scalable distributed file system for large distributed data-intensive applications.",
    url: "https://raw.githubusercontent.com/papers-we-love/papers-we-love/master/papers/google-filesystem.pdf",
    date: "2003-10-01",
  },
  {
    title: "Bigtable: A Distributed Storage System for Structured Data",
    authors: ["Fay Chang", "Jeffrey Dean", "Sanjay Ghemawat", "et al."],
    summary:
      "Presents Bigtable, a distributed storage system that manages structured data at petabyte scale.",
    url: "https://raw.githubusercontent.com/papers-we-love/papers-we-love/master/papers/bigtable.pdf",
    date: "2006-04-01",
  },
];
