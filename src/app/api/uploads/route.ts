// ===================================================
// FILE: route.ts
// PATH: src/app/api/uploads/route.ts  ← ต้องอยู่ในโฟลเดอร์ uploads
// DESCRIPTION: API สำหรับ upload รูปภาพ (POST) และ serve รูป (GET)
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// ⚠️ ใช้ absolute path เพื่อหลีกเลี่ยงปัญหา PM2
const UPLOAD_DIR = '/root/restaurant-qr-order/public/uploads';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบไฟล์' },
        { status: 400 }
      );
    }

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'รองรับเฉพาะไฟล์รูปภาพ' },
        { status: 400 }
      );
    }

    // สร้างโฟลเดอร์ถ้ายังไม่มี
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // สร้างชื่อไฟล์ที่ไม่ซ้ำ
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}-${random}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // บันทึกไฟล์
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    console.log(`✅ Uploaded: ${filepath}`);

    // ส่งกลับ URL สำหรับเข้าถึงรูป
    const url = `/api/uploads/${filename}`;
    
    // ✅ แก้ไข response format ให้ตรงกับที่ page.tsx ต้องการ
    return NextResponse.json({
      success: true,
      data: {
        url: url,
        filename: filename,
      }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการอัพโหลด' },
      { status: 500 }
    );
  }
}

// GET - แสดงรายการไฟล์ (optional)
export async function GET() {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      return NextResponse.json({ success: true, files: [] });
    }
    
    const files = await readdir(UPLOAD_DIR);
    return NextResponse.json({ 
      success: true, 
      files: files.map(f => `/api/uploads/${f}`)
    });
  } catch (error) {
    console.error('List files error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}