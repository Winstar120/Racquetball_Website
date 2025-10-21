import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const { password = 'admin123' } = await request.json().catch(() => ({}))

  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email: 'admin@racquetball.com' },
    update: {
      password: hashed,
      isAdmin: true
    },
    create: {
      email: 'admin@racquetball.com',
      name: 'Admin User',
      password: hashed,
      isAdmin: true,
      emailVerified: new Date(),
      skillLevel: 'A'
    }
  })

  return NextResponse.json({
    success: true,
    email: user.email
  })
}
