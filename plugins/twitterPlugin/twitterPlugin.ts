import TwitterPlugin, { GameTwitterClient } from "@virtuals-protocol/game-twitter-plugin";
import dotenv from "dotenv";
dotenv.config();

// Create Twitter client
const gameTwitterClient = new GameTwitterClient({
    accessToken: process.env.GAME_TWITTER_ACCESS_TOKEN || '',
});

// Create plugin
export const twitterPlugin = new TwitterPlugin({
    id: "synthereum_twitter_worker",
    name: "Synthereum Twitter Worker",
    description: "Worker that posts about all things music",
    twitterClient: gameTwitterClient,
});