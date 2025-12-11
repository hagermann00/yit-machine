import { GoogleGenAI, Type, Schema, GenerateContentConfig } from "@google/genai";
import { z } from "zod";

const DEFAULT_MODEL = 'gemini-2.5-flash';

interface RetryConfig {
    retries: number;
    initialDelay: number;
    backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    retries: 3,
    initialDelay: 2000,
    backoffFactor: 2
};

export class LLMClient {
    private client: GoogleGenAI;
    private static instance: LLMClient;

    private constructor() {
        // Safe access to API Key for both Vite (Client) and Node (Test/Polyfilled) environments
        const apiKey = import.meta.env?.VITE_API_KEY ||
                       process.env.API_KEY ||
                       process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("Missing API Key for GoogleGenAI. Ensure VITE_API_KEY or GEMINI_API_KEY is set.");
        }
        this.client = new GoogleGenAI({ apiKey });
    }

    public static getInstance(): LLMClient {
        if (!LLMClient.instance) {
            LLMClient.instance = new LLMClient();
        }
        return LLMClient.instance;
    }

    private async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async executeWithRetry<T>(operation: () => Promise<T>, config: RetryConfig = DEFAULT_RETRY_CONFIG): Promise<T> {
        let lastError: any;
        let delay = config.initialDelay;

        for (let attempt = 1; attempt <= config.retries + 1; attempt++) {
            try {
                return await operation();
            } catch (error: any) {
                lastError = error;
                const status = error.status || (error.response ? error.response.status : null);
                const message = error.message || "";

                // Fatal errors - do not retry
                if (status === 400 || status === 401 || status === 403) {
                     console.error(`Fatal LLM Error (Status ${status}):`, message);
                    throw error;
                }

                // Retryable errors: 429 (Rate Limit), 500+ (Server Errors), or network issues
                const isRetryable = status === 429 || status >= 500 || message.includes("fetch failed");

                if (isRetryable && attempt <= config.retries) {
                    console.warn(`LLM Attempt ${attempt} failed (Status ${status}). Retrying in ${delay}ms...`);
                    await this.sleep(delay);
                    delay *= config.backoffFactor;
                    continue;
                }

                throw error;
            }
        }
        throw lastError;
    }

    public async generateText(prompt: string, systemPrompt?: string, model: string = DEFAULT_MODEL): Promise<string> {
        return this.executeWithRetry(async () => {
            const config: GenerateContentConfig = {
                systemInstruction: systemPrompt,
            };

            const response = await this.client.models.generateContent({
                model,
                contents: prompt,
                config
            });

            return response.text || "";
        });
    }

    public async generateStructured<T>(
        prompt: string,
        schema: z.ZodSchema<T>,
        geminiSchema: Schema,
        systemPrompt?: string,
        model: string = DEFAULT_MODEL
    ): Promise<T> {
        return this.executeWithRetry(async () => {
             const config: GenerateContentConfig = {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: geminiSchema
            };

            const response = await this.client.models.generateContent({
                model,
                contents: prompt,
                config
            });

            const text = response.text;
            if (!text) throw new Error("Empty response from LLM");

            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            try {
                const json = JSON.parse(cleanText);
                return schema.parse(json);
            } catch (parseError) {
                console.error("JSON Parse/Validation Error:", parseError);
                console.error("Raw Text:", cleanText);
                throw new Error("Failed to parse or validate LLM response");
            }
        });
    }

    public getClient() {
        return this.client;
    }
}
