import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
    try {
        const cookieStore = await cookies();
        
        // Clear the staff_token cookie
        cookieStore.delete("staff_token");

        return NextResponse.json({
            success: true,
            message: "Successfully logged out"
        });
    } catch (error: any) {
        console.error("LOGOUT_ERROR:", error);
        return NextResponse.json({
            success: false,
            message: "Logout failed: " + error.message
        }, { status: 500 });
    }
}
