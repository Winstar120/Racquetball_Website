const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testUser() {
  try {
    const email = 'winwilhelmsen@gmail.com';
    const password = 'fivestar55';

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      console.log('User found:', {
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        hasPassword: !!user.password
      });

      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log('Password match:', passwordMatch);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUser();