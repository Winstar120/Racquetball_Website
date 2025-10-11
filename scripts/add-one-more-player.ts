// Script to add one more test participant
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

    console.log(`Adding player to: ${league.name}`);

    const division = league.divisions[0];
    if (!division) {
      console.error('No divisions found.');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash('testpass123', 10);

    // Create the 9th player
    const user = await prisma.user.upsert({
      where: { email: 'player9@test.com' },
      update: {
        name: 'George Wilson',
        skillLevel: 'C',
      },
      create: {
        email: 'player9@test.com',
        name: 'George Wilson',
        skillLevel: 'C',
        password: hashedPassword,
        phone: '555-0109',
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

    // Get total count
    const registrationCount = await prisma.leagueRegistration.count({
      where: {
        leagueId: league.id,
        status: 'CONFIRMED'
      }
    });

    console.log(`\n✅ Total confirmed registrations: ${registrationCount}`);
    console.log('Perfect for cutthroat - 3 groups of 3 players with no byes!');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();