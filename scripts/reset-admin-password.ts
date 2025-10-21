import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const plainPassword = process.argv[2] ?? 'admin123'
  const hashedPassword = await bcrypt.hash(plainPassword, 10)

  const user = await prisma.user.upsert({
    where: { email: 'admin@racquetball.com' },
    update: {
      password: hashedPassword,
      isAdmin: true
    },
    create: {
      email: 'admin@racquetball.com',
      name: 'Admin User',
      password: hashedPassword,
      isAdmin: true,
      emailVerified: new Date(),
      skillLevel: 'A'
    }
  })

  console.log('Admin user password reset for:', user.email)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
