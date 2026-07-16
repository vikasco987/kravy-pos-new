import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");
        const offset = searchParams.get("offset") || "0";
        
        if (!query) {
            return NextResponse.json({ success: false, error: "Query parameter 'q' is required." }, { status: 400 });
        }

        // Fallback deep search using duckduckgo (since google scraper isn't available here)
        const cleanName = query.replace(/\(.*\)|\{.*\}|\[.*\]|\d+\s*ml|\d+\s*lit/gi, "").trim();
        const searchQ = `${cleanName} dish food`;
        
        let photos: any[] = [];

        try {
            const res1 = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(searchQ)}`, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
            });
            const html = await res1.text();
            const vqdMatch = html.match(/vqd=([\d-]+)/);
            
            if (vqdMatch) {
                const url = `https://duckduckgo.com/i.js?q=${encodeURIComponent(searchQ)}&o=json&vqd=${vqdMatch[1]}&s=${offset}&nextvqd=${vqdMatch[1]}`;
                const res2 = await fetch(url, { 
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } 
                });
                if (res2.ok) {
                    const json = await res2.json();
                    if (json.results && json.results.length > 0) {
                        photos = json.results.map((r: any) => ({
                            image_url: r.image,
                            title: r.title
                        }));
                    }
                }
            }
        } catch (err) {
            console.warn("DuckDuckGo fetch failed on proxy server, falling back to Google...", err);
        }

        // Fallback to Google Images Mobile HTML Scraper if DuckDuckGo failed or returned no results
        if (photos.length === 0) {
            try {
                const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(cleanName + " food")}&tbm=isch`;
                const resGoogle = await fetch(googleUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
                    }
                });
                if (resGoogle.ok) {
                    const html = await resGoogle.text();
                    // Extract image thumbnails
                    const tbnMatches = html.match(/https:\/\/encrypted-tbn\d\.gstatic\.com\/images\?q=tbnd?:[a-zA-Z0-9_-]+/g) || [];
                    const uniqueMatches = Array.from(new Set(tbnMatches));
                    
                    photos = uniqueMatches.map((url, index) => ({
                        image_url: url,
                        title: `${cleanName} option ${index + 1}`
                    }));
                }
            } catch (err) {
                console.error("Google mobile fallback failed:", err);
            }
        }

        return NextResponse.json({ success: true, data: photos });
    } catch (error: any) {
        console.error("Deep Image Proxy Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
