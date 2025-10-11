import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true
    }
  });

  console.log('Existing users in database:');
  console.log('===========================');
  users.forEach(user => {
    console.log(`- ${user.email} (${user.name}) - Created: ${user.createdAt.toLocaleDateString()}`);
  });
  console.log(`\nTotal users: ${users.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());