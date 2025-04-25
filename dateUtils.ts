/**
 * Utility functions to help with music date validation
 */

// Check if today is the anniversary of an album/event
export function isAnniversaryToday(releaseDate: string): boolean {
    try {
      // Parse the input date (format: YYYY-MM-DD or MM/DD/YYYY)
      const date = parseDate(releaseDate);
      if (!date) return false;
      
      // Get today's date
      const today = new Date();
      
      // Check if month and day match (anniversary)
      return (date.getMonth() === today.getMonth() && 
              date.getDate() === today.getDate());
    } catch (e) {
      console.error("Error checking anniversary:", e);
      return false;
    }
  }
  
  // Get the number of years since release
  export function getYearsSinceRelease(releaseDate: string): number | null {
    try {
      // Parse the release date
      const date = parseDate(releaseDate);
      if (!date) return null;
      
      // Get today's date
      const today = new Date();
      
      // Calculate years difference
      return today.getFullYear() - date.getFullYear();
    } catch (e) {
      console.error("Error calculating years since release:", e);
      return null;
    }
  }
  
  // Helper to parse different date formats
  function parseDate(dateString: string): Date | null {
    // Try different date formats
    // Format: YYYY-MM-DD
    if (dateString.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
      const parts = dateString.split('-');
      return new Date(
        parseInt(parts[0]), 
        parseInt(parts[1]) - 1, // Month is 0-indexed
        parseInt(parts[2])
      );
    } 
    // Format: MM/DD/YYYY
    else if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const parts = dateString.split('/');
      return new Date(
        parseInt(parts[2]), 
        parseInt(parts[0]) - 1, // Month is 0-indexed
        parseInt(parts[1])
      );
    }
    // Format: Month DD, YYYY (e.g. "June 1, 1967")
    else if (dateString.match(/^[A-Za-z]+ \d{1,2}, \d{4}$/)) {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
  }