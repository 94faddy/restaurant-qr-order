// ===================================================
// FILE: page.tsx
// PATH: src/app/admin/settings/page.tsx
// DESCRIPTION: หน้าตั้งค่าระบบ (พร้อม Image Cropper)
// ===================================================

'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import ImageCropper from '@/components/ImageCropper';

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
  
  // ✅ State สำหรับ Image Cropper
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

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

  // ฟังก์ชัน save settings
  const saveSettings = async (settingsToSave: Settings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToSave),
      });
      const data = await res.json();
      return data.success;
    } catch {
      return false;
    }
  };

  // ✅ เมื่อเลือกไฟล์ → แสดง Cropper
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // สร้าง URL สำหรับ preview
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    
    // Reset input เพื่อให้เลือกไฟล์เดิมซ้ำได้
    e.target.value = '';
  };

  // ✅ เมื่อ crop เสร็จ → upload รูป
  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setCropImageSrc(null);
    
    if (!settings) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', croppedBlob, 'logo.jpg');

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        // อัพเดท state
        const updatedSettings = { ...settings, logo: data.data.url };
        setSettings(updatedSettings);
        
        // Auto save ลง database
        const saved = await saveSettings(updatedSettings);
        
        if (saved) {
          Swal.fire({
            icon: 'success',
            title: 'บันทึกโลโก้สำเร็จ',
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({ 
            icon: 'warning', 
            title: 'อัพโหลดสำเร็จ', 
            text: 'แต่บันทึกไม่สำเร็จ กรุณากดบันทึกอีกครั้ง' 
          });
        }
      } else {
        Swal.fire({ icon: 'error', title: 'อัพโหลดไม่สำเร็จ', text: data.error });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
    } finally {
      setUploading(false);
    }
  };

  // ยกเลิก crop
  const handleCropCancel = () => {
    setShowCropper(false);
    setCropImageSrc(null);
  };

  // ลบโลโก้
  const handleRemoveLogo = async () => {
    if (!settings) return;
    
    const result = await Swal.fire({
      title: 'ลบโลโก้?',
      text: 'คุณต้องการลบโลโก้ร้านใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      const updatedSettings = { ...settings, logo: null };
      setSettings(updatedSettings);
      const saved = await saveSettings(updatedSettings);
      
      if (saved) {
        Swal.fire({ icon: 'success', title: 'ลบโลโก้แล้ว', timer: 1500, showConfirmButton: false });
      }
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const success = await saveSettings(settings);
      
      if (success) {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ' });
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
      {/* ✅ Image Cropper Modal */}
      {showCropper && cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1} // สี่เหลี่ยมจัตุรัส
          outputSize={{ width: 400, height: 400 }}
        />
      )}

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
          <div className="flex items-start gap-4">
            {/* Logo Preview */}
            <div className="relative group">
              <div className="w-28 h-28 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300">
                {settings.logo ? (
                  <img 
                    src={settings.logo} 
                    alt="Logo" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="text-center">
                    <span className="text-4xl">🍽️</span>
                    <p className="text-xs text-gray-400 mt-1">ไม่มีโลโก้</p>
                  </div>
                )}
              </div>
              
              {/* Overlay on hover */}
              {settings.logo && (
                <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={handleRemoveLogo}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="ลบโลโก้"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            {/* Upload Button */}
            <div className="flex flex-col gap-2">
              <label className={`btn-primary cursor-pointer inline-flex items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {uploading ? (
                  <>
                    <span className="spinner w-4 h-4 border-white border-t-transparent"></span>
                    กำลังอัพโหลด...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {settings.logo ? 'เปลี่ยนโลโก้' : 'อัพโหลดโลโก้'}
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileSelect} 
                  disabled={uploading} 
                />
              </label>
              
              <p className="text-xs text-gray-500">
                รองรับ JPG, PNG, GIF • ขนาดไม่เกิน 5MB
              </p>
              <p className="text-xs text-gray-400">
                💡 สามารถลากปรับตำแหน่งและซูมได้
              </p>
            </div>
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