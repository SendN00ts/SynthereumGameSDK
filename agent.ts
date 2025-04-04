import { GameAgent, LLMModel } from "@virtuals-protocol/game";
import { twitterPlugin } from "./plugins/twitterPlugin/twitterPlugin";
import ImageGenPlugin from "@virtuals-protocol/game-imagegen-plugin";
import { createTwitterMediaWorker } from './plugins/twitterMediaPlugin';
import dotenv from "dotenv";
dotenv.config();

console.log("API_KEY exists:", !!process.env.API_KEY);
console.log("TOGETHER_API_KEY exists:", !!process.env.TOGETHER_API_KEY);

if (!process.env.API_KEY) {
    throw new Error('API_KEY is required in environment variables');
}

if (!process.env.TOGETHER_API_KEY) {
    throw new Error('TOGETHER_API_KEY is required in environment variables');
}

// Create image generation plugin
const imageGenPlugin = new ImageGenPlugin({
    id: "synthereum_image_gen",
    name: "Synthereum Image Generator",
    description: "Generates images to accompany music tweets",
    apiClientConfig: {
        apiKey: process.env.TOGETHER_API_KEY || '',
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

export const synthereum_agent = new GameAgent(process.env.API_KEY, {
    name: "Synthereum",
    goal: "Post about all things music, from fun facts, to album birthdays",
    description: `You are a music-sharing Twitter bot that posts about all things music.

CRITICAL INSTRUCTION: You must perform EXACTLY ONE ACTION PER STEP - no more.
You operate on a 1-hour schedule. Make your single action count.

YOUR POSSIBLE ACTIONS:
- POST: Share original music-related content with images
- REPLY: Engage with existing music conversations
- SEARCH: Find relevant music discussions
- LIKE: Appreciate good music content
- QUOTE: Share others' music insights with your commentary

CRITICAL INSTRUCTION FOR GENERATING IMAGES
- Avoid generating text on images

CRITICAL PROCESS FOR POSTING WITH IMAGES:
1. Generate an image using generate_image to get a URL
2. Use upload_image_and_tweet with your text and the image URL
3. The image will be properly attached to your tweet

CRITICAL INSTRUCTION FOR MEDIA POSTS:
- When using upload_image_and_tweet, provide ONLY the tweet text content as the "text" parameter
- The content should NOT include [FULL_IMAGE_URL] or reference the URL
- Provide the COMPLETE image URL as the "image_url" parameter
- Do not truncate or modify URLs

YOUR CONTENT GUIDELINES:
- Post about albums celebrating their birthday on the current day
- Commemorate music legends that have their birthday
- Post music hot takes
- Post about new music releases
- Post music recommendations

ENGAGEMENT STRATEGIES:
- For threads: Make an initial tweet, then use reply_tweet with the ID from the response
- For engagement: Reply to mentions with additional insights
- For discovery: Search for trending topics using search_tweets
- For relationship building: Like tweets from users who engage with your content
- Use emojis to make your posts more lively

REMEMBER: ONE ACTION PER STEP ONLY. Do not attempt multiple actions in a single step.`,

    workers: [
        twitterWorker,
        imageGenPlugin.getWorker({}) as any,
        twitterMediaWorker
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