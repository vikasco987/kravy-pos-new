import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");
        const offset = searchParams.get("offset") || "0";
        
        if (!query) {
            return NextResponse.json({ success: false, error: "Query parameter 'q' is required." }, { status: 400 });
        }

        // Clean query: remove parenthetical tags like (NV), (R), size, etc.
        const cleanName = query.replace(/\(.*\)|\{.*\}|\[.*\]|\d+\s*ml|\d+\s*lit/gi, "").trim();
        let photos: any[] = [];

        // 1. Bing Images Scraper (Highly reliable, full-res, rarely blocked)
        try {
            const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(cleanName + " food recipe")}&first=${offset}`;
            const res = await fetch(bingUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
                }
            });
            if (res.ok) {
                const html = await res.text();
                const matches = html.match(/&quot;murl&quot;:&quot;(https?:\/\/[^&]+)&quot;/g) || [];
                const parsed = matches.map((m, idx) => {
                    const match = m.match(/&quot;murl&quot;:&quot;(https?:\/\/[^&]+)&quot;/);
                    return match ? {
                        image_url: decodeURIComponent(match[1]),
                        title: `${cleanName} Option ${idx + 1}`
                    } : null;
                }).filter(Boolean);
                if (parsed.length > 0) {
                    photos = parsed;
                }
            }
        } catch (err) {
            console.warn("Bing image search failed:", err);
        }

        // 2. Google Images Desktop Scraper (Fallback, full-res)
        if (photos.length === 0) {
            try {
                const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(cleanName + " food recipe")}&tbm=isch`;
                const res = await fetch(googleUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
                    }
                });
                if (res.ok) {
                    const html = await res.text();
                    // Match full resolution image URLs in data arrays
                    const matches = html.match(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/g) || [];
                    const uniqueUrls = Array.from(new Set(matches.map(m => m.replace(/"/g, ''))))
                        .filter(url => !url.includes('google') && !url.includes('gstatic') && !url.includes('doubleclick') && !url.includes('analytics'));
                    
                    if (uniqueUrls.length > 0) {
                        photos = uniqueUrls.map((url, idx) => ({
                            image_url: url,
                            title: `${cleanName} Option ${idx + 1}`
                        }));
                    }
                }
            } catch (err) {
                console.warn("Google desktop image search failed:", err);
            }
        }

        // 3. DuckDuckGo Scraper (Fallback 2)
        if (photos.length === 0) {
            try {
                const searchQ = `${cleanName} food recipe`;
                const res1 = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(searchQ)}`, {
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
                });
                const html = await res1.text();
                const vqdMatch = html.match(/vqd=([\d-]+)/);
                if (vqdMatch) {
                    const url = `https://duckduckgo.com/i.js?q=${encodeURIComponent(searchQ)}&o=json&vqd=${vqdMatch[1]}&s=${offset}`;
                    const res2 = await fetch(url, {
                        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
                    });
                    if (res2.ok) {
                        const json = await res2.json();
                        if (json.results && json.results.length > 0) {
                            photos = json.results.map((r: any) => ({
                                image_url: r.image,
                                title: r.title || cleanName
                            }));
                        }
                    }
                }
            } catch (err) {
                console.warn("DuckDuckGo image search failed:", err);
            }
        }

        return NextResponse.json({ success: true, data: photos });
    } catch (error: any) {
        console.error("Deep Image Proxy Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
