// Script to test schedule generation
import { PrismaClient } from '@prisma/client';
import { generateLeagueSchedule } from '../lib/scheduling';

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

    console.log(`\nTesting schedule generation for: ${league.name}`);
    console.log(`League ID: ${league.id}`);
    console.log(`Game Type: ${league.gameType}`);
    console.log(`Match Duration: ${league.matchDuration} minutes`);

    // Get registered players
    const registrations = await prisma.leagueRegistration.findMany({
      where: {
        leagueId: league.id,
        status: 'CONFIRMED'
      },
      include: { user: true }
    });

    console.log(`\nRegistered Players (${registrations.length}):`);
    registrations.forEach((reg, index) => {
      console.log(`  ${index + 1}. ${reg.user.name} (${reg.user.id})`);
    });

    // Get court availability
    const availability = await prisma.globalCourtAvailability.findMany({
      where: { isActive: true },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    console.log(`\nCourt Availability (${availability.length} slots):`);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    availability.forEach(slot => {
      console.log(`  ${days[slot.dayOfWeek]}: ${slot.startTime} - ${slot.endTime}`);
    });

    // Generate schedule
    console.log('\n--- Generating Schedule ---\n');
    const result = await generateLeagueSchedule(league.id, league.matchDuration);

    console.log(`Total Weeks: ${result.totalWeeks}`);
    console.log(`Scheduled Matches: ${result.scheduledMatches.length}`);
    console.log(`Makeup Matches: ${result.makeupMatches.length}`);
    console.log(`Total Games: ${result.projectedGames}`);

    // Show first 10 matches in detail
    console.log('\nFirst 10 Scheduled Matches:');
    result.scheduledMatches.slice(0, 10).forEach((match, index) => {
      const player1 = registrations.find(r => r.user.id === match.player1Id)?.user.name || 'Unknown';
      const player2 = registrations.find(r => r.user.id === match.player2Id)?.user.name || 'Unknown';

      console.log(`\n${index + 1}. Week ${match.weekNumber}`);
      console.log(`   ${player1} vs ${player2}`);
      console.log(`   Court ${match.courtNumber}`);
      console.log(`   Time: ${match.scheduledTime.toLocaleString()}`);
    });

    // Check for duplicate matches
    console.log('\n--- Checking for Issues ---\n');

    // Check for duplicate time slots
    const timeSlotMap = new Map<string, number>();
    result.scheduledMatches.forEach(match => {
      const key = `${match.scheduledTime.toISOString()}-court${match.courtNumber}`;
      timeSlotMap.set(key, (timeSlotMap.get(key) || 0) + 1);
    });

    const duplicates = Array.from(timeSlotMap.entries()).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log('⚠️  Found duplicate time slots:');
      duplicates.forEach(([key, count]) => {
        console.log(`   ${key}: ${count} matches`);
      });
    } else {
      console.log('✅ No duplicate time slots found');
    }

    // Check player distribution
    const playerMatchCount = new Map<string, number>();
    result.scheduledMatches.forEach(match => {
      playerMatchCount.set(match.player1Id, (playerMatchCount.get(match.player1Id) || 0) + 1);
      playerMatchCount.set(match.player2Id, (playerMatchCount.get(match.player2Id) || 0) + 1);
    });

    console.log('\nPlayer Match Distribution:');
    registrations.forEach(reg => {
      const count = playerMatchCount.get(reg.user.id) || 0;
      console.log(`  ${reg.user.name}: ${count} matches`);
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();