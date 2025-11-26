// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/tables/token/[token]/route.ts
// DESCRIPTION: API สำหรับดึงข้อมูลโต๊ะตาม Token (QR Code)
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET - ดึงข้อมูลโต๊ะตาม QR Token
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const table = await prisma.table.findUnique({
      where: { qrToken: token },
      include: {
        orders: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
          },
          include: {
            orderItems: {
              include: { menuItem: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบโต๊ะ หรือ QR Code ไม่ถูกต้อง' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: table });
  } catch (error) {
    console.error('Get table by token error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}