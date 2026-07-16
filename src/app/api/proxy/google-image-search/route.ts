import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");
        
        if (!query) {
            return NextResponse.json({ success: false, error: "Query parameter 'q' is required." }, { status: 400 });
        }

        // Fallback deep search using duckduckgo (since google scraper isn't available here)
        const cleanName = query.replace(/\(.*\)|\{.*\}|\[.*\]|\d+\s*ml|\d+\s*lit/gi, "").trim();
        const searchQ = `${cleanName} dish food`;
        
        const res1 = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(searchQ)}`, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        const html = await res1.text();
        const vqdMatch = html.match(/vqd=([\d-]+)/);
        
        if (!vqdMatch) throw new Error("No VQD token from search provider");
        
        const url = `https://duckduckgo.com/i.js?q=${encodeURIComponent(searchQ)}&o=json&vqd=${vqdMatch[1]}`;
        const res2 = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        const json = await res2.json();
        
        if (json.results && json.results.length > 0) {
            const data = json.results.slice(0, 60).map((item: any) => ({
                image_url: item.image,
                title: item.title || query + " (Deep Scraped)",
                score: 100
            }));
            return NextResponse.json({ success: true, data });
        }

        return NextResponse.json({ success: true, data: [] });
    } catch (error: any) {
        console.error("Deep Image Proxy Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
