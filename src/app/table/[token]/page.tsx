// ===================================================
// FILE: page.tsx
// PATH: /restaurant-qr-order/src/app/table/[token]/page.tsx
// DESCRIPTION: หน้าสำหรับลูกค้าสั่งอาหาร (สแกน QR Code)
// ===================================================

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import Swal from 'sweetalert2';

interface Category {
  id: number;
  name: string;
  menuItems: MenuItem[];
}

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  maxPerOrder: number;
  isAvailable: boolean;
}

interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  maxPerOrder: number;
  notes?: string;
}

interface Table {
  id: number;
  name: string;
  isActive: boolean;
}

interface Settings {
  restaurantName: string;
  logo: string | null;
  showPrices: boolean;
  isBuffetMode: boolean;
  buffetPrice: string | null;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: string;
  adminMessage: string | null;
}

export default function CustomerOrderPage() {
  // ใช้ useParams แทน use(params)
  const params = useParams();
  const token = params.token as string;

  const [table, setTable] = useState<Table | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showOrders, setShowOrders] = useState(false);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Poll for order updates
  useEffect(() => {
    if (!table) return;
    
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [table]);

  const fetchData = async () => {
    try {
      // Fetch table by token
      const tableRes = await fetch(`/api/tables/token/${token}`);
      const tableData = await tableRes.json();
      
      if (!tableData.success) {
        setError('ไม่พบโต๊ะ หรือ QR Code ไม่ถูกต้อง');
        setLoading(false);
        return;
      }
      
      if (!tableData.data.isActive) {
        setError('โต๊ะนี้ยังไม่เปิดให้บริการ');
        setLoading(false);
        return;
      }

      setTable(tableData.data);

      // Fetch settings
      const settingsRes = await fetch('/api/settings');
      const settingsData = await settingsRes.json();
      if (settingsData.success) {
        setSettings(settingsData.data);
      }

      // Fetch menu
      const menuRes = await fetch('/api/categories?includeItems=true&activeOnly=true');
      const menuData = await menuRes.json();
      if (menuData.success) {
        setCategories(menuData.data.filter((c: Category) => c.menuItems.length > 0));
        if (menuData.data.length > 0) {
          setSelectedCategory(menuData.data[0].id);
        }
      }

      // Fetch existing orders
      await fetchOrdersForTable(tableData.data.id);

    } catch {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersForTable = async (tableId: number) => {
    try {
      const res = await fetch(`/api/orders?tableId=${tableId}&status=active`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        
        // Check for admin messages
        data.data.forEach((order: Order) => {
          if (order.adminMessage) {
            Swal.fire({
              icon: 'info',
              title: 'ข้อความจากร้าน',
              text: order.adminMessage,
              confirmButtonColor: '#ee7712',
            });
          }
        });
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
    }
  };

  const fetchOrders = async () => {
    if (!table) return;
    await fetchOrdersForTable(table.id);
  };

  const addToCart = (item: MenuItem) => {
    if (!item.isAvailable) {
      Swal.fire({ icon: 'warning', title: 'สินค้าหมด', text: 'รายการนี้ไม่พร้อมจำหน่าย' });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        if (existing.quantity >= item.maxPerOrder) {
          Swal.fire({ 
            icon: 'warning', 
            title: 'ถึงจำนวนสูงสุดแล้ว', 
            text: `สั่งได้สูงสุด ${item.maxPerOrder} รายการ`,
            timer: 2000,
            showConfirmButton: false,
          });
          return prev;
        }
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, {
        menuItemId: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: 1,
        image: item.image,
        maxPerOrder: item.maxPerOrder,
      }];
    });
  };

  const updateQuantity = (menuItemId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.menuItemId === menuItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.maxPerOrder) {
              Swal.fire({ 
                icon: 'warning', 
                title: 'ถึงจำนวนสูงสุดแล้ว',
                timer: 1500,
                showConfirmButton: false,
              });
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (menuItemId: number) => {
    setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId));
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      Swal.fire({ icon: 'warning', title: 'กรุณาเลือกรายการอาหาร' });
      return;
    }

    const result = await Swal.fire({
      title: 'ยืนยันการสั่งอาหาร?',
      html: `
        <div class="text-left">
          <p class="mb-2">รายการ ${getCartCount()} รายการ</p>
          ${!settings?.isBuffetMode ? `<p class="font-bold">ยอดรวม: ${formatCurrency(getCartTotal())}</p>` : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ee7712',
      confirmButtonText: 'ยืนยันสั่ง',
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      setSubmitting(true);
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableToken: token,
            items: cart.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              notes: item.notes,
            })),
          }),
        });

        const data = await res.json();
        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'สั่งอาหารสำเร็จ!',
            html: `
              <p>หมายเลขออเดอร์: <strong>${data.data.orderNumber}</strong></p>
              <p class="text-sm text-gray-500 mt-2">กรุณารอสักครู่ ทางร้านจะเตรียมอาหารให้</p>
            `,
            confirmButtonColor: '#ee7712',
          });
          setCart([]);
          setShowCart(false);
          fetchOrders();
        } else {
          Swal.fire({ icon: 'error', title: 'ไม่สามารถสั่งอาหารได้', text: data.error });
        }
      } catch {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
      } finally {
        setSubmitting(false);
      }
    }
  };

  const getItemInCart = (menuItemId: number) => {
    return cart.find((c) => c.menuItemId === menuItemId);
  };

  const statusLabels: Record<string, string> = {
    PENDING: '⏳ รอยืนยัน',
    CONFIRMED: '✓ ยืนยันแล้ว',
    PREPARING: '👨‍🍳 กำลังเตรียม',
    READY: '🔔 พร้อมเสิร์ฟ',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">😢</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings?.logo ? (
                <img src={settings.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <span className="text-2xl">🍽️</span>
              )}
              <div>
                <h1 className="font-bold font-display">{settings?.restaurantName || 'Restaurant'}</h1>
                <p className="text-sm text-primary-100">{table?.name}</p>
              </div>
            </div>
            
            {orders.length > 0 && (
              <button
                onClick={() => setShowOrders(true)}
                className="relative p-2 bg-white/20 rounded-lg"
              >
                <span className="text-lg">📋</span>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full flex items-center justify-center">
                  {orders.length}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-white text-primary-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Buffet Banner */}
      {settings?.isBuffetMode && settings.buffetPrice && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <p className="text-center text-yellow-800">
            🎉 บุฟเฟ่ต์ราคา <strong>{formatCurrency(settings.buffetPrice)}</strong> / ท่าน
          </p>
        </div>
      )}

      {/* Menu Items */}
      <main className="p-4">
        {selectedCategoryData && (
          <div className="space-y-3">
            {selectedCategoryData.menuItems.map((item) => {
              const cartItem = getItemInCart(item.id);
              return (
                <div
                  key={item.id}
                  className={`menu-card ${!item.isAvailable ? 'opacity-60' : ''} ${cartItem ? 'ring-2 ring-primary-500' : ''}`}
                  onClick={() => addToCart(item)}
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                      {!item.isAvailable && (
                        <span className="badge badge-danger text-xs">หมด</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      {!settings?.isBuffetMode && (
                        <p className="font-bold text-primary-600">{formatCurrency(item.price)}</p>
                      )}
                      {cartItem && (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="qty-btn"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-semibold">{cartItem.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="qty-btn"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg safe-area-bottom">
          <button
            onClick={() => setShowCart(true)}
            className="btn-primary w-full py-4 text-lg flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-1 rounded">{getCartCount()}</span>
              <span>ดูตะกร้า</span>
            </span>
            {!settings?.isBuffetMode && (
              <span>{formatCurrency(getCartTotal())}</span>
            )}
          </button>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowCart(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">🛒 ตะกร้าของคุณ</h2>
                <button onClick={() => setShowCart(false)} className="p-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {cart.map((item) => (
                <div key={item.menuItemId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    {!settings?.isBuffetMode && (
                      <p className="text-sm text-gray-500">{formatCurrency(item.price)} x {item.quantity}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.menuItemId, -1)} className="qty-btn">-</button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.menuItemId, 1)} className="qty-btn">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.menuItemId)} className="p-2 text-red-500">
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 space-y-4 safe-area-bottom">
              {!settings?.isBuffetMode && (
                <div className="flex justify-between text-lg">
                  <span className="font-medium">ยอดรวม</span>
                  <span className="font-bold text-primary-600">{formatCurrency(getCartTotal())}</span>
                </div>
              )}
              <button
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="btn-primary w-full py-4 text-lg"
              >
                {submitting ? 'กำลังสั่ง...' : '✓ ยืนยันสั่งอาหาร'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Modal */}
      {showOrders && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowOrders(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">📋 ออเดอร์ของคุณ</h2>
                <button onClick={() => setShowOrders(false)} className="p-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="card p-4 border-l-4 border-primary-500">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">#{order.orderNumber}</span>
                    <span className="text-sm bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                  {!settings?.isBuffetMode && (
                    <p className="text-gray-600">ยอดรวม: {formatCurrency(order.totalAmount)}</p>
                  )}
                </div>
              ))}

              {orders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>ยังไม่มีออเดอร์</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}