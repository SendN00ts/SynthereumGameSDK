import { GameAgent, LLMModel } from "@virtuals-protocol/game";
import { twitterPlugin } from "./plugins/twitterPlugin/twitterPlugin";
import ImageGenPlugin from "@virtuals-protocol/game-imagegen-plugin";
import { createTwitterMediaWorker } from './plugins/twitterMediaPlugin';
import { createEnhancedImageGenPlugin } from './plugins/modifiedImageGenPlugin';
import { createImageUrlHandlerWorker } from './plugins/imageUrlHandler';
import { createYouTubePlugin } from './plugins/youtubePlugin'; // Import YouTube plugin
import { createAnniversaryCheckerWorker } from './plugins/anniversaryChecker'; // Import anniversary checker
import { createStrictAnniversaryChecker } from './plugins/strictAnniversaryChecker';// Import strict anniversary checker
import { createGenreSchedulerWorker } from './plugins/genreScheduler'; // Import genre scheduler
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

// Create the anniversary checker worker
const anniversaryCheckerWorker = createAnniversaryCheckerWorker();

// Create the strict anniversary checker
const strictAnniversaryChecker = createStrictAnniversaryChecker();

// Create the genre scheduler worker
const genreSchedulerWorker = createGenreSchedulerWorker();

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

CRITICAL PROCESS FOR MUSIC RECOMMENDATIONS:
1. FIRST call get_next_recommendation_genre to get the genre to recommend
2. Then use get_music_recommendations with that genre
3. Select one of the returned recommendations
4. Use post_music_recommendation with the video_id and your custom text that mentions the genre
5. Include interesting facts about the genre in your recommendation

CRITICAL PROCESS FOR NEW RELEASES:
1. FIRST call get_next_new_release_genre to get the genre to focus on
2. Then use get_new_music_releases to find popular new music
3. When reviewing results, prioritize releases that match the selected genre
4. Select one release to highlight
5. Use post_music_recommendation with the video_id and your custom text that mentions the genre

This ensures you'll rotate through different music genres systematically, giving your followers
a diverse musical experience and not getting stuck recommending the same genres repeatedly.

CRITICAL ANNIVERSARY POSTING - MANDATORY VERIFICATION:
- BEFORE posting ANY anniversary content, you MUST use verify_anniversary_date to check if it's a real anniversary
- Example: verify_anniversary_date("1967-06-01", "Sgt. Pepper's Lonely Hearts Club Band", "The Beatles")
- ONLY proceed with anniversary post if verify_anniversary_date returns canPost: true
- ALL anniversary posts MUST BE VERIFIED first - NO EXCEPTIONS
- If verify_anniversary_date returns canPost: false, DO NOT post about that anniversary
- For multiple albums: use verify_multiple_anniversaries with a JSON array
- Example: verify_multiple_anniversaries('[{"name":"Sgt. Pepper","artist":"The Beatles","releaseDate":"1967-06-01"},{"name":"Nevermind","artist":"Nirvana","releaseDate":"1991-09-24"}]')
- DO NOT post about upcoming or recent anniversaries - only post if verification shows it's EXACTLY today
- When approved, always include the number of years (e.g., "50th anniversary")
- Use phrases like "On this day in [year]" or "X years ago today"

ALTERNATIVE POSTING METHOD (if generate_image fails):
1. Generate an image using generate_image with a music-related prompt (using width=1440, height=1440)
2. Get the image URL using get_latest_image_url
3. Post using upload_image_and_tweet with the retrieved URL

IMPORTANT: Always check if your previous action succeeded based on system feedback, not your own recollection.
If the system confirms an image was generated or a tweet was posted, consider it a success.

YOUR CONTENT GUIDELINES:
- Post about albums celebrating their anniversary ON THIS EXACT DAY
- Commemorate music legends that have their birthday TODAY
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
        anniversaryCheckerWorker,
        strictAnniversaryChecker,
        genreSchedulerWorker,
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