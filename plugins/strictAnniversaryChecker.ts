import { GameWorker, GameFunction, ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from "@virtuals-protocol/game";

/**
 * Creates a worker with strict verification for album anniversaries
 * This enforces that anniversaries can only be posted on the exact day
 */
export function createStrictAnniversaryChecker() {
  // Function to strictly verify an anniversary date
  const verifyAnniversaryDate = new GameFunction({
    name: "verify_anniversary_date",
    description: "Strictly verify if today is the exact anniversary of a release date before posting about it",
    args: [
      { name: "release_date", description: "The original release date (YYYY-MM-DD, MM/DD/YYYY, or Month Day, Year)" },
      { name: "album_name", description: "Name of the album or event being checked" },
      { name: "artist_name", description: "Name of the artist" }
    ],
    executable: async (args: { release_date?: string, album_name?: string, artist_name?: string }, logger?: (msg: string) => void) => {
      try {
        const { release_date, album_name, artist_name } = args;
        
        if (!release_date) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            JSON.stringify({
              verified: false,
              reason: "Release date is required",
              canPost: false
            })
          );
        }
        
        if (logger) logger(`Strictly verifying anniversary for ${album_name || "unknown album"} released on ${release_date}`);
        
        // Today's date
        const today = new Date();
        const todayMonth = today.getMonth() + 1; // 1-12
        const todayDay = today.getDate(); // 1-31
        
        // Parse the input date
        let releaseMonth = -1;
        let releaseDay = -1;
        let releaseYear = -1;
        let dateIsValid = false;
        
        // Try different date formats
        // Format: YYYY-MM-DD
        if (release_date.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
          const parts = release_date.split('-');
          releaseYear = parseInt(parts[0], 10);
          releaseMonth = parseInt(parts[1], 10);
          releaseDay = parseInt(parts[2], 10);
          dateIsValid = true;
        } 
        // Format: MM/DD/YYYY
        else if (release_date.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
          const parts = release_date.split('/');
          releaseMonth = parseInt(parts[0], 10);
          releaseDay = parseInt(parts[1], 10);
          releaseYear = parseInt(parts[2], 10);
          dateIsValid = true;
        }
        // Format: Month Day, Year (e.g. "June 1, 1967")
        else if (release_date.match(/^[A-Za-z]+ \d{1,2}, \d{4}$/)) {
          const date = new Date(release_date);
          if (!isNaN(date.getTime())) {
            releaseMonth = date.getMonth() + 1;
            releaseDay = date.getDate();
            releaseYear = date.getFullYear();
            dateIsValid = true;
          }
        }
        
        // If we couldn't parse the date
        if (!dateIsValid || releaseMonth < 1 || releaseDay < 1 || releaseYear < 1) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify({
              verified: false,
              reason: "Could not parse the release date. Please use format YYYY-MM-DD, MM/DD/YYYY, or Month Day, Year",
              canPost: false
            })
          );
        }
        
        // Check if today is the anniversary (same month and day)
        const isAnniversary = (releaseMonth === todayMonth && releaseDay === todayDay);
        
        // Calculate years since release if it's an anniversary
        const yearsSince = isAnniversary ? (today.getFullYear() - releaseYear) : null;
        const ordinal = yearsSince ? getOrdinal(yearsSince) : null;
        
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify({
            verified: true,
            isExactAnniversary: isAnniversary,
            album: album_name || "Unknown Album",
            artist: artist_name || "Unknown Artist",
            releaseDate: `${releaseYear}-${releaseMonth.toString().padStart(2, '0')}-${releaseDay.toString().padStart(2, '0')}`,
            todayDate: `${today.getFullYear()}-${(todayMonth).toString().padStart(2, '0')}-${todayDay.toString().padStart(2, '0')}`,
            yearsSince: yearsSince,
            ordinal: ordinal,
            canPost: isAnniversary,
            suggestionIfNotAnniversary: isAnniversary ? null : 
              `Today (${todayMonth}/${todayDay}) is not the anniversary of ${album_name || "this album"} (${releaseMonth}/${releaseDay}). Please post about something else.`
          })
        );
      } catch (error: any) {
        console.error('Error verifying anniversary date:', error);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          JSON.stringify({
            verified: false,
            reason: `Failed to verify anniversary: ${error?.message || 'Unknown error'}`,
            canPost: false
          })
        );
      }
    }
  });
  
  // Function to verify a batch of album anniversaries
  const verifyMultipleAnniversaries = new GameFunction({
    name: "verify_multiple_anniversaries",
    description: "Check multiple albums and return only those having exact anniversaries today",
    args: [
      { name: "albums", description: "JSON array of album objects with name, artist, and releaseDate properties" }
    ],
    executable: async (args: { albums?: string }, logger?: (msg: string) => void) => {
      try {
        const { albums } = args;
        
        if (!albums) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            JSON.stringify({
              verified: false,
              reason: "Albums data is required",
              canPost: false
            })
          );
        }
        
        if (logger) logger(`Verifying multiple album anniversaries`);
        
        // Parse the albums JSON
        let albumsData;
        try {
          albumsData = JSON.parse(albums);
        } catch (e) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            JSON.stringify({
              verified: false,
              reason: "Invalid JSON format for albums data",
              canPost: false
            })
          );
        }
        
        if (!Array.isArray(albumsData)) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            JSON.stringify({
              verified: false,
              reason: "Albums data must be an array",
              canPost: false
            })
          );
        }
        
        // Today's date
        const today = new Date();
        const todayMonth = today.getMonth() + 1; // 1-12
        const todayDay = today.getDate(); // 1-31
        
        // Check each album for anniversary
        const results = albumsData.map(album => {
          const { name, artist, releaseDate } = album;
          
          if (!name || !releaseDate) {
            return {
              album: name || "Unknown",
              artist: artist || "Unknown",
              isValid: false,
              isExactAnniversary: false,
              reason: "Missing required fields (name or releaseDate)"
            };
          }
          
          // Parse the release date
          let releaseMonth = -1;
          let releaseDay = -1;
          let releaseYear = -1;
          let dateIsValid = false;
          
          // Try different date formats
          // Format: YYYY-MM-DD
          if (releaseDate.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
            const parts = releaseDate.split('-');
            releaseYear = parseInt(parts[0], 10);
            releaseMonth = parseInt(parts[1], 10);
            releaseDay = parseInt(parts[2], 10);
            dateIsValid = true;
          } 
          // Format: MM/DD/YYYY
          else if (releaseDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            const parts = releaseDate.split('/');
            releaseMonth = parseInt(parts[0], 10);
            releaseDay = parseInt(parts[1], 10);
            releaseYear = parseInt(parts[2], 10);
            dateIsValid = true;
          }
          // Format: Month Day, Year (e.g. "June 1, 1967")
          else if (releaseDate.match(/^[A-Za-z]+ \d{1,2}, \d{4}$/)) {
            const date = new Date(releaseDate);
            if (!isNaN(date.getTime())) {
              releaseMonth = date.getMonth() + 1;
              releaseDay = date.getDate();
              releaseYear = date.getFullYear();
              dateIsValid = true;
            }
          }
          
          if (!dateIsValid) {
            return {
              album: name,
              artist: artist || "Unknown",
              isValid: false,
              isExactAnniversary: false,
              reason: "Invalid date format"
            };
          }
          
          // Check if it's an anniversary
          const isAnniversary = (releaseMonth === todayMonth && releaseDay === todayDay);
          const yearsSince = isAnniversary ? (today.getFullYear() - releaseYear) : null;
          
          return {
            album: name,
            artist: artist || "Unknown",
            releaseDate: `${releaseYear}-${releaseMonth.toString().padStart(2, '0')}-${releaseDay.toString().padStart(2, '0')}`,
            parsedMonth: releaseMonth,
            parsedDay: releaseDay,
            parsedYear: releaseYear,
            isValid: true,
            isExactAnniversary: isAnniversary,
            yearsSince: yearsSince,
            ordinal: yearsSince ? getOrdinal(yearsSince) : null
          };
        });
        
        // Filter to valid anniversaries only
        const validAnniversaries = results.filter(result => 
          result.isValid && result.isExactAnniversary
        );
        
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify({
            verified: true,
            todayDate: `${today.getFullYear()}-${(todayMonth).toString().padStart(2, '0')}-${todayDay.toString().padStart(2, '0')}`,
            todayMonthDay: `${todayMonth}/${todayDay}`,
            totalAlbums: results.length,
            validAnniversariesCount: validAnniversaries.length,
            validAnniversaries: validAnniversaries,
            canPost: validAnniversaries.length > 0,
            message: validAnniversaries.length > 0 
              ? `Found ${validAnniversaries.length} album(s) with exact anniversaries today (${todayMonth}/${todayDay}).` 
              : `No albums have anniversaries today (${todayMonth}/${todayDay}). Please post about something else.`
          })
        );
      } catch (error: any) {
        console.error('Error verifying multiple anniversaries:', error);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          JSON.stringify({
            verified: false,
            reason: `Failed to verify anniversaries: ${error?.message || 'Unknown error'}`,
            canPost: false
          })
        );
      }
    }
  });

  return new GameWorker({
    id: "strict_anniversary_checker",
    name: "Strict Anniversary Checker",
    description: "Worker that strictly verifies album anniversaries with mandatory checks before posting",
    functions: [verifyAnniversaryDate, verifyMultipleAnniversaries]
  });
}

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}