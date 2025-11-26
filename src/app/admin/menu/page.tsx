// ===================================================
// FILE: page.tsx
// PATH: /restaurant-qr-order/src/app/(admin)/menu/page.tsx
// DESCRIPTION: หน้าจัดการเมนูอาหาร (เพิ่ม/แก้ไข/ลบ)
// ===================================================

'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import Swal from 'sweetalert2';

interface Category {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  maxPerOrder: number;
  isAvailable: boolean;
  isActive: boolean;
  categoryId: number;
  category: Category;
}

interface MenuFormData {
  name: string;
  description: string;
  categoryId: string;
  price: string;
  maxPerOrder: string;
  isAvailable: boolean;
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<MenuFormData>({
    name: '',
    description: '',
    categoryId: '',
    price: '',
    maxPerOrder: '10',
    isAvailable: true,
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, menuRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/menu'),
      ]);
      
      const catData = await catRes.json();
      const menuData = await menuRes.json();
      
      if (catData.success) setCategories(catData.data);
      if (menuData.success) setMenuItems(menuData.data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setImagePreview(data.data.url);
      } else {
        Swal.fire({ icon: 'error', title: 'อัพโหลดไม่สำเร็จ', text: data.error });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.categoryId || !formData.price) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบ' });
      return;
    }

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        maxPerOrder: parseInt(formData.maxPerOrder),
        image: imagePreview,
      };

      const res = await fetch(
        editingItem ? `/api/menu/${editingItem.id}` : '/api/menu',
        {
          method: editingItem ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: editingItem ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ',
          timer: 1500,
          showConfirmButton: false,
        });
        setShowModal(false);
        resetForm();
        fetchData();
      } else {
        Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: data.error });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'ลบรายการ?',
      text: 'คุณต้องการลบรายการนี้ใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1500, showConfirmButton: false });
          fetchData();
        }
      } catch {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
      }
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      await fetch(`/api/menu/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      fetchData();
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryFormData.name) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกชื่อหมวดหมู่' });
      return;
    }

    try {
      const res = await fetch(
        editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories',
        {
          method: editingCategory ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryFormData),
        }
      );

      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'สำเร็จ', timer: 1500, showConfirmButton: false });
        setShowCategoryModal(false);
        setCategoryFormData({ name: '', description: '' });
        setEditingCategory(null);
        fetchData();
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const result = await Swal.fire({
      title: 'ลบหมวดหมู่?',
      text: 'ต้องลบรายการอาหารในหมวดหมู่นี้ก่อน',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1500, showConfirmButton: false });
          fetchData();
        } else {
          Swal.fire({ icon: 'error', title: 'ไม่สามารถลบได้', text: data.error });
        }
      } catch {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
      }
    }
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      categoryId: item.categoryId.toString(),
      price: item.price,
      maxPerOrder: item.maxPerOrder.toString(),
      isAvailable: item.isAvailable,
    });
    setImagePreview(item.image);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      categoryId: categories[0]?.id.toString() || '',
      price: '',
      maxPerOrder: '10',
      isAvailable: true,
    });
    setImagePreview(null);
    setEditingItem(null);
  };

  const filteredItems = selectedCategory
    ? menuItems.filter((item) => item.categoryId === selectedCategory)
    : menuItems;

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
          <h1 className="page-title">จัดการเมนู</h1>
          <p className="text-gray-500 mt-1">เพิ่ม แก้ไข ลบ รายการอาหาร</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCategoryModal(true); setEditingCategory(null); setCategoryFormData({ name: '', description: '' }); }}
            className="btn-outline"
          >
            + หมวดหมู่
          </button>
          <button
            onClick={() => { setShowModal(true); resetForm(); }}
            className="btn-primary"
          >
            + เพิ่มเมนู
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`category-tab ${!selectedCategory ? 'category-tab-active' : ''}`}
        >
          ทั้งหมด ({menuItems.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`category-tab ${selectedCategory === cat.id ? 'category-tab-active' : ''}`}
          >
            {cat.name} ({menuItems.filter(m => m.categoryId === cat.id).length})
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="card overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
                    🍽️
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {!item.isAvailable && (
                    <span className="badge badge-danger">หมด</span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.category.name}</p>
                  </div>
                  <p className="font-bold text-primary-600">{formatCurrency(item.price)}</p>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">สั่งได้สูงสุด: {item.maxPerOrder} รายการ</p>
                
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleToggleAvailable(item)}
                    className={`btn-sm flex-1 ${item.isAvailable ? 'btn-success' : 'btn-ghost'}`}
                  >
                    {item.isAvailable ? '✓ มีสินค้า' : '✕ หมด'}
                  </button>
                  <button onClick={() => openEditModal(item)} className="btn-sm btn-outline">
                    แก้ไข
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="btn-sm btn-danger">
                    ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state py-16">
          <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="empty-state-title">ไม่มีรายการ</p>
          <p className="empty-state-text">เริ่มเพิ่มเมนูอาหารได้เลย</p>
        </div>
      )}

      {/* Categories List */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">หมวดหมู่ทั้งหมด</h2>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{cat.name}</p>
                {cat.description && <p className="text-sm text-gray-500">{cat.description}</p>}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditingCategory(cat);
                    setCategoryFormData({ name: cat.name, description: cat.description || '' });
                    setShowCategoryModal(true);
                  }}
                  className="btn-sm btn-ghost"
                >
                  แก้ไข
                </button>
                <button onClick={() => handleDeleteCategory(cat.id)} className="btn-sm btn-danger">
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{editingItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="label">รูปภาพ</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl text-gray-300">🍽️</span>
                    )}
                  </div>
                  <label className="btn-outline cursor-pointer">
                    {uploading ? 'กำลังอัพโหลด...' : 'เลือกรูป'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              <div>
                <label className="label">ชื่อเมนู *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น ข้าวผัดหมู"
                />
              </div>

              <div>
                <label className="label">รายละเอียด</label>
                <textarea
                  className="textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="คำอธิบายเมนู..."
                  rows={3}
                />
              </div>

              <div>
                <label className="label">หมวดหมู่ *</label>
                <select
                  className="select"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">ราคา (บาท) *</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="label">สั่งได้สูงสุด</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.maxPerOrder}
                    onChange={(e) => setFormData({ ...formData, maxPerOrder: e.target.value })}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  className="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                />
                <label htmlFor="isAvailable" className="text-sm text-gray-700">พร้อมจำหน่าย</label>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">
                  ยกเลิก
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingItem ? 'บันทึก' : 'เพิ่มเมนู'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCategoryModal(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}</h2>
            </div>
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="label">ชื่อหมวดหมู่ *</label>
                <input
                  type="text"
                  className="input"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="เช่น อาหารจานหลัก"
                />
              </div>
              <div>
                <label className="label">คำอธิบาย</label>
                <textarea
                  className="textarea"
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="btn-ghost flex-1">
                  ยกเลิก
                </button>
                <button type="submit" className="btn-primary flex-1">
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}