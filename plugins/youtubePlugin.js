"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createYouTubePlugin = createYouTubePlugin;
var game_1 = require("@virtuals-protocol/game");
var axios_1 = require("axios");
// YouTube API client helper
var YouTubeAPI = /** @class */ (function () {
    function YouTubeAPI(apiKey) {
        this.apiKey = apiKey;
    }
    // Search for music videos with specific parameters
    YouTubeAPI.prototype.searchMusicVideos = function (query_1) {
        return __awaiter(this, arguments, void 0, function (query, maxResults) {
            var response, error_1;
            if (maxResults === void 0) { maxResults = 5; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.get('https://www.googleapis.com/youtube/v3/search', {
                                params: {
                                    part: 'snippet',
                                    q: query,
                                    maxResults: maxResults,
                                    type: 'video',
                                    videoCategoryId: '10', // Music category
                                    key: this.apiKey
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data.items];
                    case 2:
                        error_1 = _a.sent();
                        console.error('YouTube API search error:', error_1.message);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get popular music videos (can be used for new releases)
    YouTubeAPI.prototype.getPopularMusicVideos = function () {
        return __awaiter(this, arguments, void 0, function (maxResults, regionCode) {
            var response, error_2;
            if (maxResults === void 0) { maxResults = 5; }
            if (regionCode === void 0) { regionCode = 'US'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.get('https://www.googleapis.com/youtube/v3/videos', {
                                params: {
                                    part: 'snippet,statistics',
                                    chart: 'mostPopular',
                                    videoCategoryId: '10', // Music category
                                    maxResults: maxResults,
                                    regionCode: regionCode,
                                    key: this.apiKey
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data.items];
                    case 2:
                        error_2 = _a.sent();
                        console.error('YouTube API popular videos error:', error_2.message);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get video details with additional information (helpful for recommendations)
    YouTubeAPI.prototype.getVideoDetails = function (videoId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.get('https://www.googleapis.com/youtube/v3/videos', {
                                params: {
                                    part: 'snippet,statistics,contentDetails',
                                    id: videoId,
                                    key: this.apiKey
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data.items[0]];
                    case 2:
                        error_3 = _a.sent();
                        console.error('YouTube API video details error:', error_3.message);
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return YouTubeAPI;
}());
function createYouTubePlugin(apiKey) {
    var _this = this;
    // Initialize YouTube API client
    var youtubeClient = new YouTubeAPI(apiKey);
    // Function to get music recommendations
    var getMusicRecommendations = new game_1.GameFunction({
        name: "get_music_recommendations",
        description: "Search for music recommendations based on a genre, artist, or theme",
        args: [
            { name: "query", description: "The music genre, artist, or theme to search for" },
            { name: "max_results", description: "Maximum number of results to return (default: 5)" }
        ],
        executable: function (args, logger) { return __awaiter(_this, void 0, void 0, function () {
            var query, _a, max_results, videos, formattedResults, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        query = args.query, _a = args.max_results, max_results = _a === void 0 ? 5 : _a;
                        if (!query) {
                            return [2 /*return*/, new game_1.ExecutableGameFunctionResponse(game_1.ExecutableGameFunctionStatus.Failed, "A search query is required")];
                        }
                        if (logger)
                            logger("Searching for music recommendations: ".concat(query));
                        return [4 /*yield*/, youtubeClient.searchMusicVideos(query, max_results)];
                    case 1:
                        videos = _b.sent();
                        if (!videos || videos.length === 0) {
                            return [2 /*return*/, new game_1.ExecutableGameFunctionResponse(game_1.ExecutableGameFunctionStatus.Done, "No music recommendations found for this query")];
                        }
                        formattedResults = videos.map(function (video) {
                            var _a, _b;
                            return ({
                                title: video.snippet.title,
                                channelTitle: video.snippet.channelTitle,
                                description: video.snippet.description,
                                publishedAt: video.snippet.publishedAt,
                                thumbnailUrl: ((_a = video.snippet.thumbnails.high) === null || _a === void 0 ? void 0 : _a.url) || ((_b = video.snippet.thumbnails.default) === null || _b === void 0 ? void 0 : _b.url),
                                videoId: video.id.videoId,
                                videoUrl: "https://youtube.com/watch?v=".concat(video.id.videoId)
                            });
                        });
                        return [2 /*return*/, new game_1.ExecutableGameFunctionResponse(game_1.ExecutableGameFunctionStatus.Done, JSON.stringify(formattedResults))];
                    case 2:
                        error_4 = _b.sent();
                        console.error('Error getting music recommendations:', error_4);
                        return [2 /*return*/, new game_1.ExecutableGameFunctionResponse(game_1.ExecutableGameFunctionStatus.Failed, "Failed to get music recommendations: ".concat((error_4 === null || error_4 === void 0 ? void 0 : error_4.message) || 'Unknown error'))];
                    case 3: return [2 /*return*/];
                }
            });
        }); }
    });
    // Function to get new music releases
    var getNewMusicReleases = new game_1.GameFunction({
        name: "get_new_music_releases",
        description: "Get popular new music releases from YouTube",
        args: [
            { name: "max_results", description: "Maximum number of results to return (default: 5)" },
            { name: "region_code", description: "Region code for localized results (default: US)" }
        ],
        executable: function (args, logger) { return __awaiter(_this, void 0, void 0, function () {
            var _a, max_results, _b, region_code, videos, thirtyDaysAgo_1, formattedResults, error_5;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        _a = args.max_results, max_results = _a === void 0 ? 5 : _a, _b = args.region_code, region_code = _b === void 0 ? 'US' : _b;
                        if (logger)
                            logger("Getting new music releases for region: ".concat(region_code));
                        return [4 /*yield*/, youtubeClient.getPopularMusicVideos(max_results, region_code)];
                    case 1:
                        videos = _c.sent();
                        if (!videos || videos.length === 0) {
                            return [2 /*return*/, new game_1.ExecutableGameFunctionResponse(game_1.ExecutableGameFunctionStatus.Done, "No popular music releases found")];
                        }
                        thirtyDaysAgo_1 = new Date();
                        thirtyDaysAgo_1.setDate(thirtyDaysAgo_1.getDate() - 30);
                        formattedResults = videos
                            .filter(function (video) {
                            var publishedDate = new Date(video.snippet.publishedAt);
                            return publishedDate >= thirtyDaysAgo_1;
                        })
                            .map(function (video) {
                            var _a, _b;
                            return ({
                                title: video.snippet.title,
                                channelTitle: video.snippet.channelTitle,
                                description: video.snippet.description,
                                publishedAt: video.snippet.publishedAt,
                                viewCount: video.statistics.viewCount,
                                likeCount: video.statistics.likeCount,
                                thumbnailUrl: ((_a = video.snippet.thumbnails.high) === null || _a === void 0 ? void 0 : _a.url) || ((_b = video.snippet.thumbnails.default) === null || _b === void 0 ? void 0 : _b.url),
                                videoId: video.id,
                                videoUrl: "https://youtube.com/watch?v=".concat(video.id)
                            });
                        });
                        return [2 /*return*/, new game_1.ExecutableGameFunctionResponse(game_1.ExecutableGameFunctionStatus.Done, JSON.stringify(formattedResults.length > 0 ? formattedResults : videos.map(function (video) {
                                var _a, _b;
                                return ({
                                    title: video.snippet.title,
                                    channelTitle: video.snippet.channelTitle,
                                    description: video.snippet.description,
                                    publishedAt: video.snippet.publishedAt,
                                    viewCount: video.statistics.viewCount,
                                    likeCount: video.statistics.likeCount,
                                    thumbnailUrl: ((_a = video.snippet.thumbnails.high) === null || _a === void 0 ? void 0 : _a.url) || ((_b = video.snippet.thumbnails.default) === null || _b === void 0 ? void 0 : _b.url),
                                    videoId: video.id,
                                    videoUrl: "https://youtube.com/watch?v=".concat(video.id)
                                });
                            })))];
                    case 2:
                        error_5 = _c.sent();
                        console.error('Error getting new music releases:', error_5);
                        return [2 /*return*/, new game_1.ExecutableGameFunctionResponse(game_1.ExecutableGameFunctionStatus.Failed, "Failed to get new music releases: ".concat((error_5 === null || error_5 === void 0 ? void 0 : error_5.message) || 'Unknown error'))];
                    case 3: return [2 /*return*/];
                }
            });
        }); }
    });
    // Function to post a music recommendation with image
    var postMusicRecommendation = new game_1.GameFunction({
        name: "post_music_recommendation",
        description: "Post a music recommendation tweet with YouTube thumbnail image",
        args: [
            { name: "video_id", description: "YouTube video ID to recommend" },
            { name: "custom_text", description: "Custom recommendation text (optional)" }
        ],
        executable: function (args, logger) { return __awaiter(_this, void 0, void 0, function () {
            var video_id, custom_text, videoDetails, thumbnailUrl, tweetText, error_6;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        video_id = args.video_id, custom_text = args.custom_text;
                        if (!video_id) {
                            return [2 /*return*/, new game_1.ExecutableGameFunctionResponse(game_1.ExecutableGameFunctionStatus.Failed, "YouTube video ID is required")];
                        }
                        if (logger)
                            logger("Getting video details for recommendation: ".concat(video_id));
                        return [4 /*yield*/, youtubeClient.getVideoDetails(video_id)];
                    case 1:
                        videoDetails = _d.sent();
                        if (!videoDetails) {
                            return [2 /*return*/, new game_1.ExecutableGameFunctionResponse(game_1.ExecutableGameFunctionStatus.Failed, "Could not retrieve video details")];
                        }
                        thumbnailUrl = ((_a = videoDetails.snippet.thumbnails.maxres) === null || _a === void 0 ? void 0 : _a.url) ||
                            ((_b = videoDetails.snippet.thumbnails.high) === null || _b === void 0 ? void 0 : _b.url) ||
                            ((_c = videoDetails.snippet.thumbnails.default) === null || _c === void 0 ? void 0 : _c.url);
                        tweetText = custom_text || "\uD83C\uDFB5 Music Recommendation: \"".concat(videoDetails.snippet.title, "\" by ").concat(videoDetails.snippet.channelTitle);
                        // Add video URL and maybe hashtags
                        tweetText += "\n\nhttps://youtube.com/watch?v=".concat(video_id);
                        if (!custom_text) {
                            // Add some generic hashtags if no custom text
                            tweetText += '\n\n#MusicRecommendation #NewMusic';
                        }
                        // This is a placeholder - in real implementation, we'd integrate with your existing
                        // image upload and tweet function (further integration needed in agent.ts)
                        return [2 /*return*/, new game_1.ExecutableGameFunctionResponse(game_1.ExecutableGameFunctionStatus.Done, JSON.stringify({
                                tweetText: tweetText,
                                thumbnailUrl: thumbnailUrl,
                                videoDetails: {
                                    title: videoDetails.snippet.title,
                                    channelTitle: videoDetails.snippet.channelTitle,
                                    publishedAt: videoDetails.snippet.publishedAt,
                                    viewCount: videoDetails.statistics.viewCount,
                                    videoId: video_id,
                                    videoUrl: "https://youtube.com/watch?v=".concat(video_id)
                                }
                            }))];
                    case 2:
                        error_6 = _d.sent();
                        console.error('Error posting music recommendation:', error_6);
                        return [2 /*return*/, new game_1.ExecutableGameFunctionResponse(game_1.ExecutableGameFunctionStatus.Failed, "Failed to post music recommendation: ".concat((error_6 === null || error_6 === void 0 ? void 0 : error_6.message) || 'Unknown error'))];
                    case 3: return [2 /*return*/];
                }
            });
        }); }
    });
    return new game_1.GameWorker({
        id: "youtube_music_worker",
        name: "YouTube Music Worker",
        description: "Worker that handles YouTube music recommendations and new releases",
        functions: [getMusicRecommendations, getNewMusicReleases, postMusicRecommendation]
    });
}
