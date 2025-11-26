// ===================================================
// FILE: page.tsx
// PATH: /restaurant-qr-order/src/app/admin/qrcode/page.tsx
// DESCRIPTION: หน้าแสดงและพิมพ์ QR Code ของโต๊ะ
// ===================================================

'use client';

import { useEffect, useState } from 'react';

interface Table {
  id: number;
  name: string;
  qrToken: string;
  isActive: boolean;
  updatedAt: string; // ✅ เพิ่ม field นี้
}

export default function QRCodePage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [qrSize, setQrSize] = useState(200);
  const [refreshKey, setRefreshKey] = useState(Date.now()); // ✅ เพิ่ม state สำหรับ force refresh

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables?activeOnly=true');
      const data = await res.json();
      if (data.success) {
        setTables(data.data);
        setSelectedTables(data.data.map((t: Table) => t.id));
        setRefreshKey(Date.now()); // ✅ Force refresh QR images
      }
    } catch (error) {
      console.error('Fetch tables error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTable = (id: number) => {
    setSelectedTables((prev) =>
      prev.includes(id)
        ? prev.filter((t) => t !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedTables(tables.map((t) => t.id));
  };

  const deselectAll = () => {
    setSelectedTables([]);
  };

  const handlePrint = () => {
    window.print();
  };

  // ✅ เพิ่มปุ่ม refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchTables();
  };

  const downloadQR = async (table: Table) => {
    try {
      // ✅ เพิ่ม timestamp เพื่อ bypass cache
      const res = await fetch(`/api/tables/${table.id}/qrcode?size=500&t=${Date.now()}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${table.name.replace(/\s/g, '-')}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-10 h-10"></div>
      </div>
    );
  }

  const filteredTables = tables.filter((t) => selectedTables.includes(t.id));

  return (
    <div className="space-y-6">
      {/* Header - Hide on print */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">QR Code</h1>
          <p className="text-gray-500 mt-1">สร้างและพิมพ์ QR Code สำหรับโต๊ะ</p>
        </div>
        <div className="flex gap-2">
          {/* ✅ เพิ่มปุ่ม Refresh */}
          <button onClick={handleRefresh} className="btn-outline">
            🔄 รีเฟรช
          </button>
          <button onClick={handlePrint} className="btn-primary">
            🖨️ พิมพ์ QR Code
          </button>
        </div>
      </div>

      {/* Controls - Hide on print */}
      <div className="no-print card p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">ขนาด QR:</label>
            <select
              value={qrSize}
              onChange={(e) => setQrSize(parseInt(e.target.value))}
              className="select w-32"
            >
              <option value={150}>เล็ก</option>
              <option value={200}>กลาง</option>
              <option value={250}>ใหญ่</option>
              <option value={300}>ใหญ่มาก</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button onClick={selectAll} className="btn-outline btn-sm">
              เลือกทั้งหมด
            </button>
            <button onClick={deselectAll} className="btn-ghost btn-sm">
              ยกเลิกทั้งหมด
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tables.map((table) => (
            <button
              key={table.id}
              onClick={() => toggleTable(table.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedTables.includes(table.id)
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {table.name}
            </button>
          ))}
        </div>
      </div>

      {/* QR Codes Grid */}
      {filteredTables.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-2 print:gap-4">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              className="card p-6 text-center print:break-inside-avoid print:border print:border-gray-300"
            >
              {/* QR Code - ✅ เพิ่ม qrToken และ refreshKey เป็น cache busting */}
              <div className="flex justify-center mb-4">
                <img
                  src={`/api/tables/${table.id}/qrcode?size=${qrSize}&token=${table.qrToken}&t=${refreshKey}`}
                  alt={`QR Code ${table.name}`}
                  width={qrSize}
                  height={qrSize}
                  className="rounded-lg"
                />
              </div>

              {/* Table Name */}
              <h3 className="text-xl font-bold text-gray-900 font-display mb-2">
                {table.name}
              </h3>

              {/* Instructions */}
              <p className="text-sm text-gray-500 mb-4">
                สแกนเพื่อสั่งอาหาร
              </p>

              {/* Download Button - Hide on print */}
              <button
                onClick={() => downloadQR(table)}
                className="no-print btn-outline btn-sm w-full"
              >
                📥 ดาวน์โหลด
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state py-16 no-print">
          <p className="empty-state-title">กรุณาเลือกโต๊ะ</p>
          <p className="empty-state-text">เลือกโต๊ะที่ต้องการพิมพ์ QR Code</p>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .card {
            box-shadow: none !important;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}