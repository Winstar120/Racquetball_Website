// Script to fix registration status to CONFIRMED
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get the most recent league
    const league = await prisma.league.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!league) {
      console.error('No league found.');
      process.exit(1);
    }

    console.log(`Fixing registrations for league: ${league.name}`);

    // Update all registrations to CONFIRMED status
    const result = await prisma.leagueRegistration.updateMany({
      where: {
        leagueId: league.id
      },
      data: {
        status: 'CONFIRMED'
      }
    });

    console.log(`✅ Updated ${result.count} registrations to CONFIRMED status`);

    // Verify the update
    const confirmedCount = await prisma.leagueRegistration.count({
      where: {
        leagueId: league.id,
        status: 'CONFIRMED'
      }
    });

    console.log(`Verified: ${confirmedCount} registrations are now CONFIRMED`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();