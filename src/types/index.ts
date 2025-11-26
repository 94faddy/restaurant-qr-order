// ===================================================
// FILE: index.ts
// PATH: /restaurant-qr-order/src/types/index.ts
// DESCRIPTION: TypeScript Type Definitions
// ===================================================

import { Prisma } from '@prisma/client';

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Category Types
export type Category = Prisma.CategoryGetPayload<{
  include: { menuItems: true };
}>;

export type CategoryWithItems = Prisma.CategoryGetPayload<{
  include: {
    menuItems: {
      where: { isActive: true; isAvailable: true };
      orderBy: { sortOrder: 'asc' };
    };
  };
}>;

// MenuItem Types
export type MenuItem = Prisma.MenuItemGetPayload<{
  include: { category: true };
}>;

export interface MenuItemFormData {
  name: string;
  description?: string;
  categoryId: number;
  price: number;
  maxPerOrder: number;
  isAvailable: boolean;
  image?: File | null;
}

// Table Types
export type Table = Prisma.TableGetPayload<object>;

export type TableWithOrders = Prisma.TableGetPayload<{
  include: {
    orders: {
      where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] } };
      include: { orderItems: { include: { menuItem: true } } };
    };
  };
}>;

// Order Types
export type Order = Prisma.OrderGetPayload<{
  include: {
    table: true;
    orderItems: {
      include: { menuItem: true };
    };
  };
}>;

export type OrderItem = Prisma.OrderItemGetPayload<{
  include: { menuItem: true };
}>;

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface CreateOrderData {
  tableId: number;
  items: {
    menuItemId: number;
    quantity: number;
    notes?: string;
  }[];
  notes?: string;
}

// Cart Types
export interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  notes?: string;
  maxPerOrder: number;
}

// Settings Types
export type Settings = Prisma.SettingsGetPayload<object>;

export interface SettingsFormData {
  restaurantName: string;
  soundEnabled: boolean;
  notifyEnabled: boolean;
  showPrices: boolean;
  isBuffetMode: boolean;
  buffetPrice?: number;
}

// Report Types
export interface DailySummary {
  date: string;
  totalOrders: number;
  totalAmount: number;
  confirmedOrders: number;
  cancelledOrders: number;
}

export interface SalesReport {
  period: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topItems: {
    menuItemId: number;
    name: string;
    quantity: number;
    totalAmount: number;
  }[];
}

// Notification Types
export interface OrderNotification {
  orderId: number;
  orderNumber: string;
  tableId: number;
  tableName: string;
  status: OrderStatus;
  itemCount: number;
  totalAmount: number;
  createdAt: string;
}

// Admin Types
export interface AdminLoginData {
  username: string;
  password: string;
}

// Dashboard Stats
export interface DashboardStats {
  todayOrders: number;
  todaySales: number;
  pendingOrders: number;
  activeTables: number;
  recentOrders: Order[];
}