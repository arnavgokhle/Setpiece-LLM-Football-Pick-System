// ============================================================
// SETPIECE — Tavily Web Search Client
// Used by Scout to fetch breaking football news, injury updates,
// and lineup confirmations from the last 24 hours.
// ============================================================

const TAVILY_BASE = "https://api.tavily.com/search";

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

export interface TavilyResponse {
  answer?: string;
  results: TavilyResult[];
}

/**
 * Search the web for recent football news using Tavily.
 * Returns top results with content snippets.
 */
export async function searchFootballNews(
  query: string,
  maxResults = 4
): Promise<TavilyResponse> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return { results: [] };

  try {
    const res = await fetch(TAVILY_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query: `${query} football 2025 2026`,
        search_depth: "basic",
        max_results: maxResults,
        include_answer: true,
        include_raw_content: false,
        topic: "news",
        days: 1, // Last 24 hours only
      }),
      signal: AbortSignal.timeout(5000), // 5s timeout to not block the response
    });

    if (!res.ok) return { results: [] };
    return await res.json() as TavilyResponse;
  } catch {
    return { results: [] };
  }
}

/**
 * Format Tavily results into a concise context block for Scout.
 */
export function formatNewsContext(
  query: string,
  data: TavilyResponse
): string {
  if (!data.results.length && !data.answer) return "";

  const lines: string[] = [
    `LIVE WEB SEARCH — "${query}" (last 24h):`,
  ];

  if (data.answer) {
    lines.push(`Summary: ${data.answer}`);
  }

  for (const r of data.results.slice(0, 3)) {
    lines.push(`• [${r.title}] ${r.content.slice(0, 200).trim()}... (${r.url})`);
  }

  return lines.join("\n");
}
