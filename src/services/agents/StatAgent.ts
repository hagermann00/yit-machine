import { BaseAgent } from './BaseAgent';
import { LLMClient } from '../core/LLMClient';
import { STAT_AGENT_PROMPT } from '../../constants';

export class StatAgent extends BaseAgent {
    protected name = "Statistician Agent";
    protected systemPrompt = STAT_AGENT_PROMPT;

    protected async execute(topic: string): Promise<string> {
        const llm = LLMClient.getInstance();
        const client = llm.getClient();

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Investigate the topic: "${topic}". Focus on HARD DATA, SUCCESS RATES, and CHURN.`,
            config: {
                systemInstruction: this.systemPrompt,
                tools: [{ googleSearch: {} }],
            }
        });

        return response.text || "No report generated.";
    }
}
