import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");
        
        if (!query) {
            return NextResponse.json({ success: false, error: "Query parameter 'q' is required." }, { status: 400 });
        }

        const limit = searchParams.get("limit") || "12";
        const page = searchParams.get("page") || "1";
        
        const foodSnapUrl = `https://manager.foodsnap.in/api/image/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
        
        const response = await fetch(foodSnapUrl);

        if (!response.ok) {
            throw new Error(`FoodSnap API error: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Image Search Proxy Error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
