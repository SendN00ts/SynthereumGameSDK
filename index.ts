// src/index.ts
import { synthereum_agent } from './agent';

// Flag to track if a function has been called this cycle
let functionCalledThisCycle = false;

// Improved retry function with exponential backoff
async function runAgentWithRetry(retryCount = 0) {
  try {
    // Reset function tracking
    functionCalledThisCycle = false;
    
    // Run a single step
    console.log(`Running agent step at ${new Date().toISOString()}`);
    await synthereum_agent.step({ verbose: true });
    
    // Success! Schedule the next step after 1 hour
    console.log("Step completed successfully. Waiting 1 hour until next step...");
    setTimeout(() => runAgentWithRetry(0), 60 * 60 * 1000); // Reset retry count on success
    
  } catch (error) {
    console.error(`Error running agent step:`, error);
    
    // Calculate exponential backoff with jitter
    const baseDelay = Math.min(
      (Math.pow(2, retryCount) * 60 * 1000), // Exponential growth
      30 * 60 * 1000 // Cap at 30 minutes
    );
    const jitter = Math.random() * 30 * 1000; // Add up to 30 seconds of randomness
    const retryDelay = baseDelay + jitter;
    
    console.log(`Retry attempt ${retryCount+1}, waiting ${Math.round(retryDelay/1000)} seconds...`);
    
    // Schedule retry with incremented count
    setTimeout(() => runAgentWithRetry(retryCount + 1), retryDelay);
  }
}

async function main() {
  try {
    console.log("Initializing Twitter Bot...");
    
    // Sanitize description to prevent Unicode errors
    const sanitizedDescription = synthereum_agent.description.replace(/[\uD800-\uDFFF](?![\uD800-\uDFFF])|(?:[^\uD800-\uDFFF]|^)[\uDC00-\uDFFF]/g, '');
    synthereum_agent.description = sanitizedDescription;
    
    await synthereum_agent.init();
    console.log("Twitter Bot initialized successfully!");
    
    console.log("Available functions:", synthereum_agent.workers.flatMap((w: any) =>
      w.functions.map((f: any) => f.name)
    ));
    
    // Start with retry logic
    runAgentWithRetry();
    
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    process.exit(1);
  }
}

main();