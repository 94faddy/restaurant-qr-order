// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/menu/[id]/route.ts
// DESCRIPTION: API สำหรับจัดการรายการอาหารตาม ID
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import fs from 'fs/promises';
import path from 'path';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - ดึงรายการอาหารตาม ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
      },
    });

    if (!menuItem) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบรายการอาหาร' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: menuItem });
  } catch (error) {
    console.error('Get menu item error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// PUT - แก้ไขรายการอาหาร
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
    const { 
      name, 
      description, 
      categoryId, 
      price, 
      maxPerOrder, 
      isAvailable,
      isActive,
      image,
      sortOrder 
    } = await request.json();

    const updateData: Record<string, unknown> = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (categoryId !== undefined) updateData.categoryId = parseInt(categoryId);
    if (price !== undefined) updateData.price = parseFloat(price);
    if (maxPerOrder !== undefined) updateData.maxPerOrder = parseInt(maxPerOrder);
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (image !== undefined) updateData.image = image;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder);

    const menuItem = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        category: true,
      },
    });

    return NextResponse.json({ success: true, data: menuItem });
  } catch (error) {
    console.error('Update menu item error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการแก้ไขรายการอาหาร' },
      { status: 500 }
    );
  }
}

// DELETE - ลบรายการอาหาร
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
    
    // Get menu item to delete image
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: parseInt(id) },
    });

    if (menuItem?.image) {
      try {
        const imagePath = path.join(process.cwd(), 'public', menuItem.image);
        await fs.unlink(imagePath);
      } catch {
        console.error('Failed to delete image file');
      }
    }

    await prisma.menuItem.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete menu item error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการลบรายการอาหาร' },
      { status: 500 }
    );
  }
}