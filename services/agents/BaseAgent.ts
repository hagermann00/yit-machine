import { LLMClient } from "../core/LLMClient";

export abstract class BaseAgent {
  protected llm: LLMClient;
  protected name: string;

  constructor(name: string) {
    this.name = name;
    this.llm = LLMClient.getInstance();
  }

  abstract run(topic: string): Promise<string>;

  protected async executeSearch(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await this.llm.generateContentWithRetry({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {} }],
      }
    });
    return response.text || `[${this.name}] No data found.`;
  }
}
