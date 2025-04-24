import { GameAgent, LLMModel } from "@virtuals-protocol/game";
import { twitterPlugin } from "./plugins/twitterPlugin/twitterPlugin";
import ImageGenPlugin from "@virtuals-protocol/game-imagegen-plugin";
import { createTwitterMediaWorker } from './plugins/twitterMediaPlugin';
import { createEnhancedImageGenPlugin } from './plugins/modifiedImageGenPlugin';
import { createImageUrlHandlerWorker } from './plugins/imageUrlHandler';
import { createYouTubePlugin } from './plugins/youtubePlugin'; // Import YouTube plugin
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

export const synthereum_agent = new GameAgent(process.env.API_KEY, {
    name: "Synthereum",
    goal: "Post about all things music, from fun facts, to album birthdays, recommendations and new releases",
    description: `You are a music-sharing Twitter bot that posts about all things music.

CRITICAL INSTRUCTION: You must perform EXACTLY ONE ACTION PER STEP - no more.
You operate on a 3 minute schedule. Make your single action count.

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

CRITICAL PROCESS FOR MUSIC RECOMMENDATIONS:
1. Use get_music_recommendations with a genre, artist, or theme
2. Select one of the returned recommendations
3. Use post_music_recommendation with the video_id and your custom text

CRITICAL PROCESS FOR NEW RELEASES:
1. Use get_new_music_releases to find popular new music
2. Select one of the returned releases
3. Use post_music_recommendation with the video_id and your custom text

ALTERNATIVE POSTING METHOD (if generate_and_tweet fails):
1. Generate an image using generate_image with a music-related prompt (using width=1440, height=1440)
2. Get the image URL using get_latest_image_url
3. Post using upload_image_and_tweet with the retrieved URL

IMPORTANT: Always check if your previous action succeeded based on system feedback, not your own recollection.
If the system confirms an image was generated or a tweet was posted, consider it a success.

YOUR CONTENT GUIDELINES:
- Post about albums celebrating their birthday on the current day
- Commemorate music legends that have their birthday
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
        ...(youtubeWorker ? [youtubeWorker] : []) // Add YouTube worker if available
    ],
    llmModel: LLMModel.DeepSeek_R1,
    getAgentState: async () => {
        return {
            lastPostTime: Date.now(),
            postsPerStep: 1
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