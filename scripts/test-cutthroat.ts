// Script to test cutthroat schedule generation
import { PrismaClient } from '@prisma/client';
import { generateCutthroatGroups } from '../lib/scheduling';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get the most recent league
    const league = await prisma.league.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        divisions: {
          include: {
            registrations: {
              where: { status: 'CONFIRMED' },
              include: { user: true }
            }
          }
        }
      }
    });

    if (!league) {
      console.error('No league found.');
      process.exit(1);
    }

    console.log(`\nTesting cutthroat generation for: ${league.name}`);
    console.log(`Game Type: ${league.gameType}`);

    const division = league.divisions[0];
    if (!division) {
      console.error('No divisions found');
      process.exit(1);
    }

    const players = division.registrations.map(reg => ({
      id: reg.user.id,
      name: reg.user.name,
      divisionId: division.id
    }));

    console.log(`\nPlayers (${players.length}):`);
    players.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name}`);
    });

    // Generate cutthroat groups
    const weeksCount = league.weeksForCutthroat || 8;
    console.log(`\nGenerating ${weeksCount} weeks of cutthroat groups...`);

    const weeklyGroups = generateCutthroatGroups(players, weeksCount);

    console.log(`\nGenerated ${weeklyGroups.length} weeks of matches:\n`);

    weeklyGroups.forEach((weekGroups, weekIndex) => {
      console.log(`Week ${weekIndex + 1}:`);
      if (weekGroups.length === 0) {
        console.log('  No groups generated');
      } else {
        weekGroups.forEach((group, groupIndex) => {
          console.log(`  Match ${groupIndex + 1}: ${group[0].name} vs ${group[1].name} vs ${group[2].name}`);
        });
      }
      console.log('');
    });

    // Check player distribution
    const playerMatchCount = new Map<string, number>();
    weeklyGroups.forEach(weekGroups => {
      weekGroups.forEach(group => {
        group.forEach(player => {
          playerMatchCount.set(player.id, (playerMatchCount.get(player.id) || 0) + 1);
        });
      });
    });

    console.log('Player Match Distribution:');
    players.forEach(p => {
      const count = playerMatchCount.get(p.id) || 0;
      console.log(`  ${p.name}: ${count} matches`);
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();