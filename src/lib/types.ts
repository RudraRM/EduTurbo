export type SourceType =
  | "pdf"
  | "docx"
  | "pptx"
  | "txt"
  | "image"
  | "audio"
  | "video"
  | "youtube";

export type DocumentStatus = "processing" | "ready" | "error";

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Doc {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  source_type: SourceType;
  source_url: string | null;
  file_path: string | null;
  file_size: number | null;
  status: DocumentStatus;
  error_message: string | null;
  extracted_text: string | null;
  favorite: boolean;
  tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
  last_opened_at: string | null;
}

export interface Note {
  id: string;
  document_id: string;
  user_id: string;
  content_html: string;
  updated_at: string;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  document_id: string;
  user_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

export interface Flashcard {
  id: string;
  document_id: string;
  user_id: string;
  front: string;
  back: string;
  position: number;
}

export type QuizKind = "mcq" | "true_false" | "fill_blank" | "short_answer";

export interface QuizQuestion {
  question: string;
  /** MCQ only */
  options?: string[];
  /** MCQ: index into options. True/False: "true" | "false". Fill-blank & short answer: expected text. */
  answer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  document_id: string;
  user_id: string;
  kind: QuizKind;
  title: string;
  questions: QuizQuestion[];
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  document_ids: string[];
}

export const SOURCE_LABEL: Record<SourceType, string> = {
  pdf: "PDF",
  docx: "Word",
  pptx: "Slides",
  txt: "Text",
  image: "Image",
  audio: "Audio",
  video: "Video",
  youtube: "YouTube",
};

export const FOLDER_COLORS = [
  { name: "Violet", value: "violet" },
  { name: "Sky", value: "sky" },
  { name: "Mint", value: "mint" },
  { name: "Peach", value: "peach" },
  { name: "Rose", value: "rose" },
  { name: "Amber", value: "amber" },
] as const;

export type FolderColor = (typeof FOLDER_COLORS)[number]["value"];
