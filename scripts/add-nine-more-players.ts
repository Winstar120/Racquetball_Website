// Script to add 9 more test participants
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get the most recent league
    const league = await prisma.league.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { divisions: true }
    });

    if (!league) {
      console.error('No league found.');
      process.exit(1);
    }

    console.log(`Adding 9 more players to: ${league.name}`);

    const division = league.divisions[0];
    if (!division) {
      console.error('No divisions found.');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash('testpass123', 10);

    // Create players 10-18
    const players = [
      { email: 'player10@test.com', name: 'Henry Miller', skillLevel: 'A', phone: '555-0110' },
      { email: 'player11@test.com', name: 'Isabella Davis', skillLevel: 'B', phone: '555-0111' },
      { email: 'player12@test.com', name: 'Jack Wilson', skillLevel: 'C', phone: '555-0112' },
      { email: 'player13@test.com', name: 'Karen Martinez', skillLevel: 'A', phone: '555-0113' },
      { email: 'player14@test.com', name: 'Liam Anderson', skillLevel: 'B', phone: '555-0114' },
      { email: 'player15@test.com', name: 'Maria Garcia', skillLevel: 'C', phone: '555-0115' },
      { email: 'player16@test.com', name: 'Nathan Taylor', skillLevel: 'A', phone: '555-0116' },
      { email: 'player17@test.com', name: 'Olivia Thomas', skillLevel: 'B', phone: '555-0117' },
      { email: 'player18@test.com', name: 'Patrick Lee', skillLevel: 'C', phone: '555-0118' },
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
        console.log(`✓ Added and registered ${user.name} for the league`);
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
    console.log('Perfect for 6 cutthroat groups - 6 groups of 3 players with no byes!');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();