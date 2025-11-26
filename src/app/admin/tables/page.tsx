// ===================================================
// FILE: page.tsx
// PATH: /restaurant-qr-order/src/app/(admin)/tables/page.tsx
// DESCRIPTION: หน้าจัดการโต๊ะ (เพิ่ม/แก้ไข/ลบ/เปิด-ปิด)
// ===================================================

'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

interface Table {
  id: number;
  name: string;
  qrCode: string;
  qrToken: string;
  isActive: boolean;
  isOccupied: boolean;
  sortOrder: number;
  orders?: { id: number; status: string }[];
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables?includeOrders=true');
      const data = await res.json();
      if (data.success) setTables(data.data);
    } catch (error) {
      console.error('Fetch tables error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกชื่อโต๊ะ' });
      return;
    }

    try {
      const res = await fetch(
        editingTable ? `/api/tables/${editingTable.id}` : '/api/tables',
        {
          method: editingTable ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: editingTable ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ',
          timer: 1500,
          showConfirmButton: false,
        });
        setShowModal(false);
        setFormData({ name: '' });
        setEditingTable(null);
        fetchTables();
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
    }
  };

  const handleToggleActive = async (table: Table) => {
    if (table.isOccupied) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่สามารถปิดโต๊ะได้',
        text: 'โต๊ะนี้มีลูกค้าใช้งานอยู่',
      });
      return;
    }

    try {
      await fetch(`/api/tables/${table.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !table.isActive }),
      });
      fetchTables();
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
    }
  };

  const handleClearTable = async (table: Table) => {
    const result = await Swal.fire({
      title: 'เคลียร์โต๊ะ?',
      text: `ต้องการเคลียร์ ${table.name} หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ee7712',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'เคลียร์',
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      try {
        await fetch(`/api/tables/${table.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isOccupied: false }),
        });
        Swal.fire({ icon: 'success', title: 'เคลียร์โต๊ะแล้ว', timer: 1500, showConfirmButton: false });
        fetchTables();
      } catch {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
      }
    }
  };

  const handleDelete = async (table: Table) => {
    if (table.isOccupied) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่สามารถลบได้',
        text: 'โต๊ะนี้มีลูกค้าใช้งานอยู่',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'ลบโต๊ะ?',
      text: `ต้องการลบ ${table.name} หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/tables/${table.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1500, showConfirmButton: false });
          fetchTables();
        } else {
          Swal.fire({ icon: 'error', title: 'ไม่สามารถลบได้', text: data.error });
        }
      } catch {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
      }
    }
  };

  const handleRegenerateQR = async (table: Table) => {
    const result = await Swal.fire({
      title: 'สร้าง QR Code ใหม่?',
      text: 'QR Code เดิมจะใช้งานไม่ได้',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ee7712',
      confirmButtonText: 'สร้างใหม่',
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      try {
        await fetch(`/api/tables/${table.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ regenerateQR: true }),
        });
        Swal.fire({ icon: 'success', title: 'สร้าง QR Code ใหม่แล้ว', timer: 1500, showConfirmButton: false });
        fetchTables();
      } catch {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
      }
    }
  };

  const openEditModal = (table: Table) => {
    setEditingTable(table);
    setFormData({ name: table.name });
    setShowModal(true);
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
          <h1 className="page-title">จัดการโต๊ะ</h1>
          <p className="text-gray-500 mt-1">เพิ่ม แก้ไข เปิด/ปิด โต๊ะ</p>
        </div>
        <div className="flex gap-2">
          <a href="/qrcode" className="btn-outline">
            🖨️ พิมพ์ QR Code
          </a>
          <button
            onClick={() => { setShowModal(true); setEditingTable(null); setFormData({ name: '' }); }}
            className="btn-primary"
          >
            + เพิ่มโต๊ะ
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card bg-white">
          <p className="stat-value text-primary-600">{tables.length}</p>
          <p className="stat-label">โต๊ะทั้งหมด</p>
        </div>
        <div className="stat-card bg-white">
          <p className="stat-value text-green-600">{tables.filter(t => t.isActive).length}</p>
          <p className="stat-label">เปิดใช้งาน</p>
        </div>
        <div className="stat-card bg-white">
          <p className="stat-value text-yellow-600">{tables.filter(t => t.isOccupied).length}</p>
          <p className="stat-label">มีลูกค้า</p>
        </div>
      </div>

      {/* Tables Grid */}
      {tables.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`table-card ${
                !table.isActive ? 'table-card-inactive' :
                table.isOccupied ? 'table-card-occupied' : ''
              }`}
            >
              <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl font-bold
                ${table.isOccupied ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}
              ">
                {table.isOccupied ? '👥' : '🪑'}
              </div>
              
              <h3 className="font-semibold text-gray-900">{table.name}</h3>
              
              <div className="flex flex-wrap justify-center gap-1 mt-2">
                {!table.isActive && (
                  <span className="badge badge-danger text-xs">ปิด</span>
                )}
                {table.isOccupied && (
                  <span className="badge badge-warning text-xs">มีลูกค้า</span>
                )}
                {table.isActive && !table.isOccupied && (
                  <span className="badge badge-success text-xs">ว่าง</span>
                )}
              </div>

              {table.orders && table.orders.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {table.orders.length} ออเดอร์
                </p>
              )}

              <div className="flex flex-wrap justify-center gap-1 mt-4">
                <button
                  onClick={() => handleToggleActive(table)}
                  className={`btn-sm ${table.isActive ? 'btn-success' : 'btn-ghost'}`}
                  title={table.isActive ? 'ปิดโต๊ะ' : 'เปิดโต๊ะ'}
                >
                  {table.isActive ? '✓' : '○'}
                </button>
                
                {table.isOccupied && (
                  <button
                    onClick={() => handleClearTable(table)}
                    className="btn-sm btn-outline"
                    title="เคลียร์โต๊ะ"
                  >
                    🧹
                  </button>
                )}
                
                <button
                  onClick={() => openEditModal(table)}
                  className="btn-sm btn-ghost"
                  title="แก้ไข"
                >
                  ✏️
                </button>
                
                <button
                  onClick={() => handleRegenerateQR(table)}
                  className="btn-sm btn-ghost"
                  title="สร้าง QR ใหม่"
                >
                  🔄
                </button>
                
                <button
                  onClick={() => handleDelete(table)}
                  className="btn-sm btn-danger"
                  title="ลบ"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state py-16">
          <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
          </svg>
          <p className="empty-state-title">ยังไม่มีโต๊ะ</p>
          <p className="empty-state-text">เริ่มเพิ่มโต๊ะได้เลย</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{editingTable ? 'แก้ไขโต๊ะ' : 'เพิ่มโต๊ะใหม่'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">ชื่อโต๊ะ *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น โต๊ะ 1, VIP1, ริมหน้าต่าง"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">
                  ยกเลิก
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingTable ? 'บันทึก' : 'เพิ่มโต๊ะ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}