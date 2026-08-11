import { NextResponse } from "next/server";

export async function GET() {
  try {
    // TODO: In the future, you can fetch this from your database (e.g. SystemSettings)
    // For now, simply update these values whenever you release a new app version.
    const versionConfig = {
      latestVersion: "1.0.0",
      minRequiredVersion: "1.0.0",
      updateUrl: "https://play.google.com/store/apps/details?id=com.kravy.pos", // Update with your actual play store ID
      releaseNotes: "Initial release of Kravy POS Billing App.",
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
