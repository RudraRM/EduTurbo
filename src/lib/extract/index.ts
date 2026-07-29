import type { SourceType } from "@/lib/types";
import { extractImageContent, transcribeMedia, type GenerateConfig } from "@/lib/ai/generate";

export const MAX_MEDIA_BYTES = 25 * 1024 * 1024; // Groq Whisper upload cap
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

const EXTENSION_MAP: Record<string, SourceType> = {
  pdf: "pdf",
  docx: "docx",
  doc: "docx",
  pptx: "pptx",
  txt: "txt",
  md: "txt",
  markdown: "txt",
  csv: "txt",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  gif: "image",
  mp3: "audio",
  wav: "audio",
  m4a: "audio",
  ogg: "audio",
  flac: "audio",
  mp4: "video",
  webm: "video",
  mov: "video",
  mpeg: "video",
};

export const ACCEPT_ATTRIBUTE = Object.keys(EXTENSION_MAP)
  .map((ext) => `.${ext}`)
  .join(",");

export function detectSourceType(file: File): SourceType | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MAP[ext] ?? null;
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Served from public/ (copied by scripts/copy-pdf-worker.mjs) so webpack
  // never tries to parse the ESM worker bundle.
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) pages.push(`[Page ${i}]\n${text}`);
  }

  return pages.join("\n\n");
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

async function extractPptx(file: File): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const num = (s: string) => parseInt(s.match(/slide(\d+)\.xml$/)?.[1] ?? "0", 10);
      return num(a) - num(b);
    });

  const parser = new DOMParser();
  const slides: string[] = [];

  for (let i = 0; i < slideNames.length; i++) {
    const xml = await zip.files[slideNames[i]].async("text");
    const doc = parser.parseFromString(xml, "application/xml");
    // Text runs in DrawingML live in <a:t> elements.
    const nodes = doc.getElementsByTagNameNS(
      "http://schemas.openxmlformats.org/drawingml/2006/main",
      "t"
    );
    const texts: string[] = [];
    for (let j = 0; j < nodes.length; j++) {
      const value = nodes[j].textContent?.trim();
      if (value) texts.push(value);
    }
    if (texts.length) slides.push(`[Slide ${i + 1}]\n${texts.join("\n")}`);
  }

  return slides.join("\n\n");
}

function readAsText(file: File): Promise<string> {
  return file.text();
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Extract study-ready text from an uploaded file. Runs fully client-side;
 * image description and audio/video transcription go through the user's own
 * Groq key.
 */
export async function extractFromFile(
  file: File,
  type: SourceType,
  ai: GenerateConfig
): Promise<string> {
  switch (type) {
    case "pdf":
      return extractPdf(file);
    case "docx":
      return extractDocx(file);
    case "pptx":
      return extractPptx(file);
    case "txt":
      return readAsText(file);
    case "image": {
      const dataUrl = await readAsDataURL(file);
      return extractImageContent(ai, dataUrl);
    }
    case "audio":
    case "video": {
      if (file.size > MAX_MEDIA_BYTES) {
        throw new Error(
          "Audio and video files are limited to 25 MB for transcription. Try a shorter clip or compress it first."
        );
      }
      return transcribeMedia(ai, file);
    }
    default:
      throw new Error("Unsupported file type.");
  }
}

export interface YouTubeImport {
  videoId: string;
  title: string;
  transcript: string;
}

export async function fetchYouTube(url: string): Promise<YouTubeImport> {
  const response = await fetch(`/api/youtube?url=${encodeURIComponent(url)}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error ?? "Could not import this YouTube video.");
  }
  return data as YouTubeImport;
}
