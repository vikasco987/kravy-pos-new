import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch system settings from DB
    let settings = await prisma.systemSettings.findFirst();

    // If no settings exist yet, provide the default values
    const versionConfig = {
      latestVersion: settings?.appLatestVersion || "1.0.0",
      minRequiredVersion: settings?.appMinRequiredVersion || "1.0.0",
      updateUrl: settings?.appUpdateUrl || "https://play.google.com/store/apps/details?id=com.kravy.pos",
      releaseNotes: settings?.appReleaseNotes || "Initial release",
    };

    return NextResponse.json(
      {
        success: true,
        data: versionConfig,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("App Version Check Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch app version configuration.",
      },
      { status: 500 }
    );
  }
}
