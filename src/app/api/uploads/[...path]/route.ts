// ===================================================
// FILE: route.ts
// PATH: src/app/api/uploads/[...path]/route.ts
// DESCRIPTION: API สำหรับ serve รูปภาพที่ upload (ใช้ absolute path)
// ===================================================

import { NextRequest, NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

// Mapping MIME types
const mimeTypes: Record<string, string> = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
};

// ✅ กำหนด path แบบ absolute (แก้ปัญหา PM2 cwd)
const UPLOADS_DIR = '/root/restaurant-qr-order/public/uploads';

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { path: pathSegments } = await params;
    const filename = pathSegments.join('/');
    
    // Validate filename (prevent path traversal)
    if (filename.includes('..') || filename.startsWith('/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 400 }
      );
    }

    // ✅ ใช้ absolute path
    const filePath = path.join(UPLOADS_DIR, filename);
    
    // Check if file exists
    if (!existsSync(filePath)) {
      // Debug info
      let files: string[] = [];
      if (existsSync(UPLOADS_DIR)) {
        files = await readdir(UPLOADS_DIR);
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'File not found',
          requested: filename,
          searchPath: filePath,
          uploadsDir: UPLOADS_DIR,
          availableFiles: files.slice(0, 10),
          cwd: process.cwd(),
        },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await readFile(filePath);
    
    // Get MIME type
    const ext = path.extname(filename).slice(1).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Serve file error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to serve file', details: String(error) },
      { status: 500 }
    );
  }
}