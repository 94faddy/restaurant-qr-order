// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/auth/session/route.ts
// DESCRIPTION: API สำหรับเช็ค Admin Session (รองรับ permissions)
// ===================================================

import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/session';
import prisma from '@/lib/db';
import { parsePermissions } from '@/lib/permissions';

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, isLoggedIn: false },
        { status: 401 }
      );
    }

    // ดึง permissions ล่าสุดจาก database (เผื่อมีการอัพเดท)
    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        permissions: true,
        isActive: true,
      },
    });

    // ถ้าไม่พบ admin หรือ inactive ให้ logout
    if (!admin || !admin.isActive) {
      session.destroy();
      return NextResponse.json(
        { success: false, isLoggedIn: false, error: 'บัญชีถูกปิดการใช้งาน' },
        { status: 401 }
      );
    }

    // Parse permissions
    const permissions = parsePermissions(admin.permissions);

    // อัพเดท session ถ้า permissions เปลี่ยน
    if (JSON.stringify(session.permissions) !== JSON.stringify(permissions)) {
      session.permissions = permissions;
      session.role = admin.role;
      session.name = admin.name;
      await session.save();
    }

    return NextResponse.json({
      success: true,
      isLoggedIn: true,
      data: {
        adminId: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
        permissions: permissions,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}