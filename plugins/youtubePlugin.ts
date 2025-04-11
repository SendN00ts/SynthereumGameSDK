import { GameWorker, GameFunction, ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from "@virtuals-protocol/game";
import axios from 'axios';

// YouTube API client helper
class YouTubeAPI {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  // Search for music videos with specific parameters
  async searchMusicVideos(query: string, maxResults: number = 5): Promise<any> {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          maxResults,
          type: 'video',
          videoCategoryId: '10', // Music category
          key: this.apiKey
        }
      });
      
      return response.data.items;
    } catch (error: any) {
      console.error('YouTube API search error:', error.message);
      throw error;
    }
  }
  
  // Get popular music videos (can be used for new releases)
  async getPopularMusicVideos(maxResults: number = 5, regionCode: string = 'US'): Promise<any> {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet,statistics',
          chart: 'mostPopular',
          videoCategoryId: '10', // Music category
          maxResults,
          regionCode,
          key: this.apiKey
        }
      });
      
      return response.data.items;
    } catch (error: any) {
      console.error('YouTube API popular videos error:', error.message);
      throw error;
    }
  }
  
  // Get video details with additional information (helpful for recommendations)
  async getVideoDetails(videoId: string): Promise<any> {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet,statistics,contentDetails',
          id: videoId,
          key: this.apiKey
        }
      });
      
      return response.data.items[0];
    } catch (error: any) {
      console.error('YouTube API video details error:', error.message);
      throw error;
    }
  }
}

export function createYouTubePlugin(apiKey: string) {
  // Initialize YouTube API client
  const youtubeClient = new YouTubeAPI(apiKey);
  
  // Function to get music recommendations
  const getMusicRecommendations = new GameFunction({
    name: "get_music_recommendations",
    description: "Search for music recommendations based on a genre, artist, or theme",
    args: [
      { name: "query", description: "The music genre, artist, or theme to search for" },
      { name: "max_results", description: "Maximum number of results to return (default: 5)" }
    ],
    executable: async (args: { query?: string, max_results?: number }, logger?: (msg: string) => void) => {
      try {
        const { query, max_results = 5 } = args;
        
        if (!query) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "A search query is required"
          );
        }
        
        if (logger) logger(`Searching for music recommendations: ${query}`);
        
        const videos = await youtubeClient.searchMusicVideos(query, max_results);
        
        if (!videos || videos.length === 0) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            "No music recommendations found for this query"
          );
        }
        
        // Format results in a useful way for the agent
        const formattedResults = videos.map((video: any) => ({
          title: video.snippet.title,
          channelTitle: video.snippet.channelTitle,
          description: video.snippet.description,
          publishedAt: video.snippet.publishedAt,
          thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
          videoId: video.id.videoId,
          videoUrl: `https://youtube.com/watch?v=${video.id.videoId}`
        }));
        
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify(formattedResults)
        );
      } catch (error: any) {
        console.error('Error getting music recommendations:', error);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Failed to get music recommendations: ${error?.message || 'Unknown error'}`
        );
      }
    }
  });
  
  // Function to get new music releases
  const getNewMusicReleases = new GameFunction({
    name: "get_new_music_releases",
    description: "Get popular new music releases from YouTube",
    args: [
      { name: "max_results", description: "Maximum number of results to return (default: 5)" },
      { name: "region_code", description: "Region code for localized results (default: US)" }
    ],
    executable: async (args: { max_results?: number, region_code?: string }, logger?: (msg: string) => void) => {
      try {
        const { max_results = 5, region_code = 'US' } = args;
        
        if (logger) logger(`Getting new music releases for region: ${region_code}`);
        
        const videos = await youtubeClient.getPopularMusicVideos(max_results, region_code);
        
        if (!videos || videos.length === 0) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Done,
            "No popular music releases found"
          );
        }
        
        // Get publication dates and filter to likely new releases (within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Format the results
        const formattedResults = videos
          .filter((video: any) => {
            const publishedDate = new Date(video.snippet.publishedAt);
            return publishedDate >= thirtyDaysAgo;
          })
          .map((video: any) => ({
            title: video.snippet.title,
            channelTitle: video.snippet.channelTitle,
            description: video.snippet.description,
            publishedAt: video.snippet.publishedAt,
            viewCount: video.statistics.viewCount,
            likeCount: video.statistics.likeCount,
            thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
            videoId: video.id,
            videoUrl: `https://youtube.com/watch?v=${video.id}`
          }));
        
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify(formattedResults.length > 0 ? formattedResults : videos.map((video: any) => ({
            title: video.snippet.title,
            channelTitle: video.snippet.channelTitle,
            description: video.snippet.description,
            publishedAt: video.snippet.publishedAt,
            viewCount: video.statistics.viewCount,
            likeCount: video.statistics.likeCount,
            thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
            videoId: video.id,
            videoUrl: `https://youtube.com/watch?v=${video.id}`
          })))
        );
      } catch (error: any) {
        console.error('Error getting new music releases:', error);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Failed to get new music releases: ${error?.message || 'Unknown error'}`
        );
      }
    }
  });

  // Function to post a music recommendation with image
  const postMusicRecommendation = new GameFunction({
    name: "post_music_recommendation",
    description: "Post a music recommendation tweet with YouTube thumbnail image",
    args: [
      { name: "video_id", description: "YouTube video ID to recommend" },
      { name: "custom_text", description: "Custom recommendation text (optional)" }
    ],
    executable: async (args: { video_id?: string, custom_text?: string }, logger?: (msg: string) => void) => {
      try {
        const { video_id, custom_text } = args;
        
        if (!video_id) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "YouTube video ID is required"
          );
        }
        
        if (logger) logger(`Getting video details for recommendation: ${video_id}`);
        
        // Get video details
        const videoDetails = await youtubeClient.getVideoDetails(video_id);
        
        if (!videoDetails) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Could not retrieve video details"
          );
        }
        
        // Get high quality thumbnail
        const thumbnailUrl = videoDetails.snippet.thumbnails.maxres?.url || 
                            videoDetails.snippet.thumbnails.high?.url || 
                            videoDetails.snippet.thumbnails.default?.url;
        
        // Create tweet text
        let tweetText = custom_text || `🎵 Music Recommendation: "${videoDetails.snippet.title}" by ${videoDetails.snippet.channelTitle}`;
        
        // Add video URL and maybe hashtags
        tweetText += `\n\nhttps://youtube.com/watch?v=${video_id}`;
        
        if (!custom_text) {
          // Add some generic hashtags if no custom text
          tweetText += '\n\n#MusicRecommendation #NewMusic';
        }
        
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify({
            tweetText,
            thumbnailUrl,
            videoDetails: {
              title: videoDetails.snippet.title,
              channelTitle: videoDetails.snippet.channelTitle,
              publishedAt: videoDetails.snippet.publishedAt,
              viewCount: videoDetails.statistics.viewCount,
              videoId: video_id,
              videoUrl: `https://youtube.com/watch?v=${video_id}`
            }
          })
        );
      } catch (error: any) {
        console.error('Error posting music recommendation:', error);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Failed to post music recommendation: ${error?.message || 'Unknown error'}`
        );
      }
    }
  });

  return new GameWorker({
    id: "youtube_music_worker",
    name: "YouTube Music Worker",
    description: "Worker that handles YouTube music recommendations and new releases",
    functions: [getMusicRecommendations, getNewMusicReleases, postMusicRecommendation]
  });
}