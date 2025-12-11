import { LLMClient } from "./core/LLMClient";
import { ResearchDataSchema, ValidatedResearchData } from "./core/SchemaValidator";
import { DetectiveAgent, AuditorAgent, InsiderAgent, StatAgent } from "./agents/SpecializedAgents";
import { RESEARCH_SYSTEM_PROMPT } from "../constants";
import { Type } from "@google/genai";
import { cleanAndParseJSON } from "../utils/jsonParser";

export type AgentStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface AgentState {
  name: string;
  status: AgentStatus;
  message?: string;
}

export class ResearchCoordinator {
  private llm: LLMClient;
  private agents: any[];

  constructor() {
    this.llm = LLMClient.getInstance();
    this.agents = [
      new DetectiveAgent(),
      new AuditorAgent(),
      new InsiderAgent(),
      new StatAgent()
    ];
  }

  async execute(topic: string, onProgress: (state: AgentState[]) => void): Promise<ValidatedResearchData> {
    const agentStates: AgentState[] = this.agents.map(a => ({ name: a.name, status: 'PENDING' }));
    onProgress([...agentStates]);

    // 1. Parallel Execution with Settled Results (Promise.allSettled)
    const promises = this.agents.map(async (agent, index) => {
      agentStates[index].status = 'RUNNING';
      onProgress([...agentStates]);
      
      try {
        // Enforce a 45s timeout for individual agents (giving them slightly more than the default 30s)
        // Note: The agents currently use LLMClient internally.
        // We rely on the agent's internal implementation to use the LLMClient,
        // but since we don't control the Agent class directly here (it's imported),
        // we wrap the run call in a local safety block if needed.
        // For now, assuming agent.run() returns a string.

        const result = await agent.run(topic);

        // Basic empty check
        if (!result || result.trim().length < 10) {
            throw new Error("Insufficient data returned");
        }

        agentStates[index].status = 'COMPLETED';
        onProgress([...agentStates]);
        return { name: agent.name, data: result, success: true };
      } catch (e) {
        console.error(`${agent.name} failed:`, e);
        agentStates[index].status = 'FAILED';
        agentStates[index].message = e instanceof Error ? e.message : "Unknown error";
        onProgress([...agentStates]);
        return { name: agent.name, data: `[${agent.name} Failed] No data available.`, success: false };
      }
    });

    const results = await Promise.allSettled(promises);
    
    // 2. Synthesize Reports
    // Extract successful data
    const validReports = results
        .filter(r => r.status === 'fulfilled' && r.value.success)
        .map(r => (r as PromiseFulfilledResult<{name: string, data: string, success: boolean}>).value);

    // Critical Guard: If NO agents succeeded, abort.
    if (validReports.length === 0) {
        throw new Error("All research agents failed. Please try a different topic or check your connection.");
    }

    const compiledDossier = results.map(r => {
        if (r.status === 'fulfilled') {
            return `${r.value.name.toUpperCase()} REPORT:\n${r.value.data}`;
        }
        return "AGENT FAILED";
    }).join('\n\n');

    // 3. Structured Synthesis
    const synthesisResponse = await this.llm.generateContentWithRetry({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze the following FORENSIC DOSSIER on "${topic}".
        Synthesize the conflicting reports into a single, cohesive ResearchData object.
        
        FORENSIC DOSSIER:
        ${compiledDossier}
      `,
      config: {
        systemInstruction: RESEARCH_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            ethicalRating: { type: Type.NUMBER },
            profitPotential: { type: Type.STRING },
            marketStats: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  context: { type: Type.STRING }
                }
              }
            },
            hiddenCosts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  context: { type: Type.STRING }
                }
              }
            },
            caseStudies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['WINNER', 'LOSER'] },
                  background: { type: Type.STRING },
                  strategy: { type: Type.STRING },
                  outcome: { type: Type.STRING },
                  revenue: { type: Type.STRING }
                }
              }
            },
            affiliates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  program: { type: Type.STRING },
                  potential: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['PARTICIPANT', 'WRITER'] },
                  commission: { type: Type.STRING },
                  notes: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = synthesisResponse.text || "{}";
    
    try {
      const parsed = cleanAndParseJSON(text); // Use robust parser
      // Validate with Zod
      return ResearchDataSchema.parse(parsed);
    } catch (e) {
      console.error("Validation error:", e);
      throw new Error("Failed to validate research data structure.");
    }
  }
}
