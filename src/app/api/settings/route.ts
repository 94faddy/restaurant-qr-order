// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/settings/route.ts
// DESCRIPTION: API สำหรับจัดการการตั้งค่าระบบ
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSession } from '@/lib/session';

// GET - ดึงการตั้งค่า
export async function GET() {
  try {
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      // Create default settings
      settings = await prisma.settings.create({
        data: {
          restaurantName: 'ร้านอาหาร QR Order',
          soundEnabled: true,
          notifyEnabled: true,
          showPrices: true,
          isBuffetMode: false,
          currency: 'THB',
        },
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    );
  }
}

// PUT - อัพเดทการตั้งค่า
export async function PUT(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const {
      restaurantName,
      logo,
      soundEnabled,
      notifyEnabled,
      showPrices,
      isBuffetMode,
      buffetPrice,
      currency,
    } = await request.json();

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          restaurantName: restaurantName || 'ร้านอาหาร QR Order',
          logo,
          soundEnabled: soundEnabled !== false,
          notifyEnabled: notifyEnabled !== false,
          showPrices: showPrices !== false,
          isBuffetMode: isBuffetMode || false,
          buffetPrice: buffetPrice ? parseFloat(buffetPrice) : null,
          currency: currency || 'THB',
        },
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          restaurantName,
          logo,
          soundEnabled,
          notifyEnabled,
          showPrices,
          isBuffetMode,
          buffetPrice: buffetPrice ? parseFloat(buffetPrice) : null,
          currency,
        },
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่า' },
      { status: 500 }
    );
  }
}