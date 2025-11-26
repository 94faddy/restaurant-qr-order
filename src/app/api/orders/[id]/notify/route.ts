// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/orders/[id]/notify/route.ts
// DESCRIPTION: API สำหรับ mark ว่าข้อความถูกแจ้งเตือนแล้ว
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT - Mark order message as notified
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await prisma.order.update({
      where: { id: parseInt(id) },
      data: { isNotified: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark notified error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}