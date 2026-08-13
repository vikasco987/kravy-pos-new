import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const isSafeFoodUrl = (url: string): boolean => {
    if (!url || typeof url !== "string") return false;
    const lower = url.toLowerCase();
    const nsfwKeywords = [
        "nude", "naked", "sex", "porn", "adult", "bikini", "boob", "breast",
        "erotic", "model", "girl", "woman", "body", "underwear", "lingerie",
        "person", "human", "face", "portrait"
    ];
    if (nsfwKeywords.some(kw => lower.includes(kw))) return false;
    return true;
};

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

        // Define Search Queries
        const beverageKeywords = ['tea', 'coffee', 'chai', 'pepsi', 'coke', 'coca-cola', 'cola', 'drink', 'juice', 'shake', 'lassi', 'mocktail', 'cocktail', 'cold drink', 'soda', 'water', 'limca', 'sprite', 'fanta', 'dew', 'thumbs up'];
        const isBeverage = beverageKeywords.some(k => cleanName.toLowerCase().includes(k));
        const isPizza = cleanName.toLowerCase().includes('pizza');
        
        let searchTerms = isBeverage
            ? `${cleanName} drink beverage glass`
            : `${cleanName} dish food recipe`;
        if (isPizza) {
            searchTerms = `${cleanName} italian pizza food`;
        }
        
        const searchQ = `${searchTerms}`;
        
        // 1. DuckDuckGo Scraper (Strict SafeSearch kp=1) - Primary Engine
        try {
            const res1 = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(searchQ)}&kp=1`, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36" }
            });
            const html = await res1.text();
            const vqdMatch = html.match(/vqd=([\d-]+)/);
            if (vqdMatch) {
                const url = `https://duckduckgo.com/i.js?q=${encodeURIComponent(searchQ)}&o=json&vqd=${vqdMatch[1]}&s=${offset}&f=,,,`;
                const res2 = await fetch(url, {
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36" }
                });
                if (res2.ok) {
                    const json = await res2.json();
                    if (json.results && json.results.length > 0) {
                        photos = json.results
                            .map((r: any) => ({ image_url: r.image, title: r.title || cleanName }))
                            .filter((r: any) => isSafeFoodUrl(r.image_url));
                    }
                }
            }
        } catch (err) {
            console.warn("DuckDuckGo image search failed:", err);
        }

        // 2. Bing Images Scraper (Strict SafeSearch + Food Recipe filter) - Fallback 1
        if (photos.length === 0) {
            const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchQ)}&adlt=strict&first=${offset}`;
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
                    const imgUrl = match ? decodeURIComponent(match[1]) : "";
                    return (imgUrl && isSafeFoodUrl(imgUrl)) ? {
                        image_url: imgUrl,
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

        // 2. Google Images Desktop Scraper (Strict SafeSearch)
        if (photos.length === 0) {
            try {
                const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQ)}&safe=active&tbm=isch`;
                const res = await fetch(googleUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
                    }
                });
                if (res.ok) {
                    const html = await res.text();
                    const matches = html.match(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/g) || [];
                    const uniqueUrls = Array.from(new Set(matches.map(m => m.replace(/"/g, ''))))
                        .filter(url => !url.includes('google') && !url.includes('gstatic') && !url.includes('doubleclick') && !url.includes('analytics'))
                        .filter(isSafeFoodUrl);
                    
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

        }

        return NextResponse.json({ success: true, data: photos });
    } catch (error: any) {
        console.error("Deep Image Proxy Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
