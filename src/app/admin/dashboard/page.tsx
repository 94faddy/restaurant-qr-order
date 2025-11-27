// ===================================================
// FILE: page.tsx
// PATH: /restaurant-qr-order/src/app/admin/dashboard/page.tsx
// DESCRIPTION: หน้า Dashboard แสดงภาพรวมระบบ (ใช้เสียงแจ้งเตือนที่ตั้งค่าไว้)
// ===================================================

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { formatCurrency, formatRelativeTime, orderStatusLabels, orderStatusColors } from '@/lib/utils';
import { playNotificationSoundById } from '@/components/NotificationSoundModal';
import Swal from 'sweetalert2';

interface DashboardData {
  todayOrders: number;
  todaySales: number;
  pendingOrders: number;
  activeTables: number;
  recentOrders: Order[];
  ordersByStatus: Record<string, number>;
  topItems: { menuItemId: number; name: string; quantity: number; totalAmount: number }[];
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  table: { id: number; name: string };
  orderItems: { id: number; quantity: number; menuItem: { name: string } }[];
}

interface Settings {
  soundEnabled: boolean;
  notificationSound: number;
  soundVolume: number;
  soundDuration: number;
  notifyEnabled: boolean;
  showPrices: boolean;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationSound, setNotificationSound] = useState(1);
  const [soundVolume, setSoundVolume] = useState(50);
  const [soundDuration, setSoundDuration] = useState(100);
  const lastOrderCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef<boolean>(true);

  // เล่นเสียงแจ้งเตือน
  const playNotificationSound = useCallback(() => {
    if (soundEnabled) {
      playNotificationSoundById(notificationSound, soundVolume, soundDuration);
    }
  }, [soundEnabled, notificationSound, soundVolume, soundDuration]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      const result = await res.json();
      if (result.success) {
        // Check for new orders (skip first load)
        if (!isFirstLoadRef.current && result.data.pendingOrders > lastOrderCountRef.current && soundEnabled) {
          playNotificationSound();
          if (result.data.recentOrders[0]) {
            showNewOrderNotification(result.data.recentOrders[0]);
          }
        }
        isFirstLoadRef.current = false;
        lastOrderCountRef.current = result.data.pendingOrders;
        setData(result.data);
      }
    } catch (error) {
      console.error('Fetch dashboard error:', error);
    } finally {
      setLoading(false);
    }
  }, [soundEnabled, playNotificationSound]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const result = await res.json();
      if (result.success) {
        setSettings(result.data);
        setSoundEnabled(result.data.soundEnabled);
        setNotificationSound(result.data.notificationSound || 1);
        setSoundVolume(result.data.soundVolume ?? 50);
        setSoundDuration(result.data.soundDuration ?? 100);
      }
    } catch (error) {
      console.error('Fetch settings error:', error);
    }
  };

  const showNewOrderNotification = (order: Order) => {
    if (settings?.notifyEnabled && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('🔔 มีออเดอร์ใหม่!', {
          body: `${order.table.name} - ${order.orderItems.length} รายการ`,
          icon: '/favicon.ico',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchData();
    // Poll for new orders every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const result = await res.json();
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ',
          text: `อัพเดทสถานะเป็น "${orderStatusLabels[status]}" แล้ว`,
          timer: 1500,
          showConfirmButton: false,
        });
        fetchData();
      }
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถอัพเดทสถานะได้',
      });
    }
  };

  const toggleSound = async () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    
    // บันทึกลง database
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soundEnabled: newSoundEnabled }),
      });
    } catch (error) {
      console.error('Save sound setting error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-10 h-10"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">แดชบอร์ด</h1>
          <p className="text-gray-500 mt-1">ภาพรวมการทำงานของร้าน</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSound}
            className={`btn ${soundEnabled ? 'btn-primary' : 'btn-ghost'}`}
          >
            {soundEnabled ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                เสียงเปิด
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
                เสียงปิด
              </>
            )}
          </button>
          {/* ลิงก์ไปตั้งค่าเสียง */}
          <a href="/admin/settings" className="btn-outline btn-sm">
            ⚙️ ตั้งค่าเสียง
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">ออเดอร์วันนี้</p>
              <p className="text-3xl font-bold mt-1">{data?.todayOrders || 0}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">ยอดขายวันนี้</p>
              <p className="text-3xl font-bold mt-1">
                {settings?.showPrices ? formatCurrency(data?.todaySales || 0) : '***'}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">รอยืนยัน</p>
              <p className="text-3xl font-bold mt-1">{data?.pendingOrders || 0}</p>
            </div>
            <div className={`w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center ${data?.pendingOrders ? 'notification-pulse' : ''}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-secondary-500 to-secondary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-100 text-sm">โต๊ะใช้งาน</p>
              <p className="text-3xl font-bold mt-1">{data?.activeTables || 0}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">ออเดอร์ล่าสุด</h2>
            <a href="/admin/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              ดูทั้งหมด →
            </a>
          </div>

          {data?.recentOrders && data.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {data.recentOrders.slice(0, 5).map((order) => (
                <div 
                  key={order.id} 
                  className={`order-card order-card-${order.status.toLowerCase()}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">{order.table.name}</span>
                        <span className="text-sm text-gray-500">#{order.orderNumber}</span>
                        <span className={`badge ${orderStatusColors[order.status]}`}>
                          {orderStatusLabels[order.status]}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {order.orderItems.map((item, idx) => (
                          <span key={item.id}>
                            {item.menuItem.name} x{item.quantity}
                            {idx < order.orderItems.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className="text-gray-500">{formatRelativeTime(order.createdAt)}</span>
                        {settings?.showPrices && (
                          <span className="font-semibold text-primary-600">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        )}
                      </div>
                    </div>

                    {order.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'CONFIRMED')}
                          className="btn-success btn-sm"
                        >
                          ยืนยัน
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED')}
                          className="btn-danger btn-sm"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    )}

                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING')}
                        className="btn-primary btn-sm"
                      >
                        เริ่มทำ
                      </button>
                    )}

                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'READY')}
                        className="btn-success btn-sm"
                      >
                        พร้อมเสิร์ฟ
                      </button>
                    )}

                    {order.status === 'READY' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'COMPLETED')}
                        className="btn-secondary btn-sm"
                      >
                        เสร็จสิ้น
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state py-8">
              <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="empty-state-title">ไม่มีออเดอร์</p>
              <p className="empty-state-text">ยังไม่มีออเดอร์ที่ต้องจัดการ</p>
            </div>
          )}
        </div>

        {/* Top Items */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">เมนูขายดีวันนี้</h2>
          
          {data?.topItems && data.topItems.length > 0 ? (
            <div className="space-y-4">
              {data.topItems.map((item, index) => (
                <div key={item.menuItemId} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} รายการ
                      {settings?.showPrices && ` • ${formatCurrency(item.totalAmount)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state py-6">
              <p className="empty-state-text">ยังไม่มีข้อมูล</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}