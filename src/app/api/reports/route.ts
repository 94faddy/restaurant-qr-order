// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/reports/route.ts
// DESCRIPTION: API สำหรับรายงานยอดขาย
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSession } from '@/lib/session';

interface OrderItem {
  menuItemId: number;
  quantity: number;
  totalPrice: number | string | { toNumber(): number };
  menuItem: {
    name: string;
    categoryId: number;
  };
}

interface Order {
  status: string;
  totalAmount: number | string | { toNumber(): number };
  createdAt: Date;
  orderItems: OrderItem[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // Default: last 30 days
      end = new Date();
      end.setHours(23, 59, 59, 999);
      start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }

    // Get all orders in range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        orderItems: {
          include: { menuItem: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    }) as unknown as Order[];

    // Calculate summary
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => 
      ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'].includes(o.status)
    );
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED');
    
    const totalSales = completedOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    const averageOrderValue = completedOrders.length > 0 
      ? totalSales / completedOrders.length 
      : 0;

    // Top selling items
    const itemSales: Record<number, { name: string; quantity: number; totalAmount: number }> = {};
    
    for (const order of completedOrders) {
      for (const item of order.orderItems) {
        if (!itemSales[item.menuItemId]) {
          itemSales[item.menuItemId] = {
            name: item.menuItem.name,
            quantity: 0,
            totalAmount: 0,
          };
        }
        itemSales[item.menuItemId].quantity += item.quantity;
        itemSales[item.menuItemId].totalAmount += Number(item.totalPrice);
      }
    }

    const topItems = Object.entries(itemSales)
      .map(([menuItemId, data]) => ({
        menuItemId: parseInt(menuItemId),
        ...data,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Daily breakdown
    const dailyData: Record<string, { orders: number; sales: number; cancelled: number }> = {};
    
    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { orders: 0, sales: 0, cancelled: 0 };
      }
      dailyData[dateKey].orders++;
      
      if (['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'].includes(order.status)) {
        dailyData[dateKey].sales += Number(order.totalAmount);
      }
      if (order.status === 'CANCELLED') {
        dailyData[dateKey].cancelled++;
      }
    }

    const dailyBreakdown = Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Category breakdown
    const categorySales: Record<number, { name: string; quantity: number; totalAmount: number }> = {};
    
    for (const order of completedOrders) {
      for (const item of order.orderItems) {
        const catId = item.menuItem.categoryId;
        if (!categorySales[catId]) {
          categorySales[catId] = {
            name: '',
            quantity: 0,
            totalAmount: 0,
          };
        }
        categorySales[catId].quantity += item.quantity;
        categorySales[catId].totalAmount += Number(item.totalPrice);
      }
    }

    // Get category names
    const categories = await prisma.category.findMany();
    for (const cat of categories) {
      if (categorySales[cat.id]) {
        categorySales[cat.id].name = cat.name;
      }
    }

    const categoryBreakdown = Object.entries(categorySales)
      .map(([categoryId, data]) => ({
        categoryId: parseInt(categoryId),
        ...data,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          completedOrders: completedOrders.length,
          cancelledOrders: cancelledOrders.length,
          totalSales,
          averageOrderValue,
          period: {
            start: start.toISOString(),
            end: end.toISOString(),
          },
        },
        topItems,
        dailyBreakdown,
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}