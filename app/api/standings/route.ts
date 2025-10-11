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
            status: 'COMPLETED',
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
          const playerMatches = league.matches.filter(match =>
            match.divisionId === division.id &&
            (match.player1Id === player.playerId ||
             match.player2Id === player.playerId ||
             match.player3Id === player.playerId)
          );

          let wins = 0;
          let losses = 0;
          let gamesWon = 0;
          let gamesLost = 0;
          let pointsFor = 0;
          let pointsAgainst = 0;

          playerMatches.forEach(match => {
            if (match.winnerId === player.playerId) {
              wins++;
            } else if (match.winnerId) {
              losses++;
            }

            match.games.forEach(game => {
              if (league.gameType === 'CUTTHROAT') {
                // Handle cut-throat scoring
                if (match.player1Id === player.playerId) {
                  pointsFor += game.player1Score;
                  pointsAgainst += Math.max(game.player2Score, game.player3Score || 0);
                } else if (match.player2Id === player.playerId) {
                  pointsFor += game.player2Score;
                  pointsAgainst += Math.max(game.player1Score, game.player3Score || 0);
                } else if (match.player3Id === player.playerId) {
                  pointsFor += game.player3Score || 0;
                  pointsAgainst += Math.max(game.player1Score, game.player2Score);
                }
              } else {
                // Singles or Doubles
                if (match.player1Id === player.playerId) {
                  pointsFor += game.player1Score;
                  pointsAgainst += game.player2Score;
                  if (game.player1Score > game.player2Score) {
                    gamesWon++;
                  } else {
                    gamesLost++;
                  }
                } else if (match.player2Id === player.playerId) {
                  pointsFor += game.player2Score;
                  pointsAgainst += game.player1Score;
                  if (game.player2Score > game.player1Score) {
                    gamesWon++;
                  } else {
                    gamesLost++;
                  }
                }
              }
            });
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
            pointsAgainst,
          };
        });

        // Sort standings based on league ranking method
        if (league.rankingMethod === 'BY_POINTS') {
          // Sort by: 1) total points scored, 2) point differential, 3) wins, 4) name (for consistency)
          standings.sort((a, b) => {
            if (b.pointsFor !== a.pointsFor) {
              return b.pointsFor - a.pointsFor;
            }
            const aDiff = a.pointsFor - a.pointsAgainst;
            const bDiff = b.pointsFor - b.pointsAgainst;
            if (bDiff !== aDiff) {
              return bDiff - aDiff;
            }
            if (b.wins !== a.wins) {
              return b.wins - a.wins;
            }
            return a.playerName.localeCompare(b.playerName);
          });
        } else {
          // BY_WINS: Sort by: 1) win percentage, 2) wins, 3) point differential, 4) points for, 5) name
          standings.sort((a, b) => {
            if (b.winPercentage !== a.winPercentage) {
              return b.winPercentage - a.winPercentage;
            }
            if (b.wins !== a.wins) {
              return b.wins - a.wins;
            }
            const aDiff = a.pointsFor - a.pointsAgainst;
            const bDiff = b.pointsFor - b.pointsAgainst;
            if (bDiff !== aDiff) {
              return bDiff - aDiff;
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