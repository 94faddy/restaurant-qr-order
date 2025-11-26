// ===================================================
// FILE: middleware.ts
// PATH: /restaurant-qr-order/src/middleware.ts
// DESCRIPTION: Middleware สำหรับ handle headers และ ngrok
// ===================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Skip ngrok browser warning
  response.headers.set('ngrok-skip-browser-warning', 'true');

  return response;
}

// กำหนด paths ที่ต้องการให้ middleware ทำงาน
export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|sounds|uploads).*)',
  ],
};