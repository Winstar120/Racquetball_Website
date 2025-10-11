// Script to add 15 test participants to singles league
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get the most recent singles league
    const league = await prisma.league.findFirst({
      where: { gameType: 'SINGLES' },
      orderBy: { createdAt: 'desc' },
      include: { divisions: true }
    });

    if (!league) {
      console.error('No singles league found.');
      process.exit(1);
    }

    console.log(`Adding 15 players to: ${league.name}`);

    const division = league.divisions[0];
    if (!division) {
      console.error('No divisions found.');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash('testpass123', 10);

    // Create 15 singles players
    const players = [
      { email: 'singles1@test.com', name: 'Alex Johnson', skillLevel: 'A', phone: '555-1001' },
      { email: 'singles2@test.com', name: 'Beth Wilson', skillLevel: 'B', phone: '555-1002' },
      { email: 'singles3@test.com', name: 'Carlos Martinez', skillLevel: 'C', phone: '555-1003' },
      { email: 'singles4@test.com', name: 'Diana Chen', skillLevel: 'A', phone: '555-1004' },
      { email: 'singles5@test.com', name: 'Eric Thompson', skillLevel: 'B', phone: '555-1005' },
      { email: 'singles6@test.com', name: 'Fiona Davis', skillLevel: 'C', phone: '555-1006' },
      { email: 'singles7@test.com', name: 'Greg Miller', skillLevel: 'A', phone: '555-1007' },
      { email: 'singles8@test.com', name: 'Hannah Lee', skillLevel: 'B', phone: '555-1008' },
      { email: 'singles9@test.com', name: 'Ian Brown', skillLevel: 'C', phone: '555-1009' },
      { email: 'singles10@test.com', name: 'Julia Taylor', skillLevel: 'A', phone: '555-1010' },
      { email: 'singles11@test.com', name: 'Kevin Garcia', skillLevel: 'B', phone: '555-1011' },
      { email: 'singles12@test.com', name: 'Laura Anderson', skillLevel: 'C', phone: '555-1012' },
      { email: 'singles13@test.com', name: 'Mike Roberts', skillLevel: 'A', phone: '555-1013' },
      { email: 'singles14@test.com', name: 'Nina White', skillLevel: 'B', phone: '555-1014' },
      { email: 'singles15@test.com', name: 'Oscar King', skillLevel: 'C', phone: '555-1015' },
    ];

    for (const playerData of players) {
      // Create or update the user
      const user = await prisma.user.upsert({
        where: { email: playerData.email },
        update: {
          name: playerData.name,
          skillLevel: playerData.skillLevel as 'A' | 'B' | 'C' | 'D',
        },
        create: {
          ...playerData,
          skillLevel: playerData.skillLevel as 'A' | 'B' | 'C' | 'D',
          password: hashedPassword,
        }
      });

      // Register for league
      const existingRegistration = await prisma.leagueRegistration.findUnique({
        where: {
          userId_leagueId: {
            userId: user.id,
            leagueId: league.id
          }
        }
      });

      if (!existingRegistration) {
        await prisma.leagueRegistration.create({
          data: {
            userId: user.id,
            leagueId: league.id,
            divisionId: division.id,
            status: 'CONFIRMED',
            paymentStatus: league.isFree ? 'PAID' : 'PENDING',
          }
        });
        console.log(`✓ Added and registered ${user.name} for the singles league`);
      } else {
        // Update to confirmed if not already
        await prisma.leagueRegistration.update({
          where: {
            userId_leagueId: {
              userId: user.id,
              leagueId: league.id
            }
          },
          data: {
            status: 'CONFIRMED'
          }
        });
        console.log(`✓ ${user.name} already registered - updated to CONFIRMED`);
      }
    }

    // Get total count
    const registrationCount = await prisma.leagueRegistration.count({
      where: {
        leagueId: league.id,
        status: 'CONFIRMED'
      }
    });

    console.log(`\n✅ Total confirmed registrations: ${registrationCount}`);
    console.log('Ready for singles round-robin scheduling!');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();