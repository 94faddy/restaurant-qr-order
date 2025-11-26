// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/orders/route.ts
// DESCRIPTION: API สำหรับจัดการ Orders
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateOrderNumber } from '@/lib/utils';
import { Prisma } from '@prisma/client';

// GET - ดึงรายการ Orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tableId = searchParams.get('tableId');
    const date = searchParams.get('date');
    const limit = searchParams.get('limit');
    const includeNotifications = searchParams.get('includeNotifications') === 'true';

    const where: Prisma.OrderWhereInput = {};

    if (status) {
      if (status === 'active') {
        where.status = { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] };
      } else {
        where.status = status as Prisma.EnumOrderStatusFilter;
      }
    }

    if (tableId) {
      where.tableId = parseInt(tableId);
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    // ✅ สำหรับลูกค้า: รวม orders ที่มี notification ที่ยังไม่ได้อ่าน
    if (includeNotifications && tableId) {
      const orders = await prisma.order.findMany({
        where: {
          tableId: parseInt(tableId),
          OR: [
            // Orders ที่ยัง active
            { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] } },
            // Orders ที่ถูก cancel แต่ยังไม่ได้ notify
            { 
              status: 'CANCELLED',
              isNotified: false,
              adminMessage: { not: null },
            },
          ],
        },
        include: {
          table: true,
          orderItems: {
            include: { menuItem: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ success: true, data: orders });
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        orderItems: {
          include: { menuItem: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - สร้าง Order ใหม่ (จากลูกค้า)
export async function POST(request: NextRequest) {
  try {
    const { tableToken, items, notes } = await request.json();

    if (!tableToken || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเลือกรายการอาหาร' },
        { status: 400 }
      );
    }

    // Find table by token
    const table = await prisma.table.findUnique({
      where: { qrToken: tableToken },
    });

    if (!table || !table.isActive) {
      return NextResponse.json(
        { success: false, error: 'โต๊ะไม่พร้อมใช้งาน' },
        { status: 400 }
      );
    }

    // Get menu items
    const menuItemIds = items.map((item: { menuItemId: number }) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        isActive: true,
        isAvailable: true,
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json(
        { success: false, error: 'บางรายการไม่พร้อมจำหน่าย' },
        { status: 400 }
      );
    }

    // Validate quantities
    for (const item of items) {
      const menuItem = menuItems.find(m => m.id === item.menuItemId);
      if (menuItem && item.quantity > menuItem.maxPerOrder) {
        return NextResponse.json(
          { success: false, error: `${menuItem.name} สั่งได้สูงสุด ${menuItem.maxPerOrder} รายการ` },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    let totalAmount = 0;
    const orderItemsData = items.map((item: { menuItemId: number; quantity: number; notes?: string }) => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId)!;
      const unitPrice = Number(menuItem.price);
      const itemTotal = unitPrice * item.quantity;
      totalAmount += itemTotal;
      
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
        notes: item.notes || null,
      };
    });

    // Create order
    const order = await prisma.order.create({
      data: {
        tableId: table.id,
        orderNumber: generateOrderNumber(),
        totalAmount,
        notes: notes || null,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        table: true,
        orderItems: {
          include: { menuItem: true },
        },
      },
    });

    // Update table occupied status
    await prisma.table.update({
      where: { id: table.id },
      data: { isOccupied: true },
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้าง Order' },
      { status: 500 }
    );
  }
}