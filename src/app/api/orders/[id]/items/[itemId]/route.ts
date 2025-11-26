// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/orders/[id]/items/[itemId]/route.ts
// DESCRIPTION: API สำหรับจัดการรายการอาหารแต่ละรายการใน Order
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSession } from '@/lib/session';

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>;
}

// DELETE - ลบรายการอาหารออกจาก Order
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const { id, itemId } = await params;
    const orderId = parseInt(id);
    const orderItemId = parseInt(itemId);

    // ✅ รับ reason จาก request body (ถ้ามี)
    let reason = '';
    try {
      const body = await request.json();
      reason = body.reason || '';
    } catch {
      // ไม่มี body ก็ไม่เป็นไร
    }

    // ดึง order item ที่จะลบ
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: { 
        order: true,
        menuItem: true,
      },
    });

    if (!orderItem || orderItem.orderId !== orderId) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบรายการอาหาร' },
        { status: 404 }
      );
    }

    // ตรวจสอบจำนวนรายการใน order
    const itemCount = await prisma.orderItem.count({
      where: { orderId },
    });

    // ✅ สร้างข้อความแจ้งเตือน
    const itemName = orderItem.menuItem.name;
    const cancelMessage = reason 
      ? `❌ รายการ "${itemName}" ถูกยกเลิก\nเหตุผล: ${reason}`
      : `❌ รายการ "${itemName}" ถูกยกเลิก`;

    // ถ้าเหลือแค่รายการเดียว ให้ยกเลิกทั้ง order
    if (itemCount <= 1) {
      const fullCancelMessage = reason
        ? `❌ Order #${orderItem.order.orderNumber} ถูกยกเลิกทั้งหมด\nเหตุผล: ${reason}`
        : `❌ Order #${orderItem.order.orderNumber} ถูกยกเลิกทั้งหมด`;

      await prisma.order.update({
        where: { id: orderId },
        data: { 
          status: 'CANCELLED',
          cancelledAt: new Date(),
          adminMessage: fullCancelMessage,
          isNotified: false, // ✅ ให้ลูกค้าได้รับแจ้งเตือน
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'ยกเลิก Order ทั้งหมดเนื่องจากไม่มีรายการเหลือ',
        orderCancelled: true,
      });
    }

    // ลบ order item
    await prisma.orderItem.delete({
      where: { id: orderItemId },
    });

    // คำนวณยอดรวมใหม่
    const remainingItems = await prisma.orderItem.findMany({
      where: { orderId },
    });

    const newTotalAmount = remainingItems.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0
    );

    // ✅ อัพเดท order total และส่งข้อความแจ้งเตือน
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        totalAmount: newTotalAmount,
        adminMessage: cancelMessage,
        isNotified: false, // ✅ ให้ลูกค้าได้รับแจ้งเตือน
      },
      include: {
        table: true,
        orderItems: {
          include: { menuItem: true },
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedOrder,
      message: 'ลบรายการอาหารสำเร็จ',
    });
  } catch (error) {
    console.error('Delete order item error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการลบรายการอาหาร' },
      { status: 500 }
    );
  }
}