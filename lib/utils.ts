/**
 * Format game type for display
 */
export function formatGameType(gameType: string): string {
  switch (gameType) {
    case 'SINGLES':
      return 'Singles';
    case 'DOUBLES':
      return 'Doubles';
    case 'CUTTHROAT':
      return 'Cut-Throat';
    default:
      return gameType;
  }
}