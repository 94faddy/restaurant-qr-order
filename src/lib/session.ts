// ===================================================
// FILE: session.ts
// PATH: /restaurant-qr-order/src/lib/session.ts
// DESCRIPTION: Session Management สำหรับ Admin และ Customer
// ===================================================

import { getIronSession, SessionOptions, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Session Data Types
export interface AdminSessionData {
  isLoggedIn: boolean;
  adminId?: number;
  username?: string;
  name?: string;
  role?: string;
  permissions?: string[]; // เพิ่ม permissions
}

export interface CustomerSessionData {
  tableId?: number;
  tableName?: string;
  tableToken?: string;
  sessionToken?: string;
  cart?: CartItem[];
}

export interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  notes?: string;
}

// ตรวจสอบว่าใช้ HTTPS หรือไม่ (สำหรับ ngrok หรือ production)
const isSecure = () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  return appUrl.startsWith('https://') || process.env.NODE_ENV === 'production';
};

// Session Options
const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'restaurant_session',
  cookieOptions: {
    secure: isSecure(),
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

const customerSessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'customer_session',
  cookieOptions: {
    secure: isSecure(),
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 4, // 4 hours
  },
};

// Get Admin Session
export async function getAdminSession(): Promise<IronSession<AdminSessionData>> {
  const cookieStore = await cookies();
  return getIronSession<AdminSessionData>(cookieStore, sessionOptions);
}

// Get Customer Session
export async function getCustomerSession(): Promise<IronSession<CustomerSessionData>> {
  const cookieStore = await cookies();
  return getIronSession<CustomerSessionData>(cookieStore, customerSessionOptions);
}

// Middleware helpers
export async function getAdminSessionFromRequest(
  req: NextRequest
): Promise<IronSession<AdminSessionData>> {
  const res = NextResponse.next();
  return getIronSession<AdminSessionData>(req, res, sessionOptions);
}

export async function getCustomerSessionFromRequest(
  req: NextRequest
): Promise<IronSession<CustomerSessionData>> {
  const res = NextResponse.next();
  return getIronSession<CustomerSessionData>(req, res, customerSessionOptions);
}

// Default session values
export const defaultAdminSession: AdminSessionData = {
  isLoggedIn: false,
  permissions: [],
};

export const defaultCustomerSession: CustomerSessionData = {
  cart: [],
};