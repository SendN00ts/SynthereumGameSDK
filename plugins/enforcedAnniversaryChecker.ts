import { GameWorker, GameFunction, ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from "@virtuals-protocol/game";

export function createEnforcedAnniversaryChecker() {
  // Keep a record of verified anniversaries that are approved for posting
  const approvedAnniversaries = new Map<string, {
    album: string;
    artist: string;
    releaseDate: string;
    yearsSince: number;
    approvalId: string;
    approved: boolean;
  }>();

  // Clear out old approvals every 24 hours
  setInterval(() => {
    approvedAnniversaries.clear();
  }, 24 * 60 * 60 * 1000);

  // Function to verify an anniversary date and get an approval ID
  const requestAnniversaryPostApproval = new GameFunction({
    name: "request_anniversary_post_approval",
    description: "Request approval to post about an album anniversary - MUST BE CALLED before posting any anniversary",
    args: [
      { name: "release_date", description: "The original release date (YYYY-MM-DD, MM/DD/YYYY, or Month Day, Year)" },
      { name: "album_name", description: "Name of the album" },
      { name: "artist_name", description: "Name of the artist" }
    ],
    executable: async (args: { release_date?: string, album_name?: string, artist_name?: string }, logger?: (msg: string) => void) => {
      try {
        const { release_date, album_name, artist_name } = args;
        
        if (!release_date || !album_name || !artist_name) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            JSON.stringify({
              approved: false,
              reason: "All fields (release_date, album_name, artist_name) are required",
              approvalId: null
            })
          );
        }
        
        if (logger) logger(`Requesting approval to post about anniversary for ${album_name} by ${artist_name} released on ${release_date}`);
        
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
        if (release_date.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
          const parts = release_date.split('-');
          releaseYear = parseInt(parts[0], 10);
          releaseMonth = parseInt(parts[1], 10);
          releaseDay = parseInt(parts[2], 10);
          dateIsValid = true;
        } 
        else if (release_date.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
          const parts = release_date.split('/');
          releaseMonth = parseInt(parts[0], 10);
          releaseDay = parseInt(parts[1], 10);
          releaseYear = parseInt(parts[2], 10);
          dateIsValid = true;
        }
        else if (release_date.match(/^[A-Za-z]+ \d{1,2}, \d{4}$/)) {
          const date = new Date(release_date);
          if (!isNaN(date.getTime())) {
            releaseMonth = date.getMonth() + 1;
            releaseDay = date.getDate();
            releaseYear = date.getFullYear();
            dateIsValid = true;
          }
        }
        
        if (!dateIsValid || releaseMonth < 1 || releaseDay < 1 || releaseYear < 1) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify({
              approved: false,
              reason: "Invalid date format. Please use YYYY-MM-DD, MM/DD/YYYY, or Month Day, Year",
              approvalId: null
            })
          );
        }
        
        // Check if today is the anniversary (same month and day)
        const isAnniversary = (releaseMonth === todayMonth && releaseDay === todayDay);
        
        if (!isAnniversary) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify({
              approved: false,
              album: album_name,
              artist: artist_name,
              releaseDate: release_date,
              actualMonth: releaseMonth,
              actualDay: releaseDay,
              todayMonth: todayMonth,
              todayDay: todayDay,
              reason: `Today (${todayMonth}/${todayDay}) is NOT the anniversary of ${album_name} by ${artist_name} (${releaseMonth}/${releaseDay})`,
              approvalId: null
            })
          );
        }
        
        // It is the anniversary! Calculate years since release
        const yearsSince = today.getFullYear() - releaseYear;
        
        // Generate a unique approval ID
        const approvalId = `anniversary-${album_name.replace(/\s+/g, '-')}-${Date.now()}`;
        
        // Store the approval
        approvedAnniversaries.set(approvalId, {
          album: album_name,
          artist: artist_name,
          releaseDate: release_date,
          yearsSince,
          approvalId,
          approved: true
        });
        
        // Return the approval
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify({
            approved: true,
            album: album_name,
            artist: artist_name,
            releaseDate: release_date,
            yearsSince,
            ordinal: getOrdinal(yearsSince),
            approvalId,
            message: `✅ APPROVED: Today (${todayMonth}/${todayDay}) is the ${getOrdinal(yearsSince)} anniversary of ${album_name} by ${artist_name}, released in ${releaseYear}`,
            suggestionPrompt: `"${album_name}" by ${artist_name} album cover art, iconic album artwork, detailed illustration, music history`
          })
        );
      } catch (error: any) {
        console.error('Error processing anniversary approval request:', error);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          JSON.stringify({
            approved: false,
            reason: `Error: ${error?.message || 'Unknown error'}`,
            approvalId: null
          })
        );
      }
    }
  });
  
  // Function to verify a musician's birthday
  const requestBirthdayPostApproval = new GameFunction({
    name: "request_birthday_post_approval",
    description: "Request approval to post about a musician's birthday - MUST BE CALLED before posting any birthday content",
    args: [
      { name: "birth_date", description: "The musician's birth date (YYYY-MM-DD, MM/DD/YYYY, or Month Day, Year)" },
      { name: "musician_name", description: "Name of the musician" },
      { name: "additional_info", description: "Brief description or genre of the musician" }
    ],
    executable: async (args: { birth_date?: string, musician_name?: string, additional_info?: string }, logger?: (msg: string) => void) => {
      try {
        const { birth_date, musician_name, additional_info } = args;
        
        if (!birth_date || !musician_name) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            JSON.stringify({
              approved: false,
              reason: "Birth date and musician name are required",
              approvalId: null
            })
          );
        }
        
        if (logger) logger(`Requesting approval to post about birthday for ${musician_name} born on ${birth_date}`);
        
        // Today's date
        const today = new Date();
        const todayMonth = today.getMonth() + 1; // 1-12
        const todayDay = today.getDate(); // 1-31
        
        // Parse the input date
        let birthMonth = -1;
        let birthDay = -1;
        let birthYear = -1;
        let dateIsValid = false;
        
        // Try different date formats
        if (birth_date.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
          const parts = birth_date.split('-');
          birthYear = parseInt(parts[0], 10);
          birthMonth = parseInt(parts[1], 10);
          birthDay = parseInt(parts[2], 10);
          dateIsValid = true;
        } 
        else if (birth_date.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
          const parts = birth_date.split('/');
          birthMonth = parseInt(parts[0], 10);
          birthDay = parseInt(parts[1], 10);
          birthYear = parseInt(parts[2], 10);
          dateIsValid = true;
        }
        else if (birth_date.match(/^[A-Za-z]+ \d{1,2}, \d{4}$/)) {
          const date = new Date(birth_date);
          if (!isNaN(date.getTime())) {
            birthMonth = date.getMonth() + 1;
            birthDay = date.getDate();
            birthYear = date.getFullYear();
            dateIsValid = true;
          }
        }
        
        if (!dateIsValid || birthMonth < 1 || birthDay < 1 || birthYear < 1) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify({
              approved: false,
              reason: "Invalid date format. Please use YYYY-MM-DD, MM/DD/YYYY, or Month Day, Year",
              approvalId: null
            })
          );
        }
        
        // Check if today is the birthday (same month and day)
        const isBirthday = (birthMonth === todayMonth && birthDay === todayDay);
        
        if (!isBirthday) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify({
              approved: false,
              musician: musician_name,
              birthDate: birth_date,
              actualMonth: birthMonth,
              actualDay: birthDay,
              todayMonth: todayMonth,
              todayDay: todayDay,
              reason: `Today (${todayMonth}/${todayDay}) is NOT ${musician_name}'s birthday (${birthMonth}/${birthDay})`,
              approvalId: null
            })
          );
        }
        
        // It is the birthday! Calculate age (if still alive) or birth year
        const yearsSince = today.getFullYear() - birthYear;
        
        // Generate a unique approval ID
        const approvalId = `birthday-${musician_name.replace(/\s+/g, '-')}-${Date.now()}`;
        
        // Store the approval
        approvedAnniversaries.set(approvalId, {
          album: "N/A",
          artist: musician_name,
          releaseDate: birth_date,
          yearsSince,
          approvalId,
          approved: true
        });
        
        // Return the approval
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify({
            approved: true,
            musician: musician_name,
            birthDate: birth_date,
            birthYear: birthYear,
            yearsSince,
            approvalId,
            message: `✅ APPROVED: Today (${todayMonth}/${todayDay}) is ${musician_name}'s birthday - born in ${birthYear}`,
            suggestionPrompt: `portrait of ${musician_name}, ${additional_info || 'musician'}, professional photographic style, music artist, detailed face`
          })
        );
      } catch (error: any) {
        console.error('Error processing birthday approval request:', error);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          JSON.stringify({
            approved: false,
            reason: `Error: ${error?.message || 'Unknown error'}`,
            approvalId: null
          })
        );
      }
    }
  });
  
  // Function to verify an approval ID before posting
  const verifyApprovalBeforePosting = new GameFunction({
    name: "verify_approval_before_posting",
    description: "Verify that an anniversary or birthday has been approved before posting",
    args: [
      { name: "approval_id", description: "The approval ID received from request_anniversary_post_approval or request_birthday_post_approval" }
    ],
    executable: async (args: { approval_id?: string }, logger?: (msg: string) => void) => {
      try {
        const { approval_id } = args;
        
        if (!approval_id) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            JSON.stringify({
              verified: false,
              canPost: false,
              reason: "Approval ID is required"
            })
          );
        }
        
        if (logger) logger(`Verifying approval ID before posting: ${approval_id}`);
        
        // Check if the approval ID exists
        if (!approvedAnniversaries.has(approval_id)) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            JSON.stringify({
              verified: true,
              canPost: false,
              reason: "This approval ID is not valid or has expired. You must request a new approval."
            })
          );
        }
        
        // Get the approval details
        const approval = approvedAnniversaries.get(approval_id)!;
        
        // Return the verification
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify({
            verified: true,
            canPost: approval.approved,
            album: approval.album,
            artist: approval.artist,
            releaseDate: approval.releaseDate,
            yearsSince: approval.yearsSince,
            ordinal: getOrdinal(approval.yearsSince),
            approvalId: approval.approvalId,
            message: approval.approved
              ? `✅ VERIFIED: You are approved to post about this ${approval.album === 'N/A' ? 'birthday' : 'anniversary'}.`
              : `❌ NOT APPROVED: You are not approved to post about this ${approval.album === 'N/A' ? 'birthday' : 'anniversary'}.`
          })
        );
      } catch (error: any) {
        console.error('Error verifying approval ID:', error);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          JSON.stringify({
            verified: false,
            canPost: false,
            reason: `Error: ${error?.message || 'Unknown error'}`
          })
        );
      }
    }
  });

  return new GameWorker({
    id: "enforced_anniversary_checker",
    name: "Enforced Anniversary Checker",
    description: "Worker that enforces strict verification before posting any anniversary or birthday content",
    functions: [
      requestAnniversaryPostApproval,
      requestBirthdayPostApproval,
      verifyApprovalBeforePosting
    ]
  });
}

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}