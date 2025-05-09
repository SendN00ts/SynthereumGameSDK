// src/index.ts
import { synthereum_agent } from './agent';

// Define actions as an enum to ensure type safety
enum ACTIONS {
  POST = 'post',
  POST_NO_IMAGE = 'post_no_image',
  REPLY = 'reply',
  SEARCH = 'search',
  LIKE = 'like',
  QUOTE = 'quote',
  RECOMMEND = 'recommend', // For music recommendations
  NEW_RELEASES = 'new_releases' // For new music releases
}

// Tracking variables
let lastPostTime = 0;
let functionCalledThisCycle = false;
let imageRetryCount = 0;
const MAX_IMAGE_RETRIES = 3;

// Config for timing - shorter intervals for testing purposes
const POST_INTERVAL = 1 * 60 * 1000;          // Every 1 minute
const OTHER_ACTION_INTERVAL = 2 * 60 * 1000;  // Every 2 minutes
const RECOMMENDATION_INTERVAL = 3 * 60 * 1000; // Every 3 minutes
const NEW_RELEASES_INTERVAL = 4 * 60 * 1000;  // Every 4 minutes

// Track current action in rotation (excluding POST which has its own schedule)
let currentActionIndex = 0;
const nonPostActions = [
  ACTIONS.REPLY, 
  ACTIONS.SEARCH, 
  ACTIONS.LIKE, 
  ACTIONS.QUOTE
];

// Track last times for special actions
let lastRecommendationTime = 0;
let lastNewReleasesTime = 0;

// Function to get next action based on timing
function getNextAction(): ACTIONS {
  const now = Date.now();
  const timeSinceLastPost = now - lastPostTime;
  const timeSinceLastRecommendation = now - lastRecommendationTime;
  const timeSinceLastNewRelease = now - lastNewReleasesTime;
  
  // If YouTube API key isn't set, don't recommend those actions
  const youtubeAvailable = !!process.env.YOUTUBE_API_KEY;
  
  // If it's been more than RECOMMENDATION_INTERVAL since last recommendation
  // and YouTube API is available, do a recommendation
  if (youtubeAvailable && timeSinceLastRecommendation >= RECOMMENDATION_INTERVAL) {
    return ACTIONS.RECOMMEND;
  }
  
  // If it's been more than NEW_RELEASES_INTERVAL since last new releases post
  // and YouTube API is available, do a new releases post
  if (youtubeAvailable && timeSinceLastNewRelease >= NEW_RELEASES_INTERVAL) {
    return ACTIONS.NEW_RELEASES;
  }
  
  // If it's been more than POST_INTERVAL since last post, do a post
  if (timeSinceLastPost >= POST_INTERVAL) {
    // If we've exceeded max retries for image posts, fall back to text-only
    if (imageRetryCount >= MAX_IMAGE_RETRIES) {
      console.log(`⚠️ Max image retries (${MAX_IMAGE_RETRIES}) reached. Posting without image.`);
      imageRetryCount = 0; // Reset for next time
      return ACTIONS.POST_NO_IMAGE;
    }
    return ACTIONS.POST;
  }
  
  // Otherwise, pick the next action in rotation
  const action = nonPostActions[currentActionIndex];
  currentActionIndex = (currentActionIndex + 1) % nonPostActions.length;
  return action;
}

// Function to update agent description with proper typing
function updateAgentForAction(action: ACTIONS, needsImageRegeneration = false): void {
  // Extract original description sections
  const baseDescription = synthereum_agent.description.split("CRITICAL INSTRUCTION:")[0];
  
  // Create new focused description with proper typing
  const actionDescriptions: Record<ACTIONS, string> = {
    [ACTIONS.POST]: "POST original music-related content with images",
    [ACTIONS.POST_NO_IMAGE]: "POST original music-related content WITHOUT an image (use post_tweet directly)",
    [ACTIONS.REPLY]: "REPLY to existing music conversations",
    [ACTIONS.SEARCH]: "SEARCH for relevant music discussions",
    [ACTIONS.LIKE]: "LIKE meaningful music content",
    [ACTIONS.QUOTE]: "QUOTE other music tweets with your commentary",
    [ACTIONS.RECOMMEND]: "RECOMMEND music from YouTube (use get_music_recommendations and post_music_recommendation)",
    [ACTIONS.NEW_RELEASES]: "Post about NEW MUSIC RELEASES from YouTube (use get_new_music_releases and post_music_recommendation)"
  };
  
  // Add regeneration hint if needed
  let additionalInstructions = "";
  if (needsImageRegeneration && action === ACTIONS.POST) {
    additionalInstructions = `
IMPORTANT: Previous attempt failed due to image URL issues (attempt ${imageRetryCount+1}/${MAX_IMAGE_RETRIES}).
Please generate a FRESH NEW IMAGE using generate_image before posting.
DO NOT reuse previous image URLs. Generate a completely new image with a simpler prompt.
Use simpler image descriptions with fewer details for more reliable processing.
`;
  }

  if (action === ACTIONS.POST_NO_IMAGE) {
    additionalInstructions = `
IMPORTANT: After several failed attempts with images, you should post text-only content.
DO NOT use generate_image or try to include an image.
Use the post_tweet function directly with your music content.
Create high-quality, thoughtful music content that stands on its own without an image.
`;
  }
  
  if (action === ACTIONS.RECOMMEND) {
    additionalInstructions = `
IMPORTANT: For recommendations, follow this EXACT process:
1. Use get_music_recommendations with a specific genre (try a different genre each time)
2. Review the results and select ONE video to recommend
3. Generate an image prompt related to that genre of music
4. Use post_music_recommendation with the selected video_id and your custom text

Choose diverse genres and artists for recommendations. Add your personal commentary on why you're recommending this music.
`;
  }
  
  if (action === ACTIONS.NEW_RELEASES) {
    additionalInstructions = `
IMPORTANT: For new releases, follow this EXACT process:
1. Use get_new_music_releases to find popular new music
2. Review the results and select ONE new release to highlight
3. Generate an image for the new release with a prompt that matches its genre
4. Use post_music_recommendation with the selected video_id and your custom text

Focus on what makes this release exciting, the artist's background, or the musical style in your commentary.
`;
  }
  
  // Update agent's description
  synthereum_agent.description = `You are a music-sharing Twitter bot that posts about all things music.

CRITICAL INSTRUCTION: You must perform EXACTLY ONE ACTION PER STEP - no more.
You operate on a 3-minute schedule. Make your single action count.

CURRENT REQUIRED ACTION: ${action.toUpperCase()}

You MUST perform ONLY this action: ${actionDescriptions[action]}
${additionalInstructions}
All other actions are forbidden in this cycle.

CRITICAL ANNIVERSARY POSTING - MANDATORY VERIFICATION:
1. BEFORE posting ANY anniversary content, you MUST first request approval:
   - For albums: request_anniversary_post_approval("1967-06-01", "Sgt. Pepper", "The Beatles")
   - For musicians: request_birthday_post_approval("1942-06-18", "Paul McCartney", "Rock legend")
2. These functions will verify if today is the EXACT anniversary/birthday date
3. The system has a database of KNOWN album release dates that it will check against
4. If a date you provide doesn't match a known release date, the request will be REJECTED
5. ONLY proceed if the approval function explicitly returns approved: true
6. IMPORTANT: Always use the correct MM-DD format when checking dates
7. NEVER post about anniversaries that aren't approved - NO EXCEPTIONS

CRITICAL PROCESS FOR POSTING WITH IMAGES:
1. First, use generate_image with a music-related prompt
2. Copy the EXACT URL from the response
3. Use upload_image_and_tweet with the tweet text and the URL

CRITICAL PROCESS FOR MUSIC RECOMMENDATIONS:
1. Use get_music_recommendations with a specific genre
2. Select one of the returned recommendations
3. Generate an appropriate image related to that music genre
4. Use post_music_recommendation with the video_id and your custom text
5. Include interesting facts about the genre in your recommendation

CRITICAL PROCESS FOR NEW RELEASES:
1. Use get_new_music_releases to find popular new music
2. Select one release to highlight
3. Generate an image related to new music in that genre
4. Use post_music_recommendation with the video_id and your custom text

SPECIAL IMAGE PROMPTS:
- For anniversaries: Include the album cover art style in your image prompt
  Example: "Sgt. Pepper's Lonely Hearts Club Band album art by The Beatles, iconic album artwork, detailed illustration"
- For musician birthdays: Focus on a portrait of the musician
  Example: "portrait of John Lennon, rock musician, professional photography, detailed face"
- For recommendations: Include genre-specific imagery
  Example: For jazz: "jazz club, saxophone, piano, smoky atmosphere, blue lighting"

YOUR CONTENT GUIDELINES:
- Post about albums celebrating their anniversary ON THIS EXACT DAY (after verification)
- Commemorate music legends that have their birthday TODAY (after verification)
- Post music hot takes
- Post about new music releases
- Post music recommendations with thoughtful commentary
- Highlight different musical genres to provide variety

IMPORTANT: Always check if your previous action succeeded based on system feedback, not your own recollection.
If the system confirms an image was generated or a tweet was posted, consider it a success.

REMEMBER: ONE ACTION PER STEP ONLY. Do not attempt multiple actions in a single step.`;
}

// Run agent with improved retry and scheduling
async function runAgentWithSchedule(retryCount = 0): Promise<void> {
  try {
    // Reset tracking
    functionCalledThisCycle = false;
    
    // Determine next action
    const nextAction = getNextAction();
    
    // Update agent description to focus on the chosen action
    updateAgentForAction(nextAction);
    
    // Run the appropriate action
    console.log(`Running agent step at ${new Date().toISOString()} - Action: ${nextAction}`);
    
    let success = false;
    
    try {
      switch (nextAction) {
        case ACTIONS.POST:
          // For posts, add special error handling to detect image URL issues
          const result = await synthereum_agent.step({ verbose: true });
          
          // Check if response contains any indication of image URL issues
          if (result && typeof result === 'string' && 
             (result.includes("invalid image URL") || 
              result.includes("Image URL") || 
              result.includes("URL format") ||
              result.includes("403 Forbidden"))) {
            
            // Increment retry counter
            imageRetryCount++;
            
            if (imageRetryCount < MAX_IMAGE_RETRIES) {
              console.log(`⚠️ Image URL validation failed. Retry ${imageRetryCount}/${MAX_IMAGE_RETRIES}`);
              throw new Error("Image URL validation failed - regenerating image required");
            } else {
              // Max retries reached, will post without image next time
              console.log(`⚠️ Max image retries reached (${MAX_IMAGE_RETRIES}). Will post without image next cycle.`);
              success = false; // Force retry with text-only
            }
          } else {
            // Success! Reset image retry counter
            imageRetryCount = 0;
            success = true;
          }
          break;
        
        case ACTIONS.POST_NO_IMAGE:
          // Posting without an image
          await synthereum_agent.step({ verbose: true });
          imageRetryCount = 0; // Reset counter after successful post
          success = true;
          break;
          
        case ACTIONS.RECOMMEND:
          // Handle music recommendation action
          await synthereum_agent.step({ verbose: true });
          lastRecommendationTime = Date.now();
          success = true;
          break;
          
        case ACTIONS.NEW_RELEASES:
          // Handle new releases action
          await synthereum_agent.step({ verbose: true });
          lastNewReleasesTime = Date.now();
          success = true;
          break;
          
        default:
          // Handle all other actions
          await synthereum_agent.step({ verbose: true });
          success = true;
      }
    } catch (error: unknown) {
      const actionError = error as Error;
      console.error(`Action error (${nextAction}):`, actionError.message);
      
      // Special handling for image URL errors
      if (nextAction === ACTIONS.POST && 
          typeof actionError.message === 'string' && 
          (actionError.message.includes("Image URL") || 
           actionError.message.includes("URL format") ||
           actionError.message.includes("403 Forbidden"))) {
        
        if (imageRetryCount < MAX_IMAGE_RETRIES) {
          // Add special instruction to regenerate image
          updateAgentForAction(nextAction, true); // true flag adds image regeneration hint
          console.log(`🔄 Retrying post with image regeneration hint (${imageRetryCount}/${MAX_IMAGE_RETRIES})...`);
          await synthereum_agent.step({ verbose: true });
          success = true; // Assume this retry worked
        } else {
          // Will switch to text-only post in next cycle
          success = false;
        }
      } else {
        // For non-image errors or if retry failed, rethrow
        throw actionError;
      }
    }
    
    // If this was a successful post, update last post time
    if ((nextAction === ACTIONS.POST || nextAction === ACTIONS.POST_NO_IMAGE) && success) {
      lastPostTime = Date.now();
      console.log("Post completed. Next post in 1 minute.");
    }
    
    // Schedule next action
    setTimeout(() => runAgentWithSchedule(0), OTHER_ACTION_INTERVAL);
    
  } catch (error) {
    // Error handling with exponential backoff
    console.error(`Error running agent step:`, error);
    
    const baseDelay = Math.min(
      (Math.pow(2, retryCount) * 60 * 1000),
      30 * 60 * 1000
    );
    const jitter = Math.random() * 30 * 1000;
    const retryDelay = baseDelay + jitter;
    
    console.log(`Retry attempt ${retryCount+1}, waiting ${Math.round(retryDelay/1000)} seconds...`);
    setTimeout(() => runAgentWithSchedule(retryCount + 1), retryDelay);
  }
}

async function main(): Promise<void> {
  try {
    console.log("Initializing Music Twitter Bot...");
    
    // Sanitize description
    const sanitizedDescription = synthereum_agent.description.replace(/[\uD800-\uDFFF](?![\uD800-\uDFFF])|(?:[^\uD800-\uDFFF]|^)[\uDC00-\uDFFF]/g, '');
    synthereum_agent.description = sanitizedDescription;
    
    await synthereum_agent.init();
    console.log("Music Twitter Bot initialized successfully!");
    
    // Log available functions
    console.log("Available functions:", synthereum_agent.workers.flatMap((w: any) =>
      w.functions.map((f: any) => f.name)
    ));

    // Start scheduling
    runAgentWithSchedule();
    
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    process.exit(1);
  }
}

main();