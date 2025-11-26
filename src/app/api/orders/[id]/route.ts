// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/orders/[id]/route.ts
// DESCRIPTION: API สำหรับจัดการ Order ตาม ID
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSession } from '@/lib/session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - ดึงข้อมูล Order ตาม ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        table: true,
        orderItems: {
          include: { menuItem: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบ Order' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// PUT - อัพเดทสถานะ Order
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
    const { status, adminMessage } = await request.json();

    const updateData: Record<string, unknown> = {};
    
    if (status) {
      updateData.status = status;
      
      // Set timestamps based on status
      switch (status) {
        case 'CONFIRMED':
          updateData.confirmedAt = new Date();
          break;
        case 'CANCELLED':
          updateData.cancelledAt = new Date();
          break;
        case 'COMPLETED':
          updateData.completedAt = new Date();
          break;
      }
    }

    if (adminMessage !== undefined) {
      updateData.adminMessage = adminMessage;
    }

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        table: true,
        orderItems: {
          include: { menuItem: true },
        },
      },
    });

    // If order completed or cancelled, check if table has any more active orders
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      const activeOrders = await prisma.order.count({
        where: {
          tableId: order.tableId,
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
        },
      });

      if (activeOrders === 0) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: { isOccupied: false },
        });
      }
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการอัพเดท Order' },
      { status: 500 }
    );
  }
}

// DELETE - ลบ Order (Admin only)
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
    
    await prisma.order.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete order error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการลบ Order' },
      { status: 500 }
    );
  }
}