// Script to add test participants for league testing
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
      console.error('No league found. Please create a league first.');
      process.exit(1);
    }

    console.log(`Found league: ${league.name} (ID: ${league.id})`);

    // Get the first division
    const division = league.divisions[0];
    if (!division) {
      console.error('No divisions found for this league.');
      process.exit(1);
    }

    console.log(`Using division: ${division.name} (${division.level})`);

    // Create test users and register them
    const testUsers = [
      { email: 'player1@test.com', name: 'John Smith', skillLevel: 'C' },
      { email: 'player2@test.com', name: 'Jane Doe', skillLevel: 'C' },
      { email: 'player3@test.com', name: 'Bob Johnson', skillLevel: 'C' },
      { email: 'player4@test.com', name: 'Alice Williams', skillLevel: 'C' },
      { email: 'player5@test.com', name: 'Charlie Brown', skillLevel: 'B' },
      { email: 'player6@test.com', name: 'Diana Prince', skillLevel: 'B' },
      { email: 'player7@test.com', name: 'Edward Norton', skillLevel: 'B' },
      { email: 'player8@test.com', name: 'Fiona Green', skillLevel: 'B' },
    ];

    const hashedPassword = await bcrypt.hash('testpass123', 10);

    for (const userData of testUsers) {
      // Create or update user
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
          skillLevel: userData.skillLevel,
        },
        create: {
          ...userData,
          password: hashedPassword,
          phone: '555-0100',
        }
      });

      // Register for league if not already registered
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
            paymentStatus: league.isFree ? 'PAID' : 'PENDING', // Use PAID for free leagues
          }
        });
        console.log(`✓ Registered ${user.name} for the league`);
      } else {
        console.log(`- ${user.name} already registered`);
      }
    }

    // Get registration count
    const registrationCount = await prisma.leagueRegistration.count({
      where: { leagueId: league.id }
    });

    console.log(`\n✅ Total registrations for ${league.name}: ${registrationCount}`);
    console.log('\nYou can now generate the schedule for this league!');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();