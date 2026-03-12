import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveClerkId } from "@/lib/auth-utils";

// PUT - Update a specific table
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Table name is required" },
        { status: 400 }
      );
    }

    // Check if table exists and belongs to the user
    const existingTable = await prisma.table.findFirst({
      where: {
        id,
        clerkUserId: effectiveId,
      },
    });

    if (!existingTable) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    // Check if another table with the same name exists (excluding current table)
    const duplicateTable = await prisma.table.findFirst({
      where: {
        clerkUserId: effectiveId,
        name: name.trim(),
        id: { not: id },
      },
    });

    if (duplicateTable) {
      return NextResponse.json(
        { error: "Table with this name already exists" },
        { status: 409 }
      );
    }

    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(updatedTable);
  } catch (error) {
    console.error("Error updating table:", error);
    return NextResponse.json(
      { error: "Failed to update table" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific table
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const effectiveId = await getEffectiveClerkId();
    if (!effectiveId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Check if table exists and belongs to the user
    const existingTable = await prisma.table.findFirst({
      where: {
        id,
        clerkUserId: effectiveId,
      },
    });

    if (!existingTable) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    await prisma.table.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting table:", error);
    return NextResponse.json(
      { error: "Failed to delete table" },
      { status: 500 }
    );
  }
}
