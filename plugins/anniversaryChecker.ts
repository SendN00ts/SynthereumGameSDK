import { GameWorker, GameFunction, ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from "@virtuals-protocol/game";
import { isAnniversaryToday, getYearsSinceRelease } from '../dateUtils';

/**
 * Creates a worker that offers functions to check album and artist anniversary dates
 */
export function createAnniversaryCheckerWorker() {
  // Function to check if a given date is an anniversary today
  const checkAnniversary = new GameFunction({
    name: "check_anniversary",
    description: "Check if a given date is an anniversary today (same month and day)",
    args: [
      { name: "date", description: "Date to check in format YYYY-MM-DD or MM/DD/YYYY" }
    ],
    executable: async (args: { date?: string }, logger?: (msg: string) => void) => {
      try {
        const { date } = args;
        
        if (!date) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Date is required in format YYYY-MM-DD or MM/DD/YYYY"
          );
        }
        
        if (logger) logger(`Checking if ${date} is an anniversary today`);
        
        // Check if it's an anniversary
        const isAnniversary = isAnniversaryToday(date);
        
        // If it is, calculate years since
        let yearsSince = null;
        if (isAnniversary) {
          yearsSince = getYearsSinceRelease(date);
        }
        
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify({
            isAnniversary,
            yearsSince,
            inputDate: date,
            currentDate: new Date().toISOString().split('T')[0]
          })
        );
      } catch (error: any) {
        console.error('Error checking anniversary:', error);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Failed to check anniversary: ${error?.message || 'Unknown error'}`
        );
      }
    }
  });

  // Function to verify a batch of album anniversaries
  const checkAlbumAnniversaries = new GameFunction({
    name: "check_album_anniversaries",
    description: "Check a batch of albums to see which ones have anniversaries today",
    args: [
      { name: "albums", description: "JSON array of album objects with name and releaseDate properties" }
    ],
    executable: async (args: { albums?: string }, logger?: (msg: string) => void) => {
      try {
        const { albums } = args;
        
        if (!albums) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Album data is required as a JSON string array"
          );
        }
        
        if (logger) logger(`Checking album anniversaries`);
        
        // Parse the albums JSON
        let albumData;
        try {
          albumData = JSON.parse(albums);
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Invalid JSON format for albums data"
          );
        }
        
        if (!Array.isArray(albumData)) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Albums data must be an array"
          );
        }
        
        // Check each album for anniversary
        const results = albumData.map(album => {
          const { name, releaseDate, artist } = album;
          
          if (!name || !releaseDate) {
            return {
              name,
              isValid: false,
              error: "Missing required fields (name or releaseDate)"
            };
          }
          
          const isAnniversary = isAnniversaryToday(releaseDate);
          const yearsSince = isAnniversary ? getYearsSinceRelease(releaseDate) : null;
          
          return {
            name,
            artist: artist || "Unknown",
            releaseDate,
            isAnniversary,
            yearsSince,
            ordinal: yearsSince ? getOrdinal(yearsSince) : null
          };
        });
        
        // Filter to only anniversaries
        const anniversaries = results.filter(result => result.isAnniversary);
        
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify({
            today: new Date().toISOString().split('T')[0],
            totalChecked: results.length,
            foundAnniversaries: anniversaries.length,
            anniversaries
          })
        );
      } catch (error: any) {
        console.error('Error checking album anniversaries:', error);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Failed to check album anniversaries: ${error?.message || 'Unknown error'}`
        );
      }
    }
  });

  return new GameWorker({
    id: "anniversary_checker_worker",
    name: "Anniversary Checker",
    description: "Worker that checks for music-related anniversaries",
    functions: [checkAnniversary, checkAlbumAnniversaries]
  });
}

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}