// ===================================================
// FILE: page.tsx
// PATH: /restaurant-qr-order/src/app/(admin)/reports/page.tsx
// DESCRIPTION: หน้ารายงานสรุปยอดขาย
// ===================================================

'use client';

import { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ReportData {
  summary: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalSales: number;
    averageOrderValue: number;
    period: { start: string; end: string };
  };
  topItems: { menuItemId: number; name: string; quantity: number; totalAmount: number }[];
  dailyBreakdown: { date: string; orders: number; sales: number; cancelled: number }[];
  categoryBreakdown: { categoryId: number; name: string; quantity: number; totalAmount: number }[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [showPrices, setShowPrices] = useState(true);

  useEffect(() => {
    fetchReport();
    fetchSettings();
  }, [dateRange]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setShowPrices(data.data.showPrices);
      }
    } catch (error) {
      console.error('Fetch settings error:', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Fetch report error:', error);
    } finally {
      setLoading(false);
    }
  };

  const setQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
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
          <h1 className="page-title">รายงานยอดขาย</h1>
          <p className="text-gray-500 mt-1">สรุปยอดขายและสถิติต่างๆ</p>
        </div>
        <button onClick={() => window.print()} className="btn-outline no-print">
          🖨️ พิมพ์รายงาน
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="card p-4 no-print">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">จาก:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="input w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">ถึง:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="input w-40"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setQuickRange(7)} className="btn-ghost btn-sm">7 วัน</button>
            <button onClick={() => setQuickRange(30)} className="btn-ghost btn-sm">30 วัน</button>
            <button onClick={() => setQuickRange(90)} className="btn-ghost btn-sm">90 วัน</button>
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
              <p className="text-primary-100 text-sm">ยอดขายรวม</p>
              <p className="text-3xl font-bold mt-1">
                {showPrices ? formatCurrency(data.summary.totalSales) : '***'}
              </p>
            </div>
            <div className="stat-card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <p className="text-blue-100 text-sm">ออเดอร์ทั้งหมด</p>
              <p className="text-3xl font-bold mt-1">{data.summary.totalOrders}</p>
            </div>
            <div className="stat-card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <p className="text-green-100 text-sm">ออเดอร์สำเร็จ</p>
              <p className="text-3xl font-bold mt-1">{data.summary.completedOrders}</p>
            </div>
            <div className="stat-card bg-gradient-to-br from-secondary-500 to-secondary-600 text-white">
              <p className="text-secondary-100 text-sm">เฉลี่ยต่อออเดอร์</p>
              <p className="text-3xl font-bold mt-1">
                {showPrices ? formatCurrency(data.summary.averageOrderValue) : '***'}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Selling Items */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🏆 เมนูขายดี</h2>
              {data.topItems.length > 0 ? (
                <div className="space-y-3">
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
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} รายการ
                          {showPrices && ` • ${formatCurrency(item.totalAmount)}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">ไม่มีข้อมูล</p>
              )}
            </div>

            {/* Category Breakdown */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 ยอดขายตามหมวดหมู่</h2>
              {data.categoryBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {data.categoryBreakdown.map((cat) => {
                    const percentage = (cat.totalAmount / data.summary.totalSales) * 100;
                    return (
                      <div key={cat.categoryId}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-900">{cat.name}</span>
                          <span className="text-gray-600">
                            {cat.quantity} รายการ
                            {showPrices && ` • ${formatCurrency(cat.totalAmount)}`}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">ไม่มีข้อมูล</p>
              )}
            </div>
          </div>

          {/* Daily Breakdown Table */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📅 ยอดขายรายวัน</h2>
            {data.dailyBreakdown.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">วันที่</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">ออเดอร์</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">ยกเลิก</th>
                      {showPrices && (
                        <th className="text-right py-3 px-4 font-semibold text-gray-900">ยอดขาย</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.dailyBreakdown.slice().reverse().map((day) => (
                      <tr key={day.date} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">
                          {formatDate(day.date)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900">{day.orders}</td>
                        <td className="py-3 px-4 text-right text-red-600">{day.cancelled}</td>
                        {showPrices && (
                          <td className="py-3 px-4 text-right font-semibold text-primary-600">
                            {formatCurrency(day.sales)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="py-3 px-4">รวม</td>
                      <td className="py-3 px-4 text-right">{data.summary.totalOrders}</td>
                      <td className="py-3 px-4 text-right text-red-600">{data.summary.cancelledOrders}</td>
                      {showPrices && (
                        <td className="py-3 px-4 text-right text-primary-600">
                          {formatCurrency(data.summary.totalSales)}
                        </td>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">ไม่มีข้อมูล</p>
            )}
          </div>
        </>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}