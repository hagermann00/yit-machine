import { BaseAgent } from './BaseAgent';
import { LLMClient } from '../core/LLMClient';
import { AUDITOR_AGENT_PROMPT } from '../../constants';

export class AuditorAgent extends BaseAgent {
    protected name = "Auditor Agent";
    protected systemPrompt = AUDITOR_AGENT_PROMPT;

    protected async execute(topic: string): Promise<string> {
        const llm = LLMClient.getInstance();
        const client = llm.getClient();

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Investigate the topic: "${topic}". Focus on HIDDEN COSTS, FEES, and REFUNDS.`,
            config: {
                systemInstruction: this.systemPrompt,
                tools: [{ googleSearch: {} }],
            }
        });

        return response.text || "No report generated.";
    }
}
