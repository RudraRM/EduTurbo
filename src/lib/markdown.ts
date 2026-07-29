import { marked } from "marked";
import TurndownService from "turndown";

marked.setOptions({ gfm: true, breaks: false });

/** Convert AI-generated Markdown into HTML for the TipTap editor. */
export function markdownToHtml(markdown: string): string {
  // Keep GFM task lists editable as TipTap task items.
  const html = marked.parse(markdown, { async: false }) as string;
  return html
    .replaceAll('<input checked="" disabled="" type="checkbox">', "")
    .replaceAll('<input disabled="" type="checkbox">', "");
}

let turndown: TurndownService | null = null;

function getTurndown(): TurndownService {
  if (!turndown) {
    turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
      emDelimiter: "*",
    });
    turndown.keep(["table", "thead", "tbody", "tr", "th", "td"]);
  }
  return turndown;
}

/** Convert editor HTML back to Markdown for export & AI context. */
export function htmlToMarkdown(html: string): string {
  return getTurndown().turndown(html);
}

/** Plain-text version of editor HTML (for AI context building). */
export function htmlToText(html: string): string {
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, " ");
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent ?? "").replace(/\s+/g, " ").trim();
}
