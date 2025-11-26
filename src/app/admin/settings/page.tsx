// ===================================================
// FILE: page.tsx
// PATH: /restaurant-qr-order/src/app/(admin)/settings/page.tsx
// DESCRIPTION: หน้าตั้งค่าระบบ
// ===================================================

'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

interface Settings {
  id: number;
  restaurantName: string;
  logo: string | null;
  soundEnabled: boolean;
  notifyEnabled: boolean;
  showPrices: boolean;
  isBuffetMode: boolean;
  buffetPrice: string | null;
  currency: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Fetch settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

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
        setSettings({ ...settings, logo: data.data.url });
      } else {
        Swal.fire({ icon: 'error', title: 'อัพโหลดไม่สำเร็จ', text: data.error });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: data.error });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
    } finally {
      setSaving(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        Swal.fire({
          icon: 'success',
          title: 'เปิดการแจ้งเตือนแล้ว',
          text: 'คุณจะได้รับการแจ้งเตือนเมื่อมีออเดอร์ใหม่',
          timer: 2000,
          showConfirmButton: false,
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-10 h-10"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">ไม่สามารถโหลดการตั้งค่าได้</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="page-title">ตั้งค่าระบบ</h1>
        <p className="text-gray-500 mt-1">กำหนดค่าต่างๆ ของระบบ</p>
      </div>

      {/* Restaurant Info */}
      <div className="card p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">ข้อมูลร้าน</h2>
        
        {/* Logo */}
        <div>
          <label className="label">โลโก้ร้าน</label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              {settings.logo ? (
                <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">🍽️</span>
              )}
            </div>
            <label className="btn-outline cursor-pointer">
              {uploading ? 'กำลังอัพโหลด...' : 'เปลี่ยนโลโก้'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Restaurant Name */}
        <div>
          <label className="label">ชื่อร้าน</label>
          <input
            type="text"
            className="input"
            value={settings.restaurantName}
            onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
            placeholder="ชื่อร้านอาหาร"
          />
        </div>
      </div>

      {/* Notification Settings */}
      <div className="card p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">การแจ้งเตือน</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">เสียงแจ้งเตือน</p>
              <p className="text-sm text-gray-500">เปิดเสียงเมื่อมีออเดอร์ใหม่</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">การแจ้งเตือนเบราว์เซอร์</p>
              <p className="text-sm text-gray-500">รับ notification เมื่อมีออเดอร์ใหม่</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifyEnabled}
                  onChange={(e) => setSettings({ ...settings, notifyEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
              <button onClick={requestNotificationPermission} className="btn-ghost btn-sm">
                🔔 ทดสอบ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="card p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">การแสดงผล</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">แสดงราคา</p>
              <p className="text-sm text-gray-500">แสดงราคาอาหารในระบบ</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showPrices}
                onChange={(e) => setSettings({ ...settings, showPrices: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">โหมดบุฟเฟ่ต์</p>
              <p className="text-sm text-gray-500">ซ่อนราคาแต่ละรายการ แสดงเฉพาะราคาบุฟเฟ่ต์</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.isBuffetMode}
                onChange={(e) => setSettings({ ...settings, isBuffetMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          {settings.isBuffetMode && (
            <div>
              <label className="label">ราคาบุฟเฟ่ต์ (บาท)</label>
              <input
                type="number"
                className="input w-48"
                value={settings.buffetPrice || ''}
                onChange={(e) => setSettings({ ...settings, buffetPrice: e.target.value })}
                placeholder="299"
                min="0"
              />
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <button onClick={fetchSettings} className="btn-ghost">
          รีเซ็ต
        </button>
        <button onClick={handleSave} className="btn-primary" disabled={saving}>
          {saving ? 'กำลังบันทึก...' : '💾 บันทึกการตั้งค่า'}
        </button>
      </div>
    </div>
  );
}