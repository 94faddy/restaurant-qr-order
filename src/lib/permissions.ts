// ===================================================
// FILE: permissions.ts
// PATH: /restaurant-qr-order/src/lib/permissions.ts
// DESCRIPTION: Permission constants และ utilities
// ===================================================

// รายการ permission ทั้งหมด
export const PERMISSIONS = {
  DASHBOARD: 'dashboard',
  ORDERS: 'orders',
  MENU: 'menu',
  TABLES: 'tables',
  QRCODE: 'qrcode',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  ADMINS: 'admins',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ข้อมูล permission สำหรับแสดงผล
export const PERMISSION_INFO: Record<Permission, { label: string; description: string; icon: string }> = {
  dashboard: {
    label: 'แดชบอร์ด',
    description: 'ดูภาพรวมระบบ ยอดขาย สถิติ',
    icon: '🏠',
  },
  orders: {
    label: 'รายการสั่งซื้อ',
    description: 'จัดการออเดอร์ ยืนยัน ยกเลิก',
    icon: '📋',
  },
  menu: {
    label: 'จัดการเมนู',
    description: 'เพิ่ม แก้ไข ลบ เมนูอาหาร',
    icon: '📖',
  },
  tables: {
    label: 'จัดการโต๊ะ',
    description: 'เพิ่ม แก้ไข ลบ โต๊ะ',
    icon: '🪑',
  },
  qrcode: {
    label: 'QR Code',
    description: 'สร้างและพิมพ์ QR Code',
    icon: '📱',
  },
  reports: {
    label: 'รายงาน',
    description: 'ดูรายงานยอดขาย สถิติ',
    icon: '📊',
  },
  settings: {
    label: 'ตั้งค่า',
    description: 'ตั้งค่าระบบทั่วไป',
    icon: '⚙️',
  },
  admins: {
    label: 'จัดการผู้ดูแล',
    description: 'เพิ่ม แก้ไข ลบ ผู้ดูแลระบบ',
    icon: '👥',
  },
};

// permission ทั้งหมดเป็น array
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

// ตรวจสอบว่ามี permission หรือไม่
export function hasPermission(userPermissions: string[], permission: Permission): boolean {
  return userPermissions.includes(permission);
}

// ตรวจสอบว่ามี permission อย่างน้อยหนึ่งอันหรือไม่
export function hasAnyPermission(userPermissions: string[], permissions: Permission[]): boolean {
  return permissions.some(p => userPermissions.includes(p));
}

// ตรวจสอบว่ามี permission ทั้งหมดหรือไม่
export function hasAllPermissions(userPermissions: string[], permissions: Permission[]): boolean {
  return permissions.every(p => userPermissions.includes(p));
}

// Parse permissions จาก JSON string
export function parsePermissions(permissionsJson: string | null): string[] {
  if (!permissionsJson) return [];
  try {
    const parsed = JSON.parse(permissionsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Mapping หน้า admin กับ permission ที่ต้องการ
export const PAGE_PERMISSIONS: Record<string, Permission> = {
  '/admin/dashboard': PERMISSIONS.DASHBOARD,
  '/admin/orders': PERMISSIONS.ORDERS,
  '/admin/menu': PERMISSIONS.MENU,
  '/admin/tables': PERMISSIONS.TABLES,
  '/admin/qrcode': PERMISSIONS.QRCODE,
  '/admin/reports': PERMISSIONS.REPORTS,
  '/admin/settings': PERMISSIONS.SETTINGS,
  '/admin/admins': PERMISSIONS.ADMINS,
};

// หา permission ที่ต้องการสำหรับ path
export function getRequiredPermission(path: string): Permission | null {
  // ตรวจสอบ exact match ก่อน
  if (PAGE_PERMISSIONS[path]) {
    return PAGE_PERMISSIONS[path];
  }
  
  // ตรวจสอบ prefix match
  for (const [pagePath, permission] of Object.entries(PAGE_PERMISSIONS)) {
    if (path.startsWith(pagePath)) {
      return permission;
    }
  }
  
  return null;
}