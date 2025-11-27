// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/settings/route.ts
// DESCRIPTION: API สำหรับจัดการการตั้งค่าระบบ (รองรับ notificationSound, soundVolume, soundDuration)
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSession } from '@/lib/session';
export const dynamic = 'force-dynamic';

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
          notificationSound: 1, // default เสียงแบบ 1
          soundVolume: 50,      // default ความดัง 50%
          soundDuration: 100,   // default ระยะเวลา 100%
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
      notificationSound,
      soundVolume,
      soundDuration,
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
          notificationSound: notificationSound || 1,
          soundVolume: soundVolume ?? 50,
          soundDuration: soundDuration ?? 100,
          notifyEnabled: notifyEnabled !== false,
          showPrices: showPrices !== false,
          isBuffetMode: isBuffetMode || false,
          buffetPrice: buffetPrice ? parseFloat(buffetPrice) : null,
          currency: currency || 'THB',
        },
      });
    } else {
      const updateData: Record<string, unknown> = {};
      
      if (restaurantName !== undefined) updateData.restaurantName = restaurantName;
      if (logo !== undefined) updateData.logo = logo;
      if (soundEnabled !== undefined) updateData.soundEnabled = soundEnabled;
      if (notificationSound !== undefined) updateData.notificationSound = notificationSound;
      if (soundVolume !== undefined) updateData.soundVolume = soundVolume;
      if (soundDuration !== undefined) updateData.soundDuration = soundDuration;
      if (notifyEnabled !== undefined) updateData.notifyEnabled = notifyEnabled;
      if (showPrices !== undefined) updateData.showPrices = showPrices;
      if (isBuffetMode !== undefined) updateData.isBuffetMode = isBuffetMode;
      if (buffetPrice !== undefined) updateData.buffetPrice = buffetPrice ? parseFloat(buffetPrice) : null;
      if (currency !== undefined) updateData.currency = currency;

      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: updateData,
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