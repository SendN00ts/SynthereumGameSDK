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
    const formats = [
      // YYYY-MM-DD
      (str: string) => {
        const parts = str.split('-');
        if (parts.length === 3) {
          return new Date(
            parseInt(parts[0]), 
            parseInt(parts[1]) - 1, // Month is 0-indexed
            parseInt(parts[2])
          );
        }
        return null;
      },
      // MM/DD/YYYY
      (str: string) => {
        const parts = str.split('/');
        if (parts.length === 3) {
          return new Date(
            parseInt(parts[2]), 
            parseInt(parts[0]) - 1, // Month is 0-indexed
            parseInt(parts[1])
          );
        }
        return null;
      },
      // Month DD, YYYY (e.g. "June 1, 1967")
      (str: string) => {
        const date = new Date(str);
        return isNaN(date.getTime()) ? null : date;
      }
    ];
    
    // Try each format
    for (const formatFn of formats) {
      const date = formatFn(dateString);
      if (date) return date;
    }
    
    return null;
  }