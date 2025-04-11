import { GameAgent, LLMModel } from "@virtuals-protocol/game";
import { twitterPlugin } from "./plugins/twitterPlugin/twitterPlugin";
import ImageGenPlugin from "@virtuals-protocol/game-imagegen-plugin";
import { createTwitterMediaWorker } from './plugins/twitterMediaPlugin';
import { createYouTubePlugin } from './plugins/youtubePlugin'; // Import YouTube plugin
import dotenv from "dotenv";
dotenv.config();

console.log("API_KEY exists:", !!process.env.API_KEY);
console.log("TOGETHER_API_KEY exists:", !!process.env.TOGETHER_API_KEY);
console.log("YOUTUBE_API_KEY exists:", !!process.env.YOUTUBE_API_KEY);

if (!process.env.API_KEY) {
    throw new Error('API_KEY is required in environment variables');
}

if (!process.env.YOUTUBE_API_KEY) {
    console.warn('YOUTUBE_API_KEY is not set. YouTube functions will not work.');
}

// For image generation, use the hardcoded key that we know works
const TOGETHER_API_KEY = '3e4ef24a05b59b07da4ad2d8445cbc76cfcf8c17793d40b90939682884e508b9';
console.log("Using hardcoded Together API key for reliable image generation");

// Create image generation plugin
const imageGenPlugin = new ImageGenPlugin({
    id: "synthereum_image_gen",
    name: "Synthereum Image Generator",
    description: "Generates images to accompany music tweets",
    apiClientConfig: {
        apiKey: TOGETHER_API_KEY,
        baseApiUrl: "https://api.together.xyz/v1/images/generations"
    }
});

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

CRITICAL IMAGE POSTING EXAMPLE:
- Step 1: Call generate_image with prompt "vintage vinyl records on a shelf"
- Step 2: Get response with URL like "https://api.together.ai/imgproxy/abc123"
- Step 3: Call upload_image_and_tweet("Today marks 50 years since Pink Floyd's Dark Side of the Moon was released! #PinkFloyd #MusicHistory", "https://api.together.ai/imgproxy/abc123")

DO NOT modify image URLs or use placeholders. Always copy the complete URL directly from generate_image to upload_image_and_tweet.

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
        imageGenPlugin.getWorker({}) as any,
        twitterMediaWorker,
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