// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/tables/[id]/route.ts
// DESCRIPTION: API สำหรับจัดการโต๊ะตาม ID
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import { v4 as uuidv4 } from 'uuid';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - ดึงข้อมูลโต๊ะตาม ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const table = await prisma.table.findUnique({
      where: { id: parseInt(id) },
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
        { success: false, error: 'ไม่พบโต๊ะ' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: table });
  } catch (error) {
    console.error('Get table error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// PUT - แก้ไขโต๊ะ
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { name, isActive, isOccupied, sortOrder, regenerateQR } = await request.json();

    const updateData: Record<string, unknown> = {};
    
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isOccupied !== undefined) updateData.isOccupied = isOccupied;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder);
    
    if (regenerateQR) {
      const qrToken = uuidv4();
      updateData.qrToken = qrToken;
      updateData.qrCode = `table-${Date.now()}-${qrToken}`;
    }

    const table = await prisma.table.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: table });
  } catch (error) {
    console.error('Update table error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการแก้ไขโต๊ะ' },
      { status: 500 }
    );
  }
}

// DELETE - ลบโต๊ะ
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Check if table has active orders
    const activeOrders = await prisma.order.count({
      where: {
        tableId: parseInt(id),
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
      },
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถลบได้ เนื่องจากมีออเดอร์ที่ยังไม่เสร็จสิ้น' },
        { status: 400 }
      );
    }

    await prisma.table.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete table error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการลบโต๊ะ' },
      { status: 500 }
    );
  }
}