import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Get all active leagues (including registration open, since matches can be played)
    const leagues = await prisma.league.findMany({
      where: {
        status: { in: ['REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED'] },
      },
      include: {
        divisions: true,
        matches: {
          where: {
            status: {
              in: ['IN_PROGRESS', 'COMPLETED', 'DISPUTED'],
            },
          },
          include: {
            games: true,
            player1: true,
            player2: true,
            player3: true,
          },
        },
        registrations: {
          where: {
            status: 'CONFIRMED',
          },
          include: {
            user: true,
            division: true,
          },
        },
      },
    });

    const leagueStandings = leagues.map(league => {
      const divisionStandings = league.divisions.map(division => {
        // Get all players in this division
        const divisionPlayers = league.registrations
          .filter(reg => reg.divisionId === division.id)
          .map(reg => ({
            playerId: reg.user.id,
            playerName: reg.user.name,
          }));

        // Calculate standings for each player
        const standings = divisionPlayers.map(player => {
          const playerMatches = league.matches.filter(match => {
            if (!match.games || match.games.length === 0) {
              return false;
            }

            const isPlayerInMatch =
              match.player1Id === player.playerId ||
              match.player2Id === player.playerId ||
              match.player3Id === player.playerId;

            if (!isPlayerInMatch) {
              return false;
            }

            if (match.divisionId) {
              return match.divisionId === division.id;
            }

            const registration = league.registrations.find(reg => reg.userId === player.playerId);
            return registration?.divisionId === division.id;
          });

          let wins = 0;
          let losses = 0;
          let gamesWon = 0;
          let gamesLost = 0;
          let pointsFor = 0;
          const pointsToWin = league.pointsToWin ?? 11;

          playerMatches.forEach(match => {
            const gameWinCounts = new Map<string, number>();
            let participatedInMatch = false;

            match.games.forEach(game => {
              const entries: { id: string; score: number }[] = [
                { id: match.player1Id, score: game.player1Score ?? 0 },
                { id: match.player2Id, score: game.player2Score ?? 0 },
              ];

              if (league.gameType === 'CUTTHROAT' && match.player3Id) {
                entries.push({ id: match.player3Id, score: game.player3Score ?? 0 });
              }

              const winningScore = Math.max(...entries.map(entry => entry.score));
              if (winningScore < pointsToWin) {
                return;
              }

              const winners = entries.filter(entry => entry.score === winningScore);
              winners.forEach(winner => {
                gameWinCounts.set(winner.id, (gameWinCounts.get(winner.id) ?? 0) + 1);
              });

              entries.forEach(entry => {
                if (entry.id === player.playerId) {
                  participatedInMatch = true;
                  pointsFor += entry.score;
                  if (winners.some(winner => winner.id === entry.id)) {
                    gamesWon++;
                  } else {
                    gamesLost++;
                  }
                }
              });
            });

            if (!participatedInMatch || gameWinCounts.size === 0) {
              return;
            }

            const maxGamesWon = Math.max(...Array.from(gameWinCounts.values()));
            const topPerformers = Array.from(gameWinCounts.entries()).filter(([, count]) => count === maxGamesWon);

            if (topPerformers.length === 1) {
              if (topPerformers[0][0] === player.playerId) {
                wins++;
              } else {
                losses++;
              }
            } else {
              if (!topPerformers.some(([id]) => id === player.playerId)) {
                losses++;
              }
            }
          });

          const matches = wins + losses;
          const winPercentage = matches > 0 ? (wins / matches) * 100 : 0;

          return {
            playerId: player.playerId,
            playerName: player.playerName,
            matches,
            wins,
            losses,
            winPercentage,
            gamesWon,
            gamesLost,
            pointsFor,
          };
        });

        // Sort standings based on league ranking method
        if (league.rankingMethod === 'BY_POINTS') {
          // Sort by: 1) total points scored, 2) wins, 3) games won, 4) player name
          standings.sort((a, b) => {
            if (b.pointsFor !== a.pointsFor) {
              return b.pointsFor - a.pointsFor;
            }
            if (b.wins !== a.wins) {
              return b.wins - a.wins;
            }
            if (b.gamesWon !== a.gamesWon) {
              return b.gamesWon - a.gamesWon;
            }
            return a.playerName.localeCompare(b.playerName);
          });
        } else {
          // BY_WINS: Sort by: 1) win percentage, 2) wins, 3) games won, 4) points for, 5) player name
          standings.sort((a, b) => {
            if (b.winPercentage !== a.winPercentage) {
              return b.winPercentage - a.winPercentage;
            }
            if (b.wins !== a.wins) {
              return b.wins - a.wins;
            }
            if (b.gamesWon !== a.gamesWon) {
              return b.gamesWon - a.gamesWon;
            }
            if (b.pointsFor !== a.pointsFor) {
              return b.pointsFor - a.pointsFor;
            }
            return a.playerName.localeCompare(b.playerName);
          });
        }

        return {
          divisionId: division.id,
          divisionName: division.name,
          standings,
        };
      });

      return {
        leagueId: league.id,
        leagueName: league.name,
        gameType: league.gameType,
        rankingMethod: league.rankingMethod,
        divisions: divisionStandings,
      };
    });

    return NextResponse.json({ leagues: leagueStandings });
  } catch (error) {
    console.error("Standings calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate standings" },
      { status: 500 }
    );
  }
}
