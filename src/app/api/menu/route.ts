// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/menu/route.ts
// DESCRIPTION: API สำหรับจัดการรายการอาหาร
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSession } from '@/lib/session';

// GET - ดึงรายการอาหารทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const availableOnly = searchParams.get('availableOnly') === 'true';

    const where: Record<string, unknown> = {};
    
    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }
    if (activeOnly) {
      where.isActive = true;
    }
    if (availableOnly) {
      where.isAvailable = true;
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
      ],
    });

    return NextResponse.json({ success: true, data: menuItems });
  } catch (error) {
    console.error('Get menu items error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - สร้างรายการอาหารใหม่
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const { 
      name, 
      description, 
      categoryId, 
      price, 
      maxPerOrder, 
      isAvailable,
      image,
      sortOrder 
    } = await request.json();

    if (!name || !categoryId || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description: description || null,
        categoryId: parseInt(categoryId),
        price: parseFloat(price),
        maxPerOrder: maxPerOrder || 10,
        isAvailable: isAvailable !== false,
        image: image || null,
        sortOrder: sortOrder || 0,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({ success: true, data: menuItem });
  } catch (error) {
    console.error('Create menu item error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้างรายการอาหาร' },
      { status: 500 }
    );
  }
}