// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/categories/[id]/route.ts
// DESCRIPTION: API สำหรับจัดการหมวดหมู่ตาม ID
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSession } from '@/lib/session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - ดึงหมวดหมู่ตาม ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        menuItems: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบหมวดหมู่' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// PUT - แก้ไขหมวดหมู่
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
    const { name, description, sortOrder, isActive } = await request.json();

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        sortOrder,
        isActive,
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่' },
      { status: 500 }
    );
  }
}

// DELETE - ลบหมวดหมู่
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
    
    // Check if category has menu items
    const menuCount = await prisma.menuItem.count({
      where: { categoryId: parseInt(id) },
    });

    if (menuCount > 0) {
      return NextResponse.json(
        { success: false, error: `ไม่สามารถลบได้ เนื่องจากมีรายการอาหาร ${menuCount} รายการ` },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการลบหมวดหมู่' },
      { status: 500 }
    );
  }
}