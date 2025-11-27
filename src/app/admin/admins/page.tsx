// ===================================================
// FILE: page.tsx
// PATH: /restaurant-qr-order/src/app/admin/admins/page.tsx
// DESCRIPTION: หน้าจัดการผู้ดูแลระบบ (เพิ่ม/แก้ไข/ลบ/กำหนดสิทธิ์)
// ===================================================

'use client';

import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/utils';
import { ALL_PERMISSIONS, PERMISSION_INFO, Permission } from '@/lib/permissions';
import Swal from 'sweetalert2';

interface Admin {
  id: number;
  username: string;
  name: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminFormData {
  username: string;
  password: string;
  name: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

const defaultFormData: AdminFormData = {
  username: '',
  password: '',
  name: '',
  role: 'admin',
  permissions: [],
  isActive: true,
};

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState<AdminFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admins');
      const data = await res.json();
      if (data.success) {
        setAdmins(data.data);
      } else {
        Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: data.error });
      }
    } catch (error) {
      console.error('Fetch admins error:', error);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.name) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบ' });
      return;
    }

    if (!editingAdmin && !formData.password) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกรหัสผ่าน' });
      return;
    }

    if (formData.permissions.length === 0) {
      Swal.fire({ icon: 'warning', title: 'กรุณาเลือกสิทธิ์อย่างน้อย 1 รายการ' });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        username: formData.username,
        name: formData.name,
        role: formData.role,
        permissions: formData.permissions,
        isActive: formData.isActive,
      };

      // ส่ง password เฉพาะเมื่อมีการกรอก
      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await fetch(
        editingAdmin ? `/api/admins/${editingAdmin.id}` : '/api/admins',
        {
          method: editingAdmin ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: editingAdmin ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ',
          timer: 1500,
          showConfirmButton: false,
        });
        setShowModal(false);
        resetForm();
        fetchAdmins();
      } else {
        Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: data.error });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (admin: Admin) => {
    const result = await Swal.fire({
      title: 'ลบผู้ดูแลระบบ?',
      html: `คุณต้องการลบ <strong>${admin.name}</strong> ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/admins/${admin.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1500, showConfirmButton: false });
          fetchAdmins();
        } else {
          Swal.fire({ icon: 'error', title: 'ไม่สามารถลบได้', text: data.error });
        }
      } catch {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
      }
    }
  };

  const handleToggleActive = async (admin: Admin) => {
    try {
      const res = await fetch(`/api/admins/${admin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !admin.isActive }),
      });

      const data = await res.json();
      if (data.success) {
        fetchAdmins();
      } else {
        Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: data.error });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
    }
  };

  const openEditModal = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      password: '', // ไม่แสดงรหัสผ่านเดิม
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions,
      isActive: admin.isActive,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingAdmin(null);
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const selectAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: [...ALL_PERMISSIONS],
    }));
  };

  const deselectAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: [],
    }));
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin':
        return { text: 'Super Admin', color: 'bg-purple-100 text-purple-800' };
      case 'manager':
        return { text: 'ผู้จัดการ', color: 'bg-blue-100 text-blue-800' };
      default:
        return { text: 'Admin', color: 'bg-gray-100 text-gray-800' };
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
          <h1 className="page-title">จัดการผู้ดูแลระบบ</h1>
          <p className="text-gray-500 mt-1">เพิ่ม แก้ไข ลบ และกำหนดสิทธิ์ผู้ดูแลระบบ</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            resetForm();
          }}
          className="btn-primary"
        >
          + เพิ่มผู้ดูแล
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card bg-white">
          <p className="stat-value text-primary-600">{admins.length}</p>
          <p className="stat-label">ผู้ดูแลทั้งหมด</p>
        </div>
        <div className="stat-card bg-white">
          <p className="stat-value text-green-600">
            {admins.filter((a) => a.isActive).length}
          </p>
          <p className="stat-label">เปิดใช้งาน</p>
        </div>
      </div>

      {/* Admins List */}
      {admins.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">ผู้ดูแล</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900 hidden md:table-cell">
                  ตำแหน่ง
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900 hidden lg:table-cell">
                  สิทธิ์
                </th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900">สถานะ</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-900">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {admins.map((admin) => {
                const roleInfo = getRoleLabel(admin.role);
                return (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">
                            {admin.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{admin.name}</p>
                          <p className="text-sm text-gray-500">@{admin.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell">
                      <span className={`badge ${roleInfo.color}`}>{roleInfo.text}</span>
                    </td>
                    <td className="py-4 px-6 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {admin.permissions.slice(0, 3).map((p) => (
                          <span
                            key={p}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                          >
                            {PERMISSION_INFO[p as Permission]?.icon}{' '}
                            {PERMISSION_INFO[p as Permission]?.label || p}
                          </span>
                        ))}
                        {admin.permissions.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            +{admin.permissions.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleActive(admin)}
                        className={`badge cursor-pointer transition-colors ${
                          admin.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {admin.isActive ? '✓ เปิดใช้งาน' : '✕ ปิดใช้งาน'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(admin)}
                          className="btn-sm btn-outline"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(admin)}
                          className="btn-sm btn-danger"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state py-16">
          <svg
            className="empty-state-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="empty-state-title">ไม่มีผู้ดูแลระบบ</p>
          <p className="empty-state-text">เริ่มเพิ่มผู้ดูแลระบบได้เลย</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingAdmin ? 'แก้ไขผู้ดูแลระบบ' : 'เพิ่มผู้ดูแลระบบใหม่'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* ข้อมูลพื้นฐาน */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-2">ข้อมูลพื้นฐาน</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">ชื่อผู้ใช้ *</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      placeholder="username"
                      disabled={editingAdmin?.role === 'superadmin'}
                    />
                    {editingAdmin?.role === 'superadmin' && (
                      <p className="text-xs text-gray-500 mt-1">
                        ไม่สามารถเปลี่ยนชื่อผู้ใช้ Super Admin ได้
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="label">
                      {editingAdmin ? 'รหัสผ่านใหม่ (ไม่กรอกถ้าไม่เปลี่ยน)' : 'รหัสผ่าน *'}
                    </label>
                    <input
                      type="password"
                      className="input"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder={editingAdmin ? '••••••••' : 'password'}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">ชื่อแสดง *</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="ชื่อ-นามสกุล"
                    />
                  </div>

                  <div>
                    <label className="label">ตำแหน่ง</label>
                    <select
                      className="select"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      disabled={editingAdmin?.role === 'superadmin'}
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">ผู้จัดการ</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    เปิดใช้งานบัญชีนี้
                  </label>
                </div>
              </div>

              {/* สิทธิ์การเข้าถึง */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-gray-900">สิทธิ์การเข้าถึง</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllPermissions}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      เลือกทั้งหมด
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={deselectAllPermissions}
                      className="text-sm text-gray-500 hover:underline"
                    >
                      ยกเลิกทั้งหมด
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {ALL_PERMISSIONS.map((permission) => {
                    const info = PERMISSION_INFO[permission];
                    const isSelected = formData.permissions.includes(permission);
                    return (
                      <label
                        key={permission}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="checkbox mt-0.5"
                          checked={isSelected}
                          onChange={() => togglePermission(permission)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{info.icon}</span>
                            <span className="font-medium text-gray-900">{info.label}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{info.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {formData.permissions.length === 0 && (
                  <p className="text-sm text-red-500">⚠️ กรุณาเลือกสิทธิ์อย่างน้อย 1 รายการ</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-ghost flex-1"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={saving}
                >
                  {saving ? 'กำลังบันทึก...' : editingAdmin ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ดูแล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}