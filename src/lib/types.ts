export type { OutputLanguage } from "@/lib/output-languages";
export type Tone = "formal" | "casual" | "opinionated";
export type OutputLength = "short" | "medium" | "long";

export type CrawlResult = {
  url: string;
  success: boolean;
  content: string;
  error?: string;
};

export type DraftRecord = {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  source_urls: string[];
  tone: Tone | null;
  length: OutputLength | null;
  created_at: string;
  updated_at: string;
};

export type ResearchSourceRecord = {
  id: string;
  user_id: string;
  url: string;
  title: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};
