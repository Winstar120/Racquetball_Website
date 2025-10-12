import { prisma } from "@/lib/prisma";

interface Player {
  id: string;
  name: string;
  divisionId?: string;
}

interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  date?: Date;
}

interface ScheduledMatch {
  player1Id: string;
  player2Id: string;
  player3Id?: string;
  player4Id?: string;
  courtNumber: number;
  scheduledTime: Date;
  weekNumber: number;
  divisionId?: string;
}

// Helper function to get all available time slots for a date range
export async function getAvailableTimeSlots(startDate: Date, endDate: Date, matchDuration: number = 60) {
  const globalAvailability = await prisma.globalCourtAvailability.findMany({
    where: { isActive: true },
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' }
    ]
  });

  const timeSlots: { date: Date; courtNumber: number; startTime: string; endTime: string }[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const daySlots = globalAvailability.filter(slot => slot.dayOfWeek === dayOfWeek);

    for (const slot of daySlots) {
      // Parse start and end times
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);

      // Calculate total available minutes and normalize to 5-minute increments
      let startMinutes = startHour * 60 + startMin;
      let endMinutes = endHour * 60 + endMin;

      const normalize = (minutes: number) => Math.round(minutes / 5) * 5;
      startMinutes = normalize(startMinutes);
      endMinutes = normalize(endMinutes);

      // Generate hourly time slots within the availability window
      for (let minutes = startMinutes; minutes + matchDuration <= endMinutes; minutes += matchDuration) {
        let currentMinutes = minutes;
        const slotHour = Math.floor(currentMinutes / 60);
        const slotMin = currentMinutes % 60;
        const slotEndMinutes = minutes + matchDuration;
        const slotEndHour = Math.floor(slotEndMinutes / 60);
        const slotEndMin = slotEndMinutes % 60;

        const startTimeStr = `${slotHour.toString().padStart(2, '0')}:${slotMin.toString().padStart(2, '0')}`;
        const endTimeStr = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMin.toString().padStart(2, '0')}`;

        // Add slot for court 1
        timeSlots.push({
          date: new Date(currentDate),
          courtNumber: 1,
          startTime: startTimeStr,
          endTime: endTimeStr
        });
        // Add slot for court 2
        timeSlots.push({
          date: new Date(currentDate),
          courtNumber: 2,
          startTime: startTimeStr,
          endTime: endTimeStr
        });
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return timeSlots;
}

// Generate round-robin pairings for singles/doubles
export function generateRoundRobinPairings(players: Player[]): Array<[Player, Player]> {
  const pairings: Array<[Player, Player]> = [];

  // If odd number of players, add a "bye" player
  const adjustedPlayers = [...players];
  if (adjustedPlayers.length % 2 !== 0) {
    adjustedPlayers.push({ id: 'bye', name: 'Bye' });
  }

  const n = adjustedPlayers.length;
  const rounds = n - 1;

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < n / 2; i++) {
      const player1 = adjustedPlayers[i];
      const player2 = adjustedPlayers[n - 1 - i];

      // Skip matches with bye player
      if (player1.id !== 'bye' && player2.id !== 'bye') {
        pairings.push([player1, player2]);
      }
    }

    // Rotate players for next round (keep first player fixed)
    adjustedPlayers.splice(1, 0, adjustedPlayers.pop()!);
  }

  return pairings;
}

// Generate cut-throat groups with rotation to avoid complete repeats
export function generateCutthroatGroups(
  players: Player[],
  weeksCount: number
): Array<Array<[Player, Player, Player]>> {
  const weeklyGroups: Array<Array<[Player, Player, Player]>> = [];
  const playerCount = players.length;

  // Track which combinations have played together
  const pairHistory = new Map<string, number>();

  // Helper to get a pair key
  const getPairKey = (p1: string, p2: string) => {
    return [p1, p2].sort().join('-');
  };

  // Helper to count how many times players in a group have played together
  const getGroupScore = (group: [Player, Player, Player]) => {
    const ids = group.map(p => p.id);
    let score = 0;
    score += pairHistory.get(getPairKey(ids[0], ids[1])) || 0;
    score += pairHistory.get(getPairKey(ids[0], ids[2])) || 0;
    score += pairHistory.get(getPairKey(ids[1], ids[2])) || 0;
    return score;
  };

  for (let week = 0; week < weeksCount; week++) {
    const weekGroups: Array<[Player, Player, Player]> = [];
    const usedPlayers = new Set<string>();
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

    while (usedPlayers.size < playerCount - (playerCount % 3)) {
      const availablePlayers = shuffledPlayers.filter(p => !usedPlayers.has(p.id));

      if (availablePlayers.length < 3) break;

      // Try to find the best group with minimal repeat pairings
      let bestGroup: [Player, Player, Player] | null = null;
      let bestScore = Infinity;

      // Generate multiple candidate groups and pick the best one
      for (let attempt = 0; attempt < 10 && availablePlayers.length >= 3; attempt++) {
        const candidateGroup: [Player, Player, Player] = [
          availablePlayers[Math.floor(Math.random() * availablePlayers.length)],
          availablePlayers[Math.floor(Math.random() * availablePlayers.length)],
          availablePlayers[Math.floor(Math.random() * availablePlayers.length)]
        ];

        // Ensure all three players are different
        if (new Set(candidateGroup.map(p => p.id)).size !== 3) continue;

        const score = getGroupScore(candidateGroup);

        // Reject groups where all 3 players have played together before
        const pair1 = pairHistory.get(getPairKey(candidateGroup[0].id, candidateGroup[1].id)) || 0;
        const pair2 = pairHistory.get(getPairKey(candidateGroup[0].id, candidateGroup[2].id)) || 0;
        const pair3 = pairHistory.get(getPairKey(candidateGroup[1].id, candidateGroup[2].id)) || 0;

        if (pair1 > 0 && pair2 > 0 && pair3 > 0) continue; // All three have played together

        if (score < bestScore) {
          bestScore = score;
          bestGroup = candidateGroup;
        }
      }

      if (bestGroup) {
        weekGroups.push(bestGroup);
        bestGroup.forEach(p => usedPlayers.add(p.id));

        // Update pair history
        const ids = bestGroup.map(p => p.id);
        pairHistory.set(getPairKey(ids[0], ids[1]), (pairHistory.get(getPairKey(ids[0], ids[1])) || 0) + 1);
        pairHistory.set(getPairKey(ids[0], ids[2]), (pairHistory.get(getPairKey(ids[0], ids[2])) || 0) + 1);
        pairHistory.set(getPairKey(ids[1], ids[2]), (pairHistory.get(getPairKey(ids[1], ids[2])) || 0) + 1);
      } else {
        // If we can't find a good group, just take the first 3 available
        const group: [Player, Player, Player] = [
          availablePlayers[0],
          availablePlayers[1],
          availablePlayers[2]
        ];
        weekGroups.push(group);
        group.forEach(p => usedPlayers.add(p.id));
      }
    }

    weeklyGroups.push(weekGroups);
  }

  return weeklyGroups;
}

// Main scheduling function
export async function generateLeagueSchedule(
  leagueId: string,
  matchDuration: number = 45
): Promise<{
  scheduledMatches: ScheduledMatch[];
  makeupMatches: ScheduledMatch[];
  totalWeeks: number;
  projectedGames: number;
}> {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
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

  if (!league) throw new Error('League not found');

  const scheduledMatches: ScheduledMatch[] = [];
  const makeupMatches: ScheduledMatch[] = [];

  // Get all available time slots
  const allTimeSlots = await getAvailableTimeSlots(league.startDate, league.endDate, matchDuration);

  // Get existing matches from ALL leagues that might conflict
  // IMPORTANT: Exclude matches from the current league to allow regenerating previews
  const existingMatches = await prisma.match.findMany({
    where: {
      scheduledTime: {
        gte: league.startDate,
        lte: league.endDate
      },
      status: {
        not: 'CANCELLED'
      },
      leagueId: {
        not: leagueId  // Exclude the current league's matches
      }
    },
    select: {
      scheduledTime: true,
      courtNumber: true,
      leagueId: true
    }
  });

  // Create a set of occupied court slots
  const occupiedSlots = new Set<string>();
  existingMatches.forEach(match => {
    if (match.scheduledTime && match.courtNumber) {
      const slotKey = `${match.scheduledTime.toISOString()}_court${match.courtNumber}`;
      occupiedSlots.add(slotKey);
    }
  });

  // Filter out occupied time slots
  const timeSlots = allTimeSlots.filter(slot => {
    const slotTime = new Date(slot.date);
    const [hours, minutes] = slot.startTime.split(':').map(Number);
    slotTime.setHours(hours, minutes, 0, 0);
    const slotKey = `${slotTime.toISOString()}_court${slot.courtNumber}`;
    return !occupiedSlots.has(slotKey);
  });

  // Calculate slots per week
  const weeklySlots = timeSlots.filter(slot => {
    const slotDate = new Date(slot.date);
    const weekStart = new Date(league.startDate);
    const weekEnd = new Date(league.startDate);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return slotDate >= weekStart && slotDate < weekEnd;
  }).length;

  let slotIndex = 0;

  // Process each division
  for (const division of league.divisions) {
    const players = division.registrations.map(reg => ({
      id: reg.user.id,
      name: reg.user.name,
      divisionId: division.id
    }));

    if (players.length < 2) continue;

    if (league.gameType === 'CUTTHROAT') {
      // Generate cut-throat schedule
      const weeksCount = league.weeksForCutthroat || 8;
      const weeklyGroups = generateCutthroatGroups(players, weeksCount);

      for (let week = 0; week < weeklyGroups.length; week++) {
        const groups = weeklyGroups[week];

        for (const group of groups) {
          if (slotIndex >= timeSlots.length) {
            // Create makeup match
            makeupMatches.push({
              player1Id: group[0].id,
              player2Id: group[1].id,
              player3Id: group[2].id,
              courtNumber: 1,
              scheduledTime: new Date(league.endDate),
              weekNumber: week + 1,
              divisionId: division.id
            });
          } else {
            const slot = timeSlots[slotIndex++];
            const matchTime = new Date(slot.date);
            const [hours, minutes] = slot.startTime.split(':').map(Number);
            matchTime.setHours(hours, minutes, 0, 0);

            if (matchTime > league.endDate) {
              makeupMatches.push({
                player1Id: group[0].id,
                player2Id: group[1].id,
                player3Id: group[2].id,
                courtNumber: slot.courtNumber,
                scheduledTime: new Date(league.endDate),
                weekNumber: week + 1,
                divisionId: division.id
              });
              continue;
            }

            // Mark this slot as used for conflict detection in the same scheduling run
            const slotKey = `${matchTime.toISOString()}_court${slot.courtNumber}`;
            occupiedSlots.add(slotKey);

            scheduledMatches.push({
              player1Id: group[0].id,
              player2Id: group[1].id,
              player3Id: group[2].id,
              courtNumber: slot.courtNumber,
              scheduledTime: matchTime,
              weekNumber: week + 1,
              divisionId: division.id
            });
          }
        }
      }
    } else {
      // Generate round-robin for singles/doubles
      const pairings = generateRoundRobinPairings(players);

      // Shuffle the pairings to randomize match order
      const shuffledPairings = [...pairings].sort(() => Math.random() - 0.5);

      // Distribute matches across weeks (1 match per player per week)
      const matchesPerWeek = Math.floor(players.length / 2);
      const totalWeeks = Math.ceil(shuffledPairings.length / matchesPerWeek);

      // Group time slots by week
      const slotsByWeek: typeof timeSlots[] = [];
      const slotsPerWeek = 7; // Assuming daily slots

      for (let week = 0; week < totalWeeks; week++) {
        const weekSlots: typeof timeSlots = [];
        const weekStart = new Date(league.startDate);
        weekStart.setDate(weekStart.getDate() + (week * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        // Get slots for this specific week
        for (const slot of timeSlots) {
          const slotDate = new Date(slot.date);
          if (slotDate >= weekStart && slotDate < weekEnd) {
            weekSlots.push(slot);
          }
        }
        slotsByWeek.push(weekSlots);
      }

      // Schedule matches week by week
      for (let i = 0; i < shuffledPairings.length; i++) {
        const [player1, player2] = shuffledPairings[i];
        const weekNumber = Math.floor(i / matchesPerWeek) + 1;
        const weekIndex = weekNumber - 1;
        const matchInWeek = i % matchesPerWeek;

        // Get available slots for this week
        const weekSlots = slotsByWeek[weekIndex] || [];

        // Shuffle the week slots to randomize time assignments
        const shuffledWeekSlots = [...weekSlots].sort(() => Math.random() - 0.5);

        // Try to find a unique slot for this match
        let slot = null;
        let slotFound = false;

        // Look for an available slot that hasn't been used yet this week
        for (const candidateSlot of shuffledWeekSlots) {
          const slotTime = new Date(candidateSlot.date);
          const [hours, minutes] = candidateSlot.startTime.split(':').map(Number);
          slotTime.setHours(hours, minutes, 0, 0);

          // Check if this slot is already taken (by other leagues or by this scheduling run)
          const slotKey = `${slotTime.toISOString()}_court${candidateSlot.courtNumber}`;
          const slotTakenByOtherLeague = occupiedSlots.has(slotKey);
          const slotTakenByThisRun = scheduledMatches.some(m =>
            m.scheduledTime.getTime() === slotTime.getTime() &&
            m.courtNumber === candidateSlot.courtNumber
          );

          if (!slotTakenByOtherLeague && !slotTakenByThisRun) {
            slot = candidateSlot;
            slotFound = true;
            break;
          }
        }

        if (slotFound && slot) {
          const matchTime = new Date(slot.date);
          const [hours, minutes] = slot.startTime.split(':').map(Number);
          matchTime.setHours(hours, minutes, 0, 0);

          if (matchTime > league.endDate) {
            makeupMatches.push({
              player1Id: player1.id,
              player2Id: player2.id,
              courtNumber: slot.courtNumber,
              scheduledTime: new Date(league.endDate),
              weekNumber,
              divisionId: division.id
            });
            continue;
          }

          // Mark this slot as used for conflict detection in the same scheduling run
          const slotKey = `${matchTime.toISOString()}_court${slot.courtNumber}`;
          occupiedSlots.add(slotKey);

          scheduledMatches.push({
            player1Id: player1.id,
            player2Id: player2.id,
            courtNumber: slot.courtNumber,
            scheduledTime: matchTime,
            weekNumber,
            divisionId: division.id
          });
        } else {
          // Create makeup match if no slot available
          makeupMatches.push({
            player1Id: player1.id,
            player2Id: player2.id,
            courtNumber: 1,
            scheduledTime: new Date(league.endDate),
            weekNumber,
            divisionId: division.id
          });
        }
      }
    }
  }

  const totalWeeks = Math.max(...scheduledMatches.map(m => m.weekNumber), 0);
  const projectedGames = scheduledMatches.length + makeupMatches.length;

  return {
    scheduledMatches,
    makeupMatches,
    totalWeeks,
    projectedGames
  };
}
