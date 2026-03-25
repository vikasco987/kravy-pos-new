import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getEffectiveClerkId } from '@/lib/auth-utils'

export async function GET(req: Request) {
  try {
    const clerkId = await getEffectiveClerkId()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const groups = await prisma.addonGroup.findMany({
      where: { clerkId: clerkId },
      orderBy: { createdAt: 'desc' },
      include: {
         itemsOnMenu: {
            select: { id: true, name: true }
         }
      }
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('ADDON_GROUPS_GET_ERROR:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const clerkId = await getEffectiveClerkId()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const user = await prisma.user.findUnique({ where: { clerkId: clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const group = await prisma.addonGroup.create({
      data: {
        ...body,
        clerkId,
        userId: user.id,
      }
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('ADDON_GROUPS_POST_ERROR:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const clerkId = await getEffectiveClerkId()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, ...data } = body

    const updated = await prisma.addonGroup.update({
      where: { id, clerkId },
      data: data
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('ADDON_GROUPS_PUT_ERROR:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const clerkId = await getEffectiveClerkId()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.addonGroup.delete({
      where: { id, clerkId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ADDON_GROUPS_DELETE_ERROR:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
