import 'dotenv/config';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log(`⏭️  Database already initialized with ${userCount} user(s). Skipping seed to preserve data.`);
    return;
  }

  console.log('🌱 Initializing database with Admin account...');

  // 2. Clean physical upload files
  const certUploadDir = path.join(process.cwd(), 'uploads', 'certificates');
  if (fs.existsSync(certUploadDir)) {
    const files = fs.readdirSync(certUploadDir);
    for (const file of files) {
      try {
        fs.unlinkSync(path.join(certUploadDir, file));
      } catch (err) {
        console.warn(`Could not delete file ${file}:`, err);
      }
    }
    console.log(`✅ Cleaned ${files.length} physical file(s) from ${certUploadDir}`);
  }

  // 3. Create Pure Administrator
  const passwordHash = await argon2.hash('Password123!');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@carehome.com',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('🎉 Database is now completely clean!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 ADMIN CREDENTIALS:');
  console.log(`   Email:    admin@carehome.com`);
  console.log(`   Password: Password123!`);
  console.log(`   Role:     ADMIN (System Administrator)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👉 You can now freely register new Care Homes (Managers) and Staff members.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
