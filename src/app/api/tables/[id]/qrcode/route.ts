// ===================================================
// FILE: route.ts
// PATH: /restaurant-qr-order/src/app/api/tables/[id]/qrcode/route.ts
// DESCRIPTION: API สำหรับสร้าง QR Code ของโต๊ะ
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import QRCode from 'qrcode';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - สร้าง QR Code สำหรับโต๊ะ
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'png'; // png or svg
    const size = parseInt(searchParams.get('size') || '300');

    const table = await prisma.table.findUnique({
      where: { id: parseInt(id) },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบโต๊ะ' },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const orderUrl = `${baseUrl}/table/${table.qrToken}`;

    if (format === 'svg') {
      const svg = await QRCode.toString(orderUrl, {
        type: 'svg',
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Default: PNG
    const qrBuffer = await QRCode.toBuffer(orderUrl, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    return new NextResponse(new Uint8Array(qrBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้าง QR Code' },
      { status: 500 }
    );
  }
}