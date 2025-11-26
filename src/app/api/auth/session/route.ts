// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/auth/session/route.ts
// DESCRIPTION: API สำหรับเช็ค Admin Session
// ===================================================

import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, isLoggedIn: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      isLoggedIn: true,
      data: {
        adminId: session.adminId,
        username: session.username,
        name: session.name,
        role: session.role,
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