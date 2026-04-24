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

    const { items: groupItems, itemIds, categoryIds, ...rest } = body
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const group = await prisma.addonGroup.create({
      data: {
        ...rest,
        items: groupItems,
        itemIds: itemIds || [],
        categoryIds: categoryIds || [],
        clerkId,
        userId: user.id,
      }
    })

    // Sync items' addonGroupIds
    if (itemIds && itemIds.length > 0) {
      await prisma.item.updateMany({
        where: { id: { in: itemIds } },
        data: {
          addonGroupIds: {
            push: group.id
          }
        }
      })
    }

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

    const { items: groupItems, itemIds, categoryIds, ...rest } = data

    // 1. Get previous state to handle unlinking
    const prevGroup = await prisma.addonGroup.findUnique({
      where: { id, clerkId },
      select: { itemIds: true }
    })
    const prevItemIds = prevGroup?.itemIds || []

    // 2. Update the group itself
    const updated = await prisma.addonGroup.update({
      where: { id, clerkId },
      data: {
        ...rest,
        items: groupItems,
        itemIds: itemIds || [],
        categoryIds: categoryIds || []
      }
    })

    // 3. Sync items (Remove this group from items no longer linked)
    const removedIds = prevItemIds.filter(pid => !itemIds.includes(pid))
    if (removedIds.length > 0) {
      for (const itemId of removedIds) {
        const item = await prisma.item.findUnique({ where: { id: itemId }, select: { addonGroupIds: true } })
        if (item) {
          await prisma.item.update({
            where: { id: itemId },
            data: {
              addonGroupIds: item.addonGroupIds.filter(gid => gid !== id)
            }
          })
        }
      }
    }

    // 4. Sync items (Add this group to newly linked items)
    const addedIds = itemIds.filter((nid: string) => !prevItemIds.includes(nid))
    if (addedIds.length > 0) {
      await prisma.item.updateMany({
        where: { id: { in: addedIds } },
        data: {
          addonGroupIds: {
            push: id
          }
        }
      })
    }

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
