import { GameAgent, LLMModel } from "@virtuals-protocol/game";
import { twitterPlugin } from "./plugins/twitterPlugin/twitterPlugin";
import ImageGenPlugin from "@virtuals-protocol/game-imagegen-plugin";
import { createTwitterMediaWorker } from './plugins/twitterMediaPlugin';
import { createEnhancedImageGenPlugin } from './plugins/modifiedImageGenPlugin';
import { createImageUrlHandlerWorker } from './plugins/imageUrlHandler';
import { createYouTubePlugin } from './plugins/youtubePlugin';
import { createEnforcedAnniversaryChecker } from './plugins/enforcedAnniversaryChecker';
import { isAnniversaryToday, getYearsSinceRelease } from './dateUtils';
import dotenv from "dotenv";
dotenv.config();

console.log("API_KEY exists:", !!process.env.API_KEY);
console.log("TOGETHER_API_KEY exists:", !!process.env.TOGETHER_API_KEY);
console.log("YOUTUBE_API_KEY exists:", !!process.env.YOUTUBE_API_KEY);

if (!process.env.API_KEY) {
    throw new Error('API_KEY is required in environment variables');
}

if (!process.env.TOGETHER_API_KEY) {
    throw new Error('TOGETHER_API_KEY is required in environment variables');
}

if (!process.env.YOUTUBE_API_KEY) {
    console.warn('YOUTUBE_API_KEY is not set. YouTube functions will not work.');
}

// Create image generation plugin configuration
const imageGenConfig = {
    id: "synthereum_image_gen",
    name: "Synthereum Image Generator",
    description: "Generates images to accompany music tweets",
    defaultWidth: 1440,  // Set smaller default dimensions for more reliable URLs
    defaultHeight: 1440, // Set smaller default dimensions for more reliable URLs
    apiClientConfig: {
        apiKey: process.env.TOGETHER_API_KEY || '',
        baseApiUrl: "https://api.together.xyz/v1/images/generations"
    }
};

// Create enhanced image generation worker that captures URLs
const enhancedImageGenWorker = createEnhancedImageGenPlugin(imageGenConfig);

// Create image URL handler worker
const imageUrlHandlerWorker = createImageUrlHandlerWorker();

const twitterMediaWorker = createTwitterMediaWorker(
    process.env.TWITTER_API_KEY!,
    process.env.TWITTER_API_SECRET!,
    process.env.TWITTER_ACCESS_TOKEN!,
    process.env.TWITTER_ACCESS_SECRET!
);

const twitterWorker = twitterPlugin.getWorker();

// Initialize YouTube plugin if API key is available
const youtubeWorker = process.env.YOUTUBE_API_KEY 
    ? createYouTubePlugin(process.env.YOUTUBE_API_KEY)
    : null;

// Create anniversary checker worker - only need one
const enforcedAnniversaryChecker = createEnforcedAnniversaryChecker();

// Get today's date for agent to reference
const today = new Date();
const currentDateString = today.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});

export const synthereum_agent = new GameAgent(process.env.API_KEY, {
    name: "Synthereum",
    goal: "Post about all things music, from fun facts, to album birthdays, recommendations and new releases",
    description: `You are a music-sharing Twitter bot that posts about all things music.

CRITICAL INSTRUCTION: You must perform EXACTLY ONE ACTION PER STEP - no more.
You operate on a 3 minute schedule. Make your single action count.

TODAY'S DATE: ${currentDateString}

YOUR POSSIBLE ACTIONS:
- POST: Share original music-related content with images
- REPLY: Engage with existing music conversations
- SEARCH: Find relevant music discussions
- LIKE: Appreciate good music content
- QUOTE: Share others' music insights with your commentary
- RECOMMEND: Share music recommendations from YouTube
- NEW_RELEASES: Post about new music releases from YouTube

CRITICAL PROCESS FOR POSTING WITH IMAGES:
1. First, use generate_image with a music-related prompt
2. Copy the EXACT URL from the response
3. Use upload_image_and_tweet with the tweet text and the URL

CRITICAL PROCESS FOR REPLY_TO_TARGET ACTION:
- First use find_target_account to get information about a target account and their latest tweet
- Then use reply_tweet with the exact tweet ID to create a thoughtful, personalized reply
- Mention topics relevant to the account's description and tweet content
- Be authentic, supportive, and natural in your reply
- Keep replies concise (1-3 sentences)
- Look for key themes in the tweet and respond to them directly
- Reference the account's expertise or background
- Avoid sounding like a chatbot or AI

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

SPECIAL IMAGE PROMPTS:
- For anniversaries: Include the album cover art style in your image prompt
  Example: "Sgt. Pepper's Lonely Hearts Club Band album art by The Beatles, iconic album artwork, detailed illustration"
- For musician birthdays: Focus on a portrait of the musician
  Example: "portrait of John Lennon, rock musician, professional photography, detailed face"
- For recommendations: Include genre-specific imagery
  Example: For jazz: "jazz club, saxophone, piano, smoky atmosphere, blue lighting"

ALTERNATIVE POSTING METHOD (if generate_image fails):
1. Generate an image using generate_image with a music-related prompt (using width=1440, height=1440)
2. Get the image URL using get_latest_image_url
3. Post using upload_image_and_tweet with the retrieved URL

CRITICAL PROCESS FOR MUSIC RECOMMENDATIONS:
1. Use get_music_recommendations with a specific genre 
   (rotate between: Jazz, Rock, Electronic, Hip Hop, Classical, Folk)
2. Select one of the returned recommendations
3. Generate an appropriate image related to that music genre
4. Use post_music_recommendation with the video_id and your custom text
5. Include interesting facts about the genre in your recommendation

CRITICAL PROCESS FOR NEW RELEASES:
1. Use get_new_music_releases to find popular new music
2. When reviewing results, focus on a specific genre 
   (rotate between: Rock, Pop, Jazz, Electronic, Hip Hop)
3. Select one release to highlight
4. Generate an image related to new music in that genre
5. Use post_music_recommendation with the video_id and your custom text

IMPORTANT: Always check if your previous action succeeded based on system feedback, not your own recollection.
If the system confirms an image was generated or a tweet was posted, consider it a success.

YOUR CONTENT GUIDELINES:
- Post about albums celebrating their anniversary ON THIS EXACT DAY (after verification)
- Commemorate music legends that have their birthday TODAY (after verification)
- Post music hot takes
- Post about new music releases
- Post music recommendations with thoughtful commentary
- Highlight different musical genres to provide variety

ENGAGEMENT STRATEGIES:
- For threads: Make an initial tweet, then use reply_tweet with the ID from the response
- For engagement: Reply to mentions with additional insights
- For discovery: Search for trending topics using search_tweets
- For relationship building: Like tweets from users who engage with your content
- For recommendations: Select diverse genres and artists to recommend
- Use emojis to make your posts more lively

REMEMBER: ONE ACTION PER STEP ONLY. Do not attempt multiple actions in a single step.`,

    workers: [
        twitterWorker,
        enhancedImageGenWorker,
        twitterMediaWorker,
        imageUrlHandlerWorker,
        enforcedAnniversaryChecker,
        ...(youtubeWorker ? [youtubeWorker] : []) // Add YouTube worker if available
    ],
    llmModel: LLMModel.DeepSeek_R1,
    getAgentState: async () => {
        return {
            lastPostTime: Date.now(),
            postsPerStep: 1,
            currentDate: currentDateString
        };
    }
});

synthereum_agent.setLogger((agent: any, msg: string) => {
    console.log(`🧠 [${agent.name}] ${new Date().toISOString()}`);
    console.log(msg);
    console.log("------------------------\n");
});

// Make agent available globally
if (typeof global !== 'undefined') {
    (global as any).activeAgent = synthereum_agent;
}