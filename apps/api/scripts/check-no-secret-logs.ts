import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const targetFiles = [
  "src/services/ai/geminiClient.ts",
  "src/plugins/supabase.ts",
  "src/server.ts",
];

const forbiddenPatterns = [
  /process\.env\.[A-Z0-9_]+/g,
  /GEMINI_API_KEY/gi,
  /SUPABASE_ANON_KEY/gi,
  /Authorization:\s*`Bearer\s*\$\{/g,
];

let failed = false;

for (const rel of targetFiles) {
  const abs = resolve(process.cwd(), rel);
  const content = readFileSync(abs, "utf8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const looksLikeLog =
      line.includes("log.") ||
      line.includes("console.log") ||
      line.includes("console.error");
    if (!looksLikeLog) continue;

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(line)) {
        failed = true;
        console.error(
          `Potential secret logging pattern in ${rel}:${i + 1}: ${line.trim()}`,
        );
      }
      pattern.lastIndex = 0;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log("Secret log guard passed.");
