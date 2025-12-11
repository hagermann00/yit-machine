
export interface AgentResult {
    success: boolean;
    data: string | null;
    error?: string;
    agentName: string;
}

export abstract class BaseAgent {
    protected abstract name: string;
    protected abstract systemPrompt: string;

    // Optional: Agents can have specific tools or model configs

    async run(topic: string): Promise<AgentResult> {
        console.log(`[${this.name}] Starting investigation on: ${topic}`);
        try {
            const data = await this.execute(topic);
            console.log(`[${this.name}] Investigation complete.`);
            return {
                success: true,
                data: data,
                agentName: this.name
            };
        } catch (error: any) {
            console.error(`[${this.name}] Failed:`, error);
            return {
                success: false,
                data: null,
                error: error.message || "Unknown Agent Error",
                agentName: this.name
            };
        }
    }

    protected abstract execute(topic: string): Promise<string>;
}
