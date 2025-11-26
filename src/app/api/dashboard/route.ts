// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/dashboard/route.ts
// DESCRIPTION: API สำหรับดึงข้อมูล Dashboard
// ===================================================

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's orders count
    const todayOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Today's sales
    const todaySalesResult = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: { in: ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'] },
      },
      _sum: {
        totalAmount: true,
      },
    });
    const todaySales = Number(todaySalesResult._sum.totalAmount) || 0;

    // Pending orders count
    const pendingOrders = await prisma.order.count({
      where: {
        status: 'PENDING',
      },
    });

    // Active tables count
    const activeTables = await prisma.table.count({
      where: {
        isOccupied: true,
        isActive: true,
      },
    });

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
      },
      include: {
        table: true,
        orderItems: {
          include: { menuItem: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      _count: true,
    });

    // Top selling items today
    const topItems = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
          status: { in: ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'] },
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    // Get menu item details for top items
    const topItemsWithDetails = await Promise.all(
      topItems.map(async (item) => {
        const menuItem = await prisma.menuItem.findUnique({
          where: { id: item.menuItemId },
        });
        return {
          menuItemId: item.menuItemId,
          name: menuItem?.name || 'Unknown',
          quantity: item._sum.quantity || 0,
          totalAmount: Number(item._sum.totalPrice) || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        todayOrders,
        todaySales,
        pendingOrders,
        activeTables,
        recentOrders,
        ordersByStatus: ordersByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        topItems: topItemsWithDetails,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}