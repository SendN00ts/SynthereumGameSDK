import { GameWorker, GameFunction, ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from "@virtuals-protocol/game";

/**
 * Creates a worker that generates appropriate image prompts for different post types
 */
export function createImagePromptGenerator() {
  // Generate an image prompt for an album anniversary
  const generateAlbumAnniversaryPrompt = new GameFunction({
    name: "generate_album_anniversary_prompt",
    description: "Generate an image prompt for an album anniversary post",
    args: [
      { name: "album_name", description: "Name of the album" },
      { name: "artist_name", description: "Name of the artist" },
      { name: "album_genre", description: "Genre of the album (optional)" },
      { name: "album_year", description: "Year the album was released (optional)" }
    ],
    executable: async (args: { album_name?: string, artist_name?: string, album_genre?: string, album_year?: string }, logger?: (msg: string) => void) => {
      try {
        const { album_name, artist_name, album_genre, album_year } = args;
        
        if (!album_name || !artist_name) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Album name and artist name are required"
          );
        }
        
        if (logger) logger(`Generating album anniversary image prompt for ${album_name} by ${artist_name}`);
        
        // Create a detailed prompt that will generate album-specific imagery
        const basePrompt = `"${album_name}" by ${artist_name} album art, iconic album artwork`;
        const genrePrompt = album_genre ? `, ${album_genre} music` : "";
        const yearPrompt = album_year ? `, ${album_year} music era` : "";
        const stylePrompt = ", high quality illustration, detailed, album cover style, music history";
        
        const fullPrompt = basePrompt + genrePrompt + yearPrompt + stylePrompt;
        
        // Add enhancement suggestions based on genre
        let enhancedPrompt = fullPrompt;
        const genre = album_genre?.toLowerCase() || "";
        
        if (genre.includes("rock")) {
          enhancedPrompt += ", electric guitars, amplifiers, rock band imagery";
        } else if (genre.includes("jazz")) {
          enhancedPrompt += ", jazz instruments, saxophone, trumpet, piano, smoky atmosphere";
        } else if (genre.includes("hip hop") || genre.includes("rap")) {
          enhancedPrompt += ", urban setting, microphone, graffiti art style";
        } else if (genre.includes("electronic")) {
          enhancedPrompt += ", synthesizers, electronic music equipment, futuristic, digital art";
        } else if (genre.includes("classical")) {
          enhancedPrompt += ", orchestral instruments, symphony hall, elegant, refined";
        }
        
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify({
            prompt: enhancedPrompt,
            albumName: album_name,
            artistName: artist_name,
            width: 1440,
            height: 1440
          })
        );
      } catch (error: any) {
        console.error('Error generating album anniversary prompt:', error);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Failed to generate prompt: ${error?.message || 'Unknown error'}`
        );
      }
    }
  });
  
  // Generate an image prompt for a musician's birthday
  const generateMusicianBirthdayPrompt = new GameFunction({
    name: "generate_musician_birthday_prompt",
    description: "Generate an image prompt for a musician's birthday post",
    args: [
      { name: "musician_name", description: "Name of the musician" },
      { name: "musician_genre", description: "Genre or style of the musician (optional)" },
      { name: "instruments", description: "Main instruments played (optional)" }
    ],
    executable: async (args: { musician_name?: string, musician_genre?: string, instruments?: string }, logger?: (msg: string) => void) => {
      try {
        const { musician_name, musician_genre, instruments } = args;
        
        if (!musician_name) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Musician name is required"
          );
        }
        
        if (logger) logger(`Generating musician birthday image prompt for ${musician_name}`);
        
        // Create a detailed prompt that will generate a portrait of the musician
        const basePrompt = `portrait of ${musician_name}`;
        const genrePrompt = musician_genre ? `, ${musician_genre} musician` : ", musician";
        const instrumentPrompt = instruments ? `, playing ${instruments}` : "";
        const stylePrompt = ", professional photography, detailed portrait, artistic lighting, music artist";
        
        const fullPrompt = basePrompt + genrePrompt + instrumentPrompt + stylePrompt;
        
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify({
            prompt: fullPrompt,
            musicianName: musician_name,
            width: 1440,
            height: 1440
          })
        );
      } catch (error: any) {
        console.error('Error generating musician birthday prompt:', error);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Failed to generate prompt: ${error?.message || 'Unknown error'}`
        );
      }
    }
  });
  
  // Generate an image prompt for a music recommendation
  const generateMusicRecommendationPrompt = new GameFunction({
    name: "generate_music_recommendation_prompt",
    description: "Generate an image prompt for a music recommendation post",
    args: [
      { name: "song_name", description: "Name of the song being recommended" },
      { name: "artist_name", description: "Name of the artist" },
      { name: "genre", description: "Genre of the music" },
      { name: "mood", description: "Mood of the song (optional)" }
    ],
    executable: async (args: { song_name?: string, artist_name?: string, genre?: string, mood?: string }, logger?: (msg: string) => void) => {
      try {
        const { song_name, artist_name, genre, mood } = args;
        
        if (!genre) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Genre is required"
          );
        }
        
        if (logger) logger(`Generating music recommendation image prompt for ${genre} music`);
        
        // Create a detailed prompt based on the genre
        let genreImagery = "";
        const genreLower = genre.toLowerCase();
        
        if (genreLower.includes("rock")) {
          genreImagery = "electric guitars, rock concert, amplifiers, stage lights";
        } else if (genreLower.includes("jazz")) {
          genreImagery = "jazz club, saxophone, trumpet, piano, smoky atmosphere, blue lighting";
        } else if (genreLower.includes("hip hop") || genreLower.includes("rap")) {
          genreImagery = "urban setting, microphone, headphones, graffiti, street culture";
        } else if (genreLower.includes("electronic")) {
          genreImagery = "synthesizers, digital waveforms, DJ equipment, club atmosphere, neon lights";
        } else if (genreLower.includes("classical")) {
          genreImagery = "concert hall, orchestra, string instruments, elegant atmosphere";
        } else if (genreLower.includes("folk")) {
          genreImagery = "acoustic guitar, natural setting, rustic environment, warm lighting";
        } else if (genreLower.includes("country")) {
          genreImagery = "country landscape, acoustic guitar, rural setting, western elements";
        } else if (genreLower.includes("r&b") || genreLower.includes("soul")) {
          genreImagery = "soulful atmosphere, microphone, warm lighting, expressive setting";
        } else {
          genreImagery = "music studio, instruments, headphones, musical notes, artistic setting";
        }
        
        // Add mood elements if provided
        let moodElements = "";
        if (mood) {
          const moodLower = mood.toLowerCase();
          if (moodLower.includes("happy") || moodLower.includes("upbeat")) {
            moodElements = ", bright colors, uplifting atmosphere, vibrant";
          } else if (moodLower.includes("sad") || moodLower.includes("melancholy")) {
            moodElements = ", blue tones, rain, moody atmosphere, emotional";
          } else if (moodLower.includes("energetic")) {
            moodElements = ", dynamic composition, movement, bright lighting, energy";
          } else if (moodLower.includes("calm") || moodLower.includes("relaxing")) {
            moodElements = ", serene setting, peaceful atmosphere, gentle lighting";
          }
        }
        
        // Combine the elements
        const songArtistPart = (song_name && artist_name) ? `${song_name} by ${artist_name}, ` : "";
        const genrePart = `${genre} music, `;
        const imageryPart = genreImagery;
        const moodPart = moodElements;
        const stylePart = ", artistic composition, high quality illustration, music themed";
        
        const fullPrompt = songArtistPart + genrePart + imageryPart + moodPart + stylePart;
        
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify({
            prompt: fullPrompt,
            genre,
            width: 1440,
            height: 1440
          })
        );
      } catch (error: any) {
        console.error('Error generating music recommendation prompt:', error);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Failed to generate prompt: ${error?.message || 'Unknown error'}`
        );
      }
    }
  });
  
  // Generate an image prompt for a new music release
  const generateNewReleasePrompt = new GameFunction({
    name: "generate_new_release_prompt",
    description: "Generate an image prompt for a new music release post",
    args: [
      { name: "release_name", description: "Name of the release (album/song)" },
      { name: "artist_name", description: "Name of the artist" },
      { name: "genre", description: "Genre of the music" }
    ],
    executable: async (args: { release_name?: string, artist_name?: string, genre?: string }, logger?: (msg: string) => void) => {
      try {
        const { release_name, artist_name, genre } = args;
        
        if (!genre) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Genre is required"
          );
        }
        
        if (logger) logger(`Generating new release image prompt for ${genre} music`);
        
        // Create a detailed prompt
        const releasePart = (release_name && artist_name) 
          ? `new release "${release_name}" by ${artist_name}, ` 
          : "new music release, ";
        
        const genrePart = `${genre} music, `;
        
        // Customize imagery based on genre
        let genreImagery = "";
        const genreLower = genre.toLowerCase();
        
        if (genreLower.includes("rock")) {
          genreImagery = "fresh album artwork, electric guitars, modern rock aesthetic";
        } else if (genreLower.includes("jazz")) {
          genreImagery = "new jazz release, saxophone, trumpet, piano, contemporary jazz visuals";
        } else if (genreLower.includes("hip hop") || genreLower.includes("rap")) {
          genreImagery = "new hip hop album, urban setting, modern rap aesthetics, contemporary";
        } else if (genreLower.includes("electronic")) {
          genreImagery = "new electronic music, futuristic design, digital artwork, cutting edge";
        } else if (genreLower.includes("classical")) {
          genreImagery = "new classical composition, elegant design, sophisticated imagery";
        } else {
          genreImagery = "new album artwork, contemporary design, current music trends";
        }
        
        const stylePart = ", fresh release, high quality illustration, professional album artwork, new music";
        
        const fullPrompt = releasePart + genrePart + genreImagery + stylePart;
        
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify({
            prompt: fullPrompt,
            genre,
            width: 1440,
            height: 1440
          })
        );
      } catch (error: any) {
        console.error('Error generating new release prompt:', error);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Failed to generate prompt: ${error?.message || 'Unknown error'}`
        );
      }
    }
  });

  return new GameWorker({
    id: "image_prompt_generator",
    name: "Image Prompt Generator",
    description: "Worker that generates specialized image prompts for different music-related posts",
    functions: [
      generateAlbumAnniversaryPrompt,
      generateMusicianBirthdayPrompt,
      generateMusicRecommendationPrompt,
      generateNewReleasePrompt
    ]
  });
}