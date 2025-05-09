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
exports.createTwitterMediaWorker = createTwitterMediaWorker;
var game_1 = require("@virtuals-protocol/game");
var axios_1 = require("axios");
var fs = require("fs");
var path = require("path");
var twitter_api_v2_1 = require("twitter-api-v2");
function createTwitterMediaWorker(apiKey, apiSecret, accessToken, accessSecret) {
    var _this = this;
    var twitterClient = new twitter_api_v2_1.TwitterApi({
        appKey: apiKey,
        appSecret: apiSecret,
        accessToken: accessToken,
        accessSecret: accessSecret,
    });
    // Create tmp directory for temporary files
    var tmpDir = path.resolve(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }
    var uploadImageAndTweet = new game_1.GameFunction({
        name: "upload_image_and_tweet",
        description: "Upload an image URL and post a tweet with the image properly attached",
        args: [
            { name: "text", description: "The tweet text content" },
            { name: "image_url", description: "The URL of the image to upload" },
        ],
        executable: function (args, logger) { return __awaiter(_this, void 0, void 0, function () {
            var text, image_url, mediaBuffer, retryCount, maxRetries, imageResponse, downloadError_1, mediaId, tweet, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 13, , 14]);
                        text = args.text, image_url = args.image_url;
                        // Added logging at beginning
                        console.log("⚠️ TWEET ATTEMPT ⚠️");
                        console.log("Text:", text);
                        console.log("Image URL (first 50 chars):", image_url ? image_url.substring(0, 50) + "..." : "undefined");
                        if (!text || !image_url) {
                            return [2 /*return*/, new game_1.ExecutableGameFunctionResponse(game_1.ExecutableGameFunctionStatus.Failed, "Tweet text and image URL are required")];
                        }
                        if (image_url.includes("[TRUNCATED]")) {
                            return [2 /*return*/, new game_1.ExecutableGameFunctionResponse(game_1.ExecutableGameFunctionStatus.Failed, "Image URL appears truncated — please provide a valid URL from image generation step.")];
                        }
                        if (image_url.endsWith("...") || image_url.includes("/...") || image_url.includes("***")) {
                            return [2 /*return*/, new game_1.ExecutableGameFunctionResponse(game_1.ExecutableGameFunctionStatus.Failed, "Image URL appears truncated with '...' or '***' — ensure full URL is properly passed")];
                        }
                        if (!image_url.startsWith("https://api.together.ai/imgproxy/")) {
                            return [2 /*return*/, new game_1.ExecutableGameFunctionResponse(game_1.ExecutableGameFunctionStatus.Failed, "Image URL format appears invalid — ensure it is the full URL returned by the image generation plugin.")];
                        }
                        console.log("📸 Full image URL used:", image_url);
                        // Download with retry logic
                        if (logger)
                            logger("Downloading image from ".concat(image_url));
                        console.log("📥 Attempting image download...");
                        mediaBuffer = void 0;
                        retryCount = 0;
                        maxRetries = 3;
                        _a.label = 1;
                    case 1:
                        if (!(retryCount < maxRetries)) return [3 /*break*/, 10];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, , 9]);
                        return [4 /*yield*/, axios_1.default.get(image_url, {
                                responseType: 'arraybuffer',
                                timeout: 15000,
                                maxRedirects: 5,
                                headers: {
                                    'Accept': 'image/jpeg,image/*',
                                    'User-Agent': 'TwitterBot/1.0'
                                }
                            })];
                    case 3:
                        imageResponse = _a.sent();
                        mediaBuffer = Buffer.from(imageResponse.data);
                        console.log("✅ Image downloaded successfully, size:", mediaBuffer.length);
                        if (logger)
                            logger("Created media buffer of size: ".concat(mediaBuffer.length));
                        if (!(!mediaBuffer || mediaBuffer.length < 1024)) return [3 /*break*/, 6];
                        if (!(retryCount >= maxRetries - 1)) return [3 /*break*/, 4];
                        throw new Error("Downloaded image too small (".concat((mediaBuffer === null || mediaBuffer === void 0 ? void 0 : mediaBuffer.length) || 0, " bytes) - possible download failure."));
                    case 4:
                        retryCount++;
                        console.log("\uD83D\uDD04 Retry ".concat(retryCount, "/").concat(maxRetries, ": Image too small"));
                        if (logger)
                            logger("Retry ".concat(retryCount, "/").concat(maxRetries, ": Image too small"));
                        return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 1000); })];
                    case 5:
                        _a.sent(); // Wait 1s between retries
                        return [3 /*break*/, 1];
                    case 6: return [3 /*break*/, 10]; // Success - exit retry loop
                    case 7:
                        downloadError_1 = _a.sent();
                        console.error("❌ Image download error:", downloadError_1.message);
                        if (retryCount >= maxRetries - 1) {
                            throw downloadError_1;
                        }
                        retryCount++;
                        console.log("\uD83D\uDD04 Retry ".concat(retryCount, "/").concat(maxRetries, " after error"));
                        if (logger)
                            logger("Retry ".concat(retryCount, "/").concat(maxRetries, " after error: ").concat(downloadError_1.message));
                        return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 1000); })];
                    case 8:
                        _a.sent(); // Wait 1s between retries
                        return [3 /*break*/, 9];
                    case 9: return [3 /*break*/, 1];
                    case 10:
                        // Upload to Twitter
                        console.log("📤 Uploading image to Twitter...");
                        if (logger)
                            logger("Uploading image to Twitter");
                        return [4 /*yield*/, twitterClient.v1.uploadMedia(mediaBuffer, { mimeType: 'image/jpeg' })];
                    case 11:
                        mediaId = _a.sent();
                        console.log("✅ Image uploaded to Twitter, media ID:", mediaId);
                        // Post tweet with media
                        console.log("📝 Posting tweet with media...");
                        if (logger)
                            logger('Posting tweet with attached media');
                        return [4 /*yield*/, twitterClient.v2.tweet(text, {
                                media: { media_ids: [mediaId] }
                            })];
                    case 12:
                        tweet = _a.sent();
                        console.log("🎉 SUCCESS: Tweet posted with ID:", tweet.data.id);
                        if (logger)
                            logger("Successfully posted tweet: ".concat(tweet.data.id));
                        return [2 /*return*/, new game_1.ExecutableGameFunctionResponse(game_1.ExecutableGameFunctionStatus.Done, "Tweet posted successfully with media: ".concat(tweet.data.id))];
                    case 13:
                        error_1 = _a.sent();
                        console.error('❌ DETAILED ERROR:', JSON.stringify(error_1, null, 2));
                        console.error('Error posting tweet with media:', error_1);
                        return [2 /*return*/, new game_1.ExecutableGameFunctionResponse(game_1.ExecutableGameFunctionStatus.Failed, "Failed to post tweet with media: ".concat((error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Unknown error'))];
                    case 14: return [2 /*return*/];
                }
            });
        }); }
    });
    return new game_1.GameWorker({
        id: "twitter_media_worker",
        name: "Twitter Media Worker",
        description: "Worker that handles Twitter media uploads and posting",
        functions: [uploadImageAndTweet]
    });
}
