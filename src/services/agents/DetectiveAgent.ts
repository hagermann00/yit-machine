import { BaseAgent } from './BaseAgent';
import { LLMClient } from '../core/LLMClient';
import { DETECTIVE_AGENT_PROMPT } from '../../constants';

export class DetectiveAgent extends BaseAgent {
    protected name = "Detective Agent";
    protected systemPrompt = DETECTIVE_AGENT_PROMPT;

    protected async execute(topic: string): Promise<string> {
        const llm = LLMClient.getInstance();
        const client = llm.getClient();

        // The detective uses Google Search Tool
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Investigate the topic: "${topic}". Find facts, figures, and user stories. Focus on VICTIMS and SCAMS.`,
            config: {
                systemInstruction: this.systemPrompt,
                tools: [{ googleSearch: {} }],
            }
        });

        return response.text || "No report generated.";
    }
}
