import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@racquetball.com' },
    update: {},
    create: {
      email: 'admin@racquetball.com',
      name: 'Admin User',
      password: hashedPassword,
      isAdmin: true,
      emailVerified: new Date(),
      skillLevel: 'A',
    },
  });

  console.log('Created admin user:', adminUser.email);

  // Create a test player
  const playerPassword = await bcrypt.hash('player123', 10);

  const testPlayer = await prisma.user.upsert({
    where: { email: 'player@racquetball.com' },
    update: {},
    create: {
      email: 'player@racquetball.com',
      name: 'Test Player',
      password: playerPassword,
      isAdmin: false,
      emailVerified: new Date(),
      skillLevel: 'B',
    },
  });

  console.log('Created test player:', testPlayer.email);

  // Create the two courts
  const court1 = await prisma.court.upsert({
    where: { number: 1 },
    update: {},
    create: {
      name: 'Court 1',
      number: 1,
      location: 'Main Facility',
      isActive: true,
    },
  });

  const court2 = await prisma.court.upsert({
    where: { number: 2 },
    update: {},
    create: {
      name: 'Court 2',
      number: 2,
      location: 'Main Facility',
      isActive: true,
    },
  });

  console.log('Created courts:', court1.name, court2.name);

  // Add some sample global court availability
  type AvailabilitySlot = {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    courtId?: string | null;
  };

  const availabilitySlots: AvailabilitySlot[] = [
    { dayOfWeek: 1, startTime: '18:00', endTime: '22:00' }, // Monday 6-10pm
    { dayOfWeek: 3, startTime: '18:00', endTime: '22:00' }, // Wednesday 6-10pm
    { dayOfWeek: 5, startTime: '18:00', endTime: '21:00' }, // Friday 6-9pm
  ];

  for (const slot of availabilitySlots) {
    try {
      await prisma.globalCourtAvailability.create({
        data: {
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isActive: true,
          ...(slot.courtId ? { courtId: slot.courtId } : {}),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        continue;
      }
      throw error;
    }
  }

  console.log('Created court availability slots');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
