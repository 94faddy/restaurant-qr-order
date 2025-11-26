// ===================================================
// FILE: page.tsx
// PATH: /restaurant-qr-order/src/app/admin/orders/page.tsx
// DESCRIPTION: หน้าจัดการรายการสั่งซื้อ (สามารถยกเลิกรายการทีละรายการได้)
// ===================================================

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { formatCurrency, formatRelativeTime, formatDate, orderStatusLabels, orderStatusColors } from '@/lib/utils';
import Swal from 'sweetalert2';

interface OrderItem {
  id: number; 
  quantity: number; 
  unitPrice: string;
  totalPrice: string;
  notes: string | null;
  menuItem: { id: number; name: string; image: string | null };
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: string;
  notes: string | null;
  adminMessage: string | null;
  createdAt: string;
  table: { id: number; name: string };
  orderItems: OrderItem[];
}

type FilterStatus = 'all' | 'active' | 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('active');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPendingCountRef = useRef<number>(0);
  const selectedOrderIdRef = useRef<number | null>(null); // ✅ ใช้ ref แทน

  // ✅ Sync selectedOrder.id กับ ref
  useEffect(() => {
    selectedOrderIdRef.current = selectedOrder?.id ?? null;
  }, [selectedOrder]);

  const fetchOrders = useCallback(async () => {
    try {
      let url = '/api/orders';
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      
      const res = await fetch(url);
      const result = await res.json();
      
      if (result.success) {
        const pendingCount = result.data.filter((o: Order) => o.status === 'PENDING').length;
        
        if (pendingCount > lastPendingCountRef.current && soundEnabled) {
          playNotificationSound();
        }
        lastPendingCountRef.current = pendingCount;
        
        setOrders(result.data);
        
        // ✅ อัพเดท selectedOrder โดยใช้ ref (ไม่ทำให้ useCallback สร้างใหม่)
        if (selectedOrderIdRef.current) {
          const updated = result.data.find((o: Order) => o.id === selectedOrderIdRef.current);
          if (updated) {
            setSelectedOrder(updated);
          }
        }
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, soundEnabled]); // ✅ ไม่มี selectedOrder ใน dependency แล้ว

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
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
        fetchOrders();
        if (status === 'CANCELLED' || status === 'COMPLETED') {
          setSelectedOrder(null);
        }
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
    }
  };

  // ✅ ฟังก์ชันลบรายการอาหารทีละรายการ (พร้อมถามเหตุผล)
  const handleDeleteOrderItem = async (orderId: number, itemId: number, itemName: string) => {
    const result = await Swal.fire({
      title: 'ยกเลิกรายการ?',
      html: `
        <p class="mb-4">ต้องการยกเลิก "<strong>${itemName}</strong>" ใช่หรือไม่?</p>
        <input id="cancel-reason" class="swal2-input" placeholder="เหตุผล (ไม่บังคับ)" style="margin-top: 0;">
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ยกเลิกรายการ',
      cancelButtonText: 'ไม่',
      preConfirm: () => {
        const reasonInput = document.getElementById('cancel-reason') as HTMLInputElement;
        return reasonInput?.value || '';
      },
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: result.value }),
        });
        const data = await res.json();
        
        if (data.success) {
          if (data.orderCancelled) {
            Swal.fire({
              icon: 'info',
              title: 'ยกเลิก Order แล้ว',
              text: 'เนื่องจากไม่มีรายการเหลือ Order จึงถูกยกเลิก',
              timer: 2000,
              showConfirmButton: false,
            });
            setSelectedOrder(null);
          } else {
            Swal.fire({
              icon: 'success',
              title: 'ลบรายการแล้ว',
              text: 'ลูกค้าจะได้รับแจ้งเตือน',
              timer: 1500,
              showConfirmButton: false,
            });
            // อัพเดท selectedOrder ด้วยข้อมูลใหม่
            setSelectedOrder(data.data);
          }
          fetchOrders();
        } else {
          Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: data.error });
        }
      } catch {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
      }
    }
  };

  const handleSendMessage = async (orderId: number) => {
    const { value: message } = await Swal.fire({
      title: 'ส่งข้อความถึงโต๊ะ',
      input: 'textarea',
      inputPlaceholder: 'พิมพ์ข้อความ...',
      showCancelButton: true,
      confirmButtonText: 'ส่ง',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ee7712',
    });

    if (message) {
      try {
        await fetch(`/api/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminMessage: message, isNotified: false }),
        });
        
        Swal.fire({
          icon: 'success',
          title: 'ส่งข้อความแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });
        fetchOrders();
      } catch {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
      }
    }
  };

  // ✅ ฟังก์ชันยกเลิก Order ทั้งหมด (พร้อมถามเหตุผล)
  const handleCancelOrder = async (orderId: number, orderNumber?: string) => {
    const result = await Swal.fire({
      title: 'ยกเลิก Order ทั้งหมด?',
      html: `
        <p class="mb-4">คุณต้องการยกเลิก Order นี้ทั้งหมดใช่หรือไม่?</p>
        <input id="cancel-reason" class="swal2-input" placeholder="เหตุผล (ไม่บังคับ)" style="margin-top: 0;">
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ยกเลิก Order',
      cancelButtonText: 'ไม่',
      preConfirm: () => {
        const reasonInput = document.getElementById('cancel-reason') as HTMLInputElement;
        return reasonInput?.value || '';
      },
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'CANCELLED',
            cancelReason: result.value,
          }),
        });

        const data = await res.json();
        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'ยกเลิก Order แล้ว',
            text: 'ลูกค้าจะได้รับแจ้งเตือน',
            timer: 1500,
            showConfirmButton: false,
          });
          fetchOrders();
          setSelectedOrder(null);
        }
      } catch {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
      }
    }
  };

  const filterTabs: { value: FilterStatus; label: string; count?: number }[] = [
    { value: 'active', label: 'กำลังดำเนินการ', count: orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status)).length },
    { value: 'PENDING', label: 'รอยืนยัน', count: orders.filter(o => o.status === 'PENDING').length },
    { value: 'CONFIRMED', label: 'ยืนยันแล้ว' },
    { value: 'PREPARING', label: 'กำลังเตรียม' },
    { value: 'READY', label: 'พร้อมเสิร์ฟ' },
    { value: 'COMPLETED', label: 'เสร็จสิ้น' },
    { value: 'CANCELLED', label: 'ยกเลิก' },
    { value: 'all', label: 'ทั้งหมด' },
  ];

  return (
    <div className="space-y-6">
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">รายการสั่งซื้อ</h1>
          <p className="text-gray-500 mt-1">จัดการออเดอร์จากลูกค้า</p>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`btn ${soundEnabled ? 'btn-primary' : 'btn-ghost'}`}
        >
          {soundEnabled ? '🔔 เสียงเปิด' : '🔕 เสียงปิด'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setFilter(tab.value); setLoading(true); }}
            className={`category-tab ${filter === tab.value ? 'category-tab-active' : ''}`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner w-10 h-10"></div>
        </div>
      ) : orders.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className={`order-card order-card-${order.status.toLowerCase()} cursor-pointer hover:shadow-lg transition-shadow`}
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{order.table.name}</span>
                    <span className={`badge ${orderStatusColors[order.status]}`}>
                      {orderStatusLabels[order.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">#{order.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-600">{formatCurrency(order.totalAmount)}</p>
                  <p className="text-xs text-gray-500">{formatRelativeTime(order.createdAt)}</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm text-gray-600 font-medium mb-2">
                  {order.orderItems.length} รายการ
                </p>
                <div className="space-y-1">
                  {order.orderItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.menuItem.name} x{item.quantity}
                        {item.notes && <span className="text-yellow-600 ml-1">📝</span>}
                      </span>
                      <span className="text-gray-500">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                  {order.orderItems.length > 3 && (
                    <p className="text-sm text-gray-400">+{order.orderItems.length - 3} รายการ</p>
                  )}
                </div>
              </div>

              {order.notes && (
                <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">📝 {order.notes}</p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                {order.status === 'PENDING' && (
                  <>
                    <button onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')} className="btn-success btn-sm flex-1">
                      ✓ ยืนยัน
                    </button>
                    <button onClick={() => handleCancelOrder(order.id)} className="btn-danger btn-sm">
                      ✕
                    </button>
                  </>
                )}
                {order.status === 'CONFIRMED' && (
                  <button onClick={() => handleUpdateStatus(order.id, 'PREPARING')} className="btn-primary btn-sm flex-1">
                    🍳 เริ่มทำ
                  </button>
                )}
                {order.status === 'PREPARING' && (
                  <button onClick={() => handleUpdateStatus(order.id, 'READY')} className="btn-success btn-sm flex-1">
                    ✓ พร้อมเสิร์ฟ
                  </button>
                )}
                {order.status === 'READY' && (
                  <button onClick={() => handleUpdateStatus(order.id, 'COMPLETED')} className="btn-secondary btn-sm flex-1">
                    ✓ เสร็จสิ้น
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state py-16">
          <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="empty-state-title">ไม่พบออเดอร์</p>
          <p className="empty-state-text">ไม่มีออเดอร์ในสถานะนี้</p>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selectedOrder.table.name}</h2>
                  <p className="text-gray-500">#{selectedOrder.orderNumber}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`badge ${orderStatusColors[selectedOrder.status]}`}>
                  {orderStatusLabels[selectedOrder.status]}
                </span>
                <span className="text-sm text-gray-500">{formatDate(selectedOrder.createdAt, 'long')}</span>
              </div>

              {/* ✅ รายการอาหาร พร้อมปุ่มยกเลิกแต่ละรายการ */}
              <div className="border rounded-lg divide-y">
                {selectedOrder.orderItems.map((item) => (
                  <div key={item.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.menuItem.image ? (
                          <img src={item.menuItem.image} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-2xl">🍽️</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{item.menuItem.name}</p>
                        <p className="text-sm text-gray-500">x{item.quantity} @ {formatCurrency(item.unitPrice)}</p>
                        {item.notes && (
                          <p className="text-sm text-yellow-600 mt-1">📝 {item.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
                        {/* ✅ ปุ่มยกเลิกรายการ (แสดงเฉพาะสถานะที่ยังไม่เสร็จ) */}
                        {['PENDING', 'CONFIRMED', 'PREPARING'].includes(selectedOrder.status) && (
                          <button
                            onClick={() => handleDeleteOrderItem(selectedOrder.id, item.id, item.menuItem.name)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="ยกเลิกรายการนี้"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedOrder.notes && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">หมายเหตุจากลูกค้า:</p>
                  <p className="text-sm text-yellow-700">{selectedOrder.notes}</p>
                </div>
              )}

              {selectedOrder.adminMessage && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">ข้อความที่ส่งถึงลูกค้า:</p>
                  <p className="text-sm text-blue-700">{selectedOrder.adminMessage}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-semibold">ยอดรวม</span>
                <span className="text-2xl font-bold text-primary-600">{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4">
                <button onClick={() => handleSendMessage(selectedOrder.id)} className="btn-outline flex-1">
                  💬 ส่งข้อความ
                </button>
                
                {selectedOrder.status === 'PENDING' && (
                  <>
                    <button onClick={() => handleUpdateStatus(selectedOrder.id, 'CONFIRMED')} className="btn-success flex-1">
                      ✓ ยืนยัน
                    </button>
                    <button onClick={() => handleCancelOrder(selectedOrder.id)} className="btn-danger">
                      ยกเลิก Order
                    </button>
                  </>
                )}
                {selectedOrder.status === 'CONFIRMED' && (
                  <button onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')} className="btn-primary flex-1">
                    🍳 เริ่มทำ
                  </button>
                )}
                {selectedOrder.status === 'PREPARING' && (
                  <button onClick={() => handleUpdateStatus(selectedOrder.id, 'READY')} className="btn-success flex-1">
                    ✓ พร้อมเสิร์ฟ
                  </button>
                )}
                {selectedOrder.status === 'READY' && (
                  <button onClick={() => handleUpdateStatus(selectedOrder.id, 'COMPLETED')} className="btn-secondary flex-1">
                    ✓ เสร็จสิ้น
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}