import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let settings = await prisma.systemSettings.findFirst();

    // If no settings exist, create a default one
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          appLatestVersion: "1.0.0",
          appMinRequiredVersion: "1.0.0",
          appUpdateUrl: "https://play.google.com/store/apps/details?id=com.kravy.pos",
          appReleaseNotes: "Initial release"
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[APP_SETTINGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { appLatestVersion, appMinRequiredVersion, appUpdateUrl, appReleaseNotes } = body;

    let settings = await prisma.systemSettings.findFirst();

    if (settings) {
      settings = await prisma.systemSettings.update({
        where: {
          id: settings.id,
        },
        data: {
          appLatestVersion,
          appMinRequiredVersion,
          appUpdateUrl,
          appReleaseNotes
        }
      });
    } else {
      settings = await prisma.systemSettings.create({
        data: {
          appLatestVersion,
          appMinRequiredVersion,
          appUpdateUrl,
          appReleaseNotes
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[APP_SETTINGS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
