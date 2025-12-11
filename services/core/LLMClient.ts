import { GoogleGenAI, GenerativeModel } from "@google/genai";

export class LLMClient {
  private static instance: LLMClient;
  private client: GoogleGenAI;
  private apiKey: string;

  private constructor() {
    // Vite-compatible env var access with fallback
    // @ts-ignore
    this.apiKey = import.meta.env.VITE_API_KEY || process.env.GEMINI_API_KEY || "";

    if (!this.apiKey) {
      console.error("VITE_API_KEY is missing. LLM calls will fail.");
    }

    this.client = new GoogleGenAI({ apiKey: this.apiKey });
  }

  public static getInstance(): LLMClient {
    if (!LLMClient.instance) {
      LLMClient.instance = new LLMClient();
    }
    return LLMClient.instance;
  }

  public getClient(): GoogleGenAI {
    return this.client;
  }

  /**
   * Generates content with retry logic for rate limits and timeout support.
   * @param params - The parameters for generateContent (model, config, contents)
   * @param retries - Number of retries for transient errors (default: 3)
   * @param delay - Initial delay in ms for retries (default: 2000)
   * @param timeoutMs - Timeout for the request in ms (default: 30000)
   */
  public async generateContentWithRetry(
    params: { model: string; contents: any; config?: any },
    retries = 3,
    delay = 2000,
    timeoutMs = 30000
  ): Promise<any> {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
          const id = setTimeout(() => {
              clearTimeout(id);
              reject(new Error(`Request timed out after ${timeoutMs}ms`));
          }, timeoutMs);
      });

      // Race the API call against the timeout
      const apiCall = this.client.models.generateContent(params);

      const response = await Promise.race([apiCall, timeoutPromise]);
      return response;

    } catch (error: any) {
      const status = error.status || error.response?.status;
      const message = error.message || "";

      // Fatal errors: Permissions (403), Invalid Argument (400) - except when strictly rate limited
      const isFatal = status === 403 || (status === 400 && !message.includes("429"));
      
      if (isFatal) throw error;

      // Retry conditions: 429 (Rate Limit), 500+ (Server Errors), or Timeouts
      const isRetryable = status === 429 || status >= 500 || message.includes("timeout") || message.includes("Overloaded");

      if (retries > 0 && isRetryable) {
        // Exponential backoff
        const nextDelay = delay * 2;
        console.warn(`LLM Error (${status || 'Network'}). Retrying in ${delay}ms...`, message);

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.generateContentWithRetry(params, retries - 1, nextDelay, timeoutMs);
      }
      
      throw error;
    }
  }
}
