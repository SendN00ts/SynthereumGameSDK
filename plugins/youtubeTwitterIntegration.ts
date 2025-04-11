import { GameWorker, GameFunction, ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from "@virtuals-protocol/game";
import axios from 'axios';

/**
 * Helper function to integrate YouTube recommendations with Twitter upload
 * This is needed to handle the YouTube thumbnail and post it to Twitter
 */
export function createYouTubeTwitterIntegration() {
  // Function to post a YouTube recommendation to Twitter with thumbnail
  const postRecommendationToTwitter = new GameFunction({
    name: "post_recommendation_to_twitter",
    description: "Post a YouTube recommendation to Twitter with the thumbnail",
    args: [
      { name: "video_data", description: "The JSON data from post_music_recommendation" },
    ],
    executable: async (args: { video_data?: string }, logger?: (msg: string) => void) => {
      try {
        const { video_data } = args;
        
        if (!video_data) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Video data is required"
          );
        }
        
        if (logger) logger("Processing video data for Twitter posting");
        
        // Parse the video data JSON
        let videoInfo;
        try {
          videoInfo = JSON.parse(video_data);
        } catch (error) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Invalid video data format. Expected JSON string."
          );
        }
        
        // Extract fields
        const { tweetText, thumbnailUrl } = videoInfo;
        
        if (!tweetText || !thumbnailUrl) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Missing required fields in video data"
          );
        }
        
        // Return formatted data to use with upload_image_and_tweet
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify({
            text: tweetText,
            imageUrl: thumbnailUrl
          })
        );
      } catch (error: any) {
        console.error('Error processing recommendation for Twitter:', error);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Failed to process recommendation: ${error?.message || 'Unknown error'}`
        );
      }
    }
  });

  return new GameWorker({
    id: "youtube_twitter_integration",
    name: "YouTube Twitter Integration",
    description: "Helper worker to integrate YouTube recommendations with Twitter posting",
    functions: [postRecommendationToTwitter]
  });
}