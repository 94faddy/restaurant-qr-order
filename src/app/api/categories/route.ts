// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/categories/route.ts
// DESCRIPTION: API สำหรับจัดการหมวดหมู่อาหาร
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSession } from '@/lib/session';

// GET - ดึงรายการหมวดหมู่ทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeItems = searchParams.get('includeItems') === 'true';
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const categories = await prisma.category.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: includeItems
        ? {
            menuItems: {
              where: activeOnly ? { isActive: true, isAvailable: true } : undefined,
              orderBy: { sortOrder: 'asc' },
            },
          }
        : undefined,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - สร้างหมวดหมู่ใหม่
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const { name, description, sortOrder } = await request.json();

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกชื่อหมวดหมู่' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: description || null,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่' },
      { status: 500 }
    );
  }
}