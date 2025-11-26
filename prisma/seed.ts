// ===================================================
// FILE: seed.ts
// PATH: /restaurant-qr-order/prisma/seed.ts
// DESCRIPTION: Seed ข้อมูลเริ่มต้นสำหรับระบบ
// ===================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // สร้าง Admin
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: hashedPassword,
      name: 'ผู้ดูแลระบบ',
      role: 'admin',
    },
  });
  console.log('✅ Created admin:', admin.username);

  // สร้าง Settings
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      restaurantName: 'ร้านอาหาร QR Order',
      soundEnabled: true,
      notifyEnabled: true,
      showPrices: true,
      isBuffetMode: false,
      currency: 'THB',
    },
  });
  console.log('✅ Created settings');

  // สร้าง Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 1 },
      update: {},
      create: { name: 'อาหารจานหลัก', description: 'อาหารจานเดียว ข้าวผัด ก๋วยเตี๋ยว', sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { id: 2 },
      update: {},
      create: { name: 'กับข้าว', description: 'อาหารทานคู่กับข้าว', sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { id: 3 },
      update: {},
      create: { name: 'ยำ & สลัด', description: 'ยำต่างๆ และสลัด', sortOrder: 3 },
    }),
    prisma.category.upsert({
      where: { id: 4 },
      update: {},
      create: { name: 'เครื่องดื่ม', description: 'น้ำดื่ม ชา กาแฟ', sortOrder: 4 },
    }),
    prisma.category.upsert({
      where: { id: 5 },
      update: {},
      create: { name: 'ของหวาน', description: 'ขนมหวาน ไอศกรีม', sortOrder: 5 },
    }),
  ]);
  console.log('✅ Created categories:', categories.length);

  // สร้าง Menu Items
  const menuItems = await Promise.all([
    // อาหารจานหลัก
    prisma.menuItem.upsert({
      where: { id: 1 },
      update: {},
      create: {
        categoryId: 1,
        name: 'ข้าวผัดหมู',
        description: 'ข้าวผัดหมูสูตรพิเศษ เสิร์ฟพร้อมไข่ดาว',
        price: 60,
        maxPerOrder: 5,
        sortOrder: 1,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 2 },
      update: {},
      create: {
        categoryId: 1,
        name: 'ข้าวผัดกุ้ง',
        description: 'ข้าวผัดกุ้งสด เสิร์ฟพร้อมมะนาว',
        price: 80,
        maxPerOrder: 5,
        sortOrder: 2,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 3 },
      update: {},
      create: {
        categoryId: 1,
        name: 'ก๋วยเตี๋ยวต้มยำ',
        description: 'ก๋วยเตี๋ยวต้มยำน้ำข้น รสจัดจ้าน',
        price: 50,
        maxPerOrder: 5,
        sortOrder: 3,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 4 },
      update: {},
      create: {
        categoryId: 1,
        name: 'ผัดไทยกุ้งสด',
        description: 'ผัดไทยกุ้งสด เสิร์ฟพร้อมเครื่องเคียง',
        price: 75,
        maxPerOrder: 5,
        sortOrder: 4,
      },
    }),
    // กับข้าว
    prisma.menuItem.upsert({
      where: { id: 5 },
      update: {},
      create: {
        categoryId: 2,
        name: 'ต้มยำกุ้ง',
        description: 'ต้มยำกุ้งน้ำข้น รสเผ็ดจัดจ้าน',
        price: 120,
        maxPerOrder: 3,
        sortOrder: 1,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 6 },
      update: {},
      create: {
        categoryId: 2,
        name: 'ผัดกะเพราหมูสับ',
        description: 'ผัดกะเพราหมูสับ รสจัด',
        price: 70,
        maxPerOrder: 5,
        sortOrder: 2,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 7 },
      update: {},
      create: {
        categoryId: 2,
        name: 'แกงเขียวหวานไก่',
        description: 'แกงเขียวหวานไก่ หอมมะพร้าว',
        price: 90,
        maxPerOrder: 3,
        sortOrder: 3,
      },
    }),
    // ยำ & สลัด
    prisma.menuItem.upsert({
      where: { id: 8 },
      update: {},
      create: {
        categoryId: 3,
        name: 'ยำวุ้นเส้น',
        description: 'ยำวุ้นเส้นทะเล รสเปรี้ยวหวาน',
        price: 85,
        maxPerOrder: 3,
        sortOrder: 1,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 9 },
      update: {},
      create: {
        categoryId: 3,
        name: 'ส้มตำไทย',
        description: 'ส้มตำไทยรสจัดจ้าน',
        price: 50,
        maxPerOrder: 5,
        sortOrder: 2,
      },
    }),
    // เครื่องดื่ม
    prisma.menuItem.upsert({
      where: { id: 10 },
      update: {},
      create: {
        categoryId: 4,
        name: 'น้ำเปล่า',
        description: 'น้ำดื่มเย็น',
        price: 15,
        maxPerOrder: 10,
        sortOrder: 1,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 11 },
      update: {},
      create: {
        categoryId: 4,
        name: 'ชาเย็น',
        description: 'ชาไทยเย็น หวานมัน',
        price: 35,
        maxPerOrder: 10,
        sortOrder: 2,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 12 },
      update: {},
      create: {
        categoryId: 4,
        name: 'กาแฟเย็น',
        description: 'กาแฟโบราณเย็น',
        price: 40,
        maxPerOrder: 10,
        sortOrder: 3,
      },
    }),
    // ของหวาน
    prisma.menuItem.upsert({
      where: { id: 13 },
      update: {},
      create: {
        categoryId: 5,
        name: 'ไอศกรีมกะทิ',
        description: 'ไอศกรีมกะทิโบราณ',
        price: 45,
        maxPerOrder: 5,
        sortOrder: 1,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: 14 },
      update: {},
      create: {
        categoryId: 5,
        name: 'ข้าวเหนียวมะม่วง',
        description: 'ข้าวเหนียวมะม่วงน้ำดอกไม้',
        price: 80,
        maxPerOrder: 3,
        sortOrder: 2,
      },
    }),
  ]);
  console.log('✅ Created menu items:', menuItems.length);

  // สร้าง Tables
  const tables = await Promise.all(
    Array.from({ length: 10 }, (_, i) => {
      const tableNum = i + 1;
      const qrToken = uuidv4();
      return prisma.table.upsert({
        where: { id: tableNum },
        update: {},
        create: {
          name: `โต๊ะ ${tableNum}`,
          qrCode: `table-${tableNum}-${qrToken}`,
          qrToken: qrToken,
          sortOrder: tableNum,
        },
      });
    })
  );
  console.log('✅ Created tables:', tables.length);

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });