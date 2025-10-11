const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'winwilhelmsen@gmail.com';
    const password = 'fivestar55';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('User already exists. Updating to admin...');
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          isAdmin: true,
          password: await bcrypt.hash(password, 10)
        }
      });
      console.log('User updated to admin:', updatedUser.email);
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Admin',
          phone: '(555) 000-0000',
          isAdmin: true,
          skillLevel: 'INTERMEDIATE'
        }
      });
      console.log('Admin user created:', newUser.email);
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();