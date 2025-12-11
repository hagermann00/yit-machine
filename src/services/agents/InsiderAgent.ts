import { BaseAgent } from './BaseAgent';
import { LLMClient } from '../core/LLMClient';
import { INSIDER_AGENT_PROMPT } from '../../constants';

export class InsiderAgent extends BaseAgent {
    protected name = "Insider Agent";
    protected systemPrompt = INSIDER_AGENT_PROMPT;

    protected async execute(topic: string): Promise<string> {
        const llm = LLMClient.getInstance();
        const client = llm.getClient();

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Investigate the topic: "${topic}". Focus on AFFILIATES, GURUS, and COMMISSION STRUCTURES.`,
            config: {
                systemInstruction: this.systemPrompt,
                tools: [{ googleSearch: {} }],
            }
        });

        return response.text || "No report generated.";
    }
}
