import { GameWorker, GameFunction, ExecutableGameFunctionResponse, ExecutableGameFunctionStatus } from "@virtuals-protocol/game";

// Define a type for the genre map
type GenreMap = {
  [key: string]: string[];
};

/**
 * The genres to rotate through for recommendations and new releases
 */
const MUSIC_GENRES = {
  recommendation: [
    "Classical",
    "Rock",
    "Electronic",
    "Hip Hop",
    "World Music",
    "Experimental",
    "Metal",
    "Rock",
    "Techno",
    "Punk",
    "Indie"
  ],
  newReleases: [
    "Classical",
    "Rock",
    "Electronic",
    "Hip Hop",
    "World Music",
    "Experimental",
    "Metal",
    "Rock",
    "Techno",
    "Punk",
    "Indie"

  ]
};

/**
 * Subgenres for each main genre to provide more specific recommendations
 */
const SUBGENRES: GenreMap = {
  "Classical": ["orchestral", "piano", "chamber music", "opera", "symphony", "baroque", "modern classical"],
  "Jazz": ["bebop", "fusion", "smooth jazz", "big band", "swing", "modal jazz", "cool jazz", "jazz fusion"],
  "Rock": ["classic rock", "indie rock", "punk", "hard rock", "prog rock", "alternative", "psychedelic"],
  "Electronic": ["techno", "house", "trance", "ambient", "EDM", "drum and bass", "synthwave", "dubstep"],
  "Hip Hop": ["old school", "trap", "conscious rap", "instrumental", "boom bap", "southern", "west coast"],
  "Folk & Country": ["acoustic", "bluegrass", "americana", "traditional", "folk rock", "singer-songwriter"],
  "R&B and Soul": ["motown", "contemporary R&B", "funk", "neo-soul", "gospel", "soul"],
  "World Music": ["afrobeat", "latin", "reggae", "k-pop", "celtic", "indian classical", "flamenco"],
  "Experimental": ["avant-garde", "noise", "fusion genres", "art rock", "musique concrète"],
  "Metal": ["heavy metal", "death metal", "black metal", "metalcore", "progressive metal", "doom metal"],
  "Pop": ["dance pop", "indie pop", "synth pop", "power pop", "chamber pop", "dream pop"]
};

/**
 * Creates a worker that helps schedule different music genres for recommendations
 * and provides genre rotation functionality
 */
export function createGenreSchedulerWorker() {
  // Last recommended genre index
  let lastRecommendationGenreIndex = -1;
  let lastNewReleaseGenreIndex = -1;
  
  // Function to get the next genre for music recommendations
  const getNextRecommendationGenre = new GameFunction({
    name: "get_next_recommendation_genre",
    description: "Get the next genre to use for music recommendations in the rotation",
    args: [],
    executable: async (_args: {}, logger?: (msg: string) => void) => {
      try {
        if (logger) logger("Getting next genre for music recommendation");
        
        // Increment index and wrap around
        lastRecommendationGenreIndex = (lastRecommendationGenreIndex + 1) % MUSIC_GENRES.recommendation.length;
        
        // Get the genre
        const genre = MUSIC_GENRES.recommendation[lastRecommendationGenreIndex];
        
        // Get some subgenres
        const subgenres = SUBGENRES[genre] || [];
        const randomSubgenres = getRandomElements(subgenres, 3);
        
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify({
            genre,
            subgenres: randomSubgenres,
            recommendationPrompt: generateRecommendationPrompt(genre, randomSubgenres),
            currentIndex: lastRecommendationGenreIndex,
            totalGenres: MUSIC_GENRES.recommendation.length
          })
        );
      } catch (error: any) {
        console.error('Error getting next recommendation genre:', error);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Failed to get next genre: ${error?.message || 'Unknown error'}`
        );
      }
    }
  });
  
  // Function to get the next genre for new releases
  const getNextNewReleaseGenre = new GameFunction({
    name: "get_next_new_release_genre",
    description: "Get the next genre to use for new music release posts in the rotation",
    args: [],
    executable: async (_args: {}, logger?: (msg: string) => void) => {
      try {
        if (logger) logger("Getting next genre for new music releases");
        
        // Increment index and wrap around
        lastNewReleaseGenreIndex = (lastNewReleaseGenreIndex + 1) % MUSIC_GENRES.newReleases.length;
        
        // Get the genre
        const genre = MUSIC_GENRES.newReleases[lastNewReleaseGenreIndex];
        
        // Get some subgenres (if available)
        const subgenres = SUBGENRES[genre] || [];
        const randomSubgenres = getRandomElements(subgenres, 2);
        
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify({
            genre,
            subgenres: randomSubgenres,
            newReleasePrompt: `${genre}${randomSubgenres.length > 0 ? ' ' + randomSubgenres.join(', ') : ''}`,
            currentIndex: lastNewReleaseGenreIndex,
            totalGenres: MUSIC_GENRES.newReleases.length
          })
        );
      } catch (error: any) {
        console.error('Error getting next new release genre:', error);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Failed to get next genre: ${error?.message || 'Unknown error'}`
        );
      }
    }
  });
  
  // Function to get information about a specific genre
  const getGenreInformation = new GameFunction({
    name: "get_genre_information",
    description: "Get information and details about a specific music genre",
    args: [
      { name: "genre", description: "The music genre to get information about" }
    ],
    executable: async (args: { genre?: string }, logger?: (msg: string) => void) => {
      try {
        const { genre } = args;
        
        if (!genre) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "Genre is required"
          );
        }
        
        if (logger) logger(`Getting information about ${genre} genre`);
        
        // Find the genre (case insensitive) in SUBGENRES
        const genreKey = Object.keys(SUBGENRES).find(key => 
          key.toLowerCase() === genre.toLowerCase()
        );
        
        if (!genreKey) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Genre "${genre}" not found in database`
          );
        }
        
        // Get the subgenres
        const subgenres = SUBGENRES[genreKey] || [];
        
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          JSON.stringify({
            genre: genreKey,
            subgenres,
            recommendationPrompt: generateRecommendationPrompt(genreKey, subgenres),
            isPopularGenre: MUSIC_GENRES.recommendation.includes(genreKey) || MUSIC_GENRES.newReleases.includes(genreKey)
          })
        );
      } catch (error: any) {
        console.error('Error getting genre information:', error);
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Failed to get genre information: ${error?.message || 'Unknown error'}`
        );
      }
    }
  });

  return new GameWorker({
    id: "genre_scheduler_worker",
    name: "Genre Scheduler",
    description: "Worker that manages music genre rotation for recommendations and new releases",
    functions: [getNextRecommendationGenre, getNextNewReleaseGenre, getGenreInformation]
  });
}

// Helper function to get random elements from an array
function getRandomElements<T>(array: T[], count: number): T[] {
  if (count >= array.length) return [...array];
  
  const result: T[] = [];
  const copyArray = [...array];
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * copyArray.length);
    result.push(copyArray[randomIndex]);
    copyArray.splice(randomIndex, 1);
  }
  
  return result;
}

// Helper function to generate a recommendation prompt
function generateRecommendationPrompt(genre: string, subgenres: string[]): string {
  if (subgenres.length === 0) return genre;
  
  return `${genre}: ${subgenres.join(', ')}`;
}