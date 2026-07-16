import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        const staffToken = req.cookies.get("staff_token")?.value;
        const customToken = req.cookies.get("kravy_auth_token")?.value;

        // Ensure only authorized staff or merchants can access this key
        if (!userId && !staffToken && !customToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        
        if (!apiKey) {
            return NextResponse.json({ error: "API Key not configured on server" }, { status: 500 });
        }

        return NextResponse.json({ apiKey });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
