import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const parties = await prisma.party.findMany({
      where: {
        address: {
          contains: 'Maharash',
          mode: 'insensitive'
        }
      }
    });

    const orders = await prisma.order.findMany({
      where: {
        customerAddress: {
          contains: 'Maharash',
          mode: 'insensitive'
        }
      },
      distinct: ['customerPhone'],
      select: {
        customerName: true,
        customerPhone: true,
        customerAddress: true
      }
    });

    return NextResponse.json({
      partiesCount: parties.length,
      parties: parties.slice(0, 5),
      ordersCount: orders.length,
      orders: orders.slice(0, 5)
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
