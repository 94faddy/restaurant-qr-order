// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/admins/route.ts
// DESCRIPTION: API สำหรับจัดการ Admin (GET all, POST create)
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSession } from '@/lib/session';
import { parsePermissions, PERMISSIONS } from '@/lib/permissions';
import bcrypt from 'bcryptjs';

// GET - ดึงรายการ Admin ทั้งหมด
export async function GET() {
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

    const permissions = parsePermissions(currentAdmin.permissions);
    if (!permissions.includes(PERMISSIONS.ADMINS)) {
      return NextResponse.json(
        { success: false, error: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' },
        { status: 403 }
      );
    }

    const admins = await prisma.admin.findMany({
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
      orderBy: { createdAt: 'asc' },
    });

    // Parse permissions ให้เป็น array
    const adminsWithParsedPermissions = admins.map(admin => ({
      ...admin,
      permissions: parsePermissions(admin.permissions),
    }));

    return NextResponse.json({ success: true, data: adminsWithParsedPermissions });
  } catch (error) {
    console.error('Get admins error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// POST - สร้าง Admin ใหม่
export async function POST(request: NextRequest) {
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

    const { username, password, name, role, permissions, isActive } = await request.json();

    // Validate required fields
    if (!username || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // Check if username exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { username },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: role || 'admin',
        permissions: JSON.stringify(permissions || []),
        isActive: isActive !== false,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
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
    console.error('Create admin error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้างผู้ดูแลระบบ' },
      { status: 500 }
    );
  }
}