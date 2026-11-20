import { marked } from "marked";

/**
 * Markdown → HTML (GitHub-flavoured: tables, strikethrough). Shared by the editor's preview and
 * savePost, so the preview matches what is stored. The server always sanitises the result.
 */
export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { gfm: true, async: false });
}
