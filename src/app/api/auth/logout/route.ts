// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/auth/logout/route.ts
// DESCRIPTION: API สำหรับ Admin Logout
// ===================================================

import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/session';

export async function POST() {
  try {
    const session = await getAdminSession();
    session.destroy();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}