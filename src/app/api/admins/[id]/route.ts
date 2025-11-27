// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/admins/[id]/route.ts
// DESCRIPTION: API สำหรับจัดการ Admin ตาม ID (GET, PUT, DELETE)
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import { parsePermissions, PERMISSIONS } from '@/lib/permissions';
import bcrypt from 'bcryptjs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - ดึงข้อมูล Admin ตาม ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์
    const currentAdmin = await prisma.admin.findUnique({
      where: { id: session.adminId },
    });

    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ดูแลระบบ' },
        { status: 404 }
      );
    }

    const currentPermissions = parsePermissions(currentAdmin.permissions);
    if (!currentPermissions.includes(PERMISSIONS.ADMINS)) {
      return NextResponse.json(
        { success: false, error: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const admin = await prisma.admin.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ดูแลระบบ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...admin,
        permissions: parsePermissions(admin.permissions),
      },
    });
  } catch (error) {
    console.error('Get admin error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// PUT - แก้ไข Admin
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์
    const currentAdmin = await prisma.admin.findUnique({
      where: { id: session.adminId },
    });

    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ดูแลระบบ' },
        { status: 404 }
      );
    }

    const currentPermissions = parsePermissions(currentAdmin.permissions);
    if (!currentPermissions.includes(PERMISSIONS.ADMINS)) {
      return NextResponse.json(
        { success: false, error: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const adminId = parseInt(id);
    const { username, password, name, role, permissions, isActive } = await request.json();

    // ตรวจสอบว่าไม่ใช่การแก้ไขตัวเองให้เป็น inactive หรือลบสิทธิ์ admins
    if (adminId === session.adminId) {
      if (isActive === false) {
        return NextResponse.json(
          { success: false, error: 'ไม่สามารถปิดการใช้งานตัวเองได้' },
          { status: 400 }
        );
      }
      if (permissions && !permissions.includes(PERMISSIONS.ADMINS)) {
        return NextResponse.json(
          { success: false, error: 'ไม่สามารถลบสิทธิ์จัดการผู้ดูแลของตัวเองได้' },
          { status: 400 }
        );
      }
    }

    // Check username conflict
    if (username) {
      const existingAdmin = await prisma.admin.findFirst({
        where: {
          username,
          NOT: { id: adminId },
        },
      });

      if (existingAdmin) {
        return NextResponse.json(
          { success: false, error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (username !== undefined) updateData.username = username;
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (permissions !== undefined) updateData.permissions = JSON.stringify(permissions);
    if (isActive !== undefined) updateData.isActive = isActive;

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const admin = await prisma.admin.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...admin,
        permissions: parsePermissions(admin.permissions),
      },
    });
  } catch (error) {
    console.error('Update admin error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการแก้ไขผู้ดูแลระบบ' },
      { status: 500 }
    );
  }
}

// DELETE - ลบ Admin
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์
    const currentAdmin = await prisma.admin.findUnique({
      where: { id: session.adminId },
    });

    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ดูแลระบบ' },
        { status: 404 }
      );
    }

    const currentPermissions = parsePermissions(currentAdmin.permissions);
    if (!currentPermissions.includes(PERMISSIONS.ADMINS)) {
      return NextResponse.json(
        { success: false, error: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const adminId = parseInt(id);

    // ไม่สามารถลบตัวเองได้
    if (adminId === session.adminId) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถลบตัวเองได้' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามี admin เหลืออยู่อย่างน้อย 1 คน
    const adminCount = await prisma.admin.count({
      where: { isActive: true },
    });

    if (adminCount <= 1) {
      return NextResponse.json(
        { success: false, error: 'ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน' },
        { status: 400 }
      );
    }

    await prisma.admin.delete({
      where: { id: adminId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete admin error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการลบผู้ดูแลระบบ' },
      { status: 500 }
    );
  }
}