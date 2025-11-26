/** @type {import('next').NextConfig} */

// ดึง hostname จาก NEXT_PUBLIC_APP_URL
const getHostnameFromUrl = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return 'localhost';
  }
};

// ดึง protocol จาก NEXT_PUBLIC_APP_URL
const getProtocolFromUrl = (url) => {
  try {
    return new URL(url).protocol.replace(':', '');
  } catch {
    return 'http';
  }
};

// ดึง port จาก NEXT_PUBLIC_APP_URL
const getPortFromUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.port || '';
  } catch {
    return '';
  }
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const appHostname = getHostnameFromUrl(appUrl);
const appProtocol = getProtocolFromUrl(appUrl);
const appPort = getPortFromUrl(appUrl);

// Parse image domains จาก env (comma separated)
const imageDomains = process.env.NEXT_PUBLIC_IMAGE_DOMAINS
  ? process.env.NEXT_PUBLIC_IMAGE_DOMAINS.split(',').map(d => d.trim())
  : [appHostname, 'localhost'];

// สร้าง remotePatterns สำหรับ domains ทั้งหมด
const remotePatterns = imageDomains.map(hostname => ({
  protocol: hostname.includes('localhost') ? 'http' : 'https',
  hostname: hostname,
  port: hostname === 'localhost' ? '3000' : '',
  pathname: '/uploads/**',
}));

// เพิ่ม pattern สำหรับ app URL หลัก
if (!imageDomains.includes(appHostname)) {
  remotePatterns.unshift({
    protocol: appProtocol,
    hostname: appHostname,
    port: appPort,
    pathname: '/uploads/**',
  });
}

const nextConfig = {
  images: {
    domains: [...new Set([appHostname, ...imageDomains])],
    remotePatterns: remotePatterns,
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  // สำหรับ ngrok และ external domains
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'ngrok-skip-browser-warning',
            value: 'true',
          },
        ],
      },
    ];
  },
};

export default nextConfig;