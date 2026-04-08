/**
 * Custom promptfoo provider for Gemini 2.5 Flash via OpenAI-compatible endpoint.
 * Works around promptfoo v0.121.3 bugs with multi-message YAML prompts + Gemini provider.
 *
 * Usage in promptfoo config:
 *   providers:
 *     - file://gemini-provider.mjs
 */

const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

export default class GeminiProvider {
  id() {
    return "gemini-2.5-flash";
  }

  async callApi(prompt, context) {
    const apiKey =
      process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "GOOGLE_API_KEY or GEMINI_API_KEY environment variable is required"
      );
    }

    // promptfoo passes YAML prompts as a JSON-stringified messages array
    let messages;
    try {
      const parsed = JSON.parse(prompt);
      if (Array.isArray(parsed)) {
        messages = parsed;
      } else {
        messages = [{ role: "user", content: prompt }];
      }
    } catch {
      messages = [{ role: "user", content: prompt }];
    }

    const body = {
      model: "gemini-2.5-flash",
      messages,
      temperature: 0.2,
      max_tokens: 8192,
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const output = data.choices?.[0]?.message?.content ?? "";
    const usage = data.usage ?? {};

    return {
      output,
      tokenUsage: {
        total: usage.total_tokens,
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
      },
    };
  }
}
