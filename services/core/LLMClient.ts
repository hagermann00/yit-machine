import { GoogleGenAI } from "@google/genai";

export class LLMClient {
  private static instance: LLMClient;
  private client: GoogleGenAI;

  private constructor() {
    this.client = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

  public async generateContentWithRetry(
    params: any,
    retries = 3,
    delay = 2000
  ): Promise<any> {
    try {
      return await this.client.models.generateContent(params);
    } catch (error: any) {
      const isFatal =
        error.status === 403 || (error.message && error.message.includes("403"));
      
      // Don't retry fatal permissions errors
      if (isFatal) throw error;

      // Retry on rate limits (429) or server errors (5xx)
      if (retries > 0) {
        console.warn(`API call failed, retrying in ${delay}ms...`, error.message);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.generateContentWithRetry(params, retries - 1, delay * 2);
      }
      
      throw error;
    }
  }
}
