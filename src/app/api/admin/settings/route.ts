import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { defaultTrialDays: 3 }
      });
    }
    return NextResponse.json(settings);
  } catch (err) {
    console.error("GET SETTINGS ERROR:", err);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let settings = await prisma.systemSettings.findFirst();
    
    if (settings) {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: { defaultTrialDays: Number(body.defaultTrialDays) || 3 }
      });
    } else {
      settings = await prisma.systemSettings.create({
        data: { defaultTrialDays: Number(body.defaultTrialDays) || 3 }
      });
    }
    
    return NextResponse.json(settings);
  } catch (err) {
    console.error("POST SETTINGS ERROR:", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
