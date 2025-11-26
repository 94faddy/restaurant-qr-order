// ===================================================
// FILE: layout.tsx
// PATH: /restaurant-qr-order/src/app/layout.tsx
// DESCRIPTION: Root Layout สำหรับทั้ง App
// ===================================================

import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Restaurant QR Order | สั่งอาหารผ่าน QR Code',
  description: 'ระบบสั่งอาหารผ่าน QR Code สำหรับร้านอาหาร',
  themeColor: '#ee7712',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        {/* Google Fonts - Thai fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&family=Prompt:wght@300;400;500;600&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}