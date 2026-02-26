import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  try {
    const email = 'fongbeead@gmail.com';
    const password = 'chocolate,GOOD2';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.role === 'ADMIN') {
        console.log('✅ Admin user already exists with correct role');
        return;
      }
      // Update existing user to ADMIN
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: {
          role: 'ADMIN',
          password: hashedPassword,
        },
      });
      console.log('✅ User updated to ADMIN role');
      return;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: 'Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
        isProfileComplete: true,
        profileCompletedAt: new Date(),
      },
    });

    console.log('✅ Admin user created successfully');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`User ID: ${newUser.id}`);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
