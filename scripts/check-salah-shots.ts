async function search(query: string) {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query, max_results: 5, search_depth: "advanced" }),
  });
  const data = await res.json();
  console.log(`\nQuery: "${query}"`);
  console.log(JSON.stringify(data.results?.map((r: { title: string; url: string; content: string }) => ({ title: r.title, url: r.url, snippet: r.content.slice(0, 700) })), null, 2));
}
async function run() {
  await search("Mohamed Salah shots Belgium Egypt box score athletic total shots on target");
  await search("sofascore Mohamed Salah Belgium Egypt shots rating");
}
run().catch(console.error);
