// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/tables/route.ts
// DESCRIPTION: API สำหรับจัดการโต๊ะ
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';

// GET - ดึงรายการโต๊ะทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const includeOrders = searchParams.get('includeOrders') === 'true';

    const tables = await prisma.table.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: includeOrders
        ? {
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
          }
        : undefined,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, data: tables });
  } catch (error) {
    console.error('Get tables error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - สร้างโต๊ะใหม่
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const { name, sortOrder } = await request.json();

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกชื่อโต๊ะ' },
        { status: 400 }
      );
    }

    const qrToken = uuidv4();
    const qrCode = `table-${Date.now()}-${qrToken}`;

    const table = await prisma.table.create({
      data: {
        name,
        qrCode,
        qrToken,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ success: true, data: table });
  } catch (error) {
    console.error('Create table error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้างโต๊ะ' },
      { status: 500 }
    );
  }
}