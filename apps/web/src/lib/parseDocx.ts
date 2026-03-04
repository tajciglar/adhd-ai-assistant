import mammoth from "mammoth";

interface ParsedRow {
  category: string;
  title: string;
  content: string;
}

/**
 * Parse a .docx file (exported from Google Docs) into knowledge entries.
 *
 * Structure:
 *   H1 → category
 *   H2 → entry title
 *   Content between headings → entry content (plain text)
 *
 * Falls back to filename as category if no H1 found,
 * and treats paragraph blocks as separate entries if no H2 found.
 */
export async function parseDocxToEntries(
  buffer: ArrayBuffer,
  fileName: string,
): Promise<ParsedRow[]> {
  const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
  const html = result.value;

  // Parse the HTML string into DOM elements
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const elements = doc.body.children;

  const entries: ParsedRow[] = [];
  let currentCategory = fileName.replace(/\.docx$/i, "");
  let currentTitle = "";
  let contentParts: string[] = [];

  function flushEntry() {
    const content = contentParts.join("\n\n").trim();
    if (currentTitle && content) {
      entries.push({
        category: currentCategory,
        title: currentTitle,
        content,
      });
    } else if (!currentTitle && content) {
      // No H2 heading — use first line as title
      const lines = content.split("\n");
      const title = lines[0].slice(0, 200);
      const body = lines.slice(1).join("\n").trim() || title;
      entries.push({
        category: currentCategory,
        title,
        content: body,
      });
    }
    currentTitle = "";
    contentParts = [];
  }

  for (const el of elements) {
    const tag = el.tagName.toLowerCase();
    const text = (el.textContent ?? "").trim();

    if (!text) continue;

    if (tag === "h1") {
      flushEntry();
      currentCategory = text;
    } else if (tag === "h2") {
      flushEntry();
      currentTitle = text;
    } else {
      contentParts.push(text);
    }
  }

  flushEntry();

  return entries;
}
