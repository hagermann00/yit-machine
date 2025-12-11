import { LLMClient } from './core/LLMClient';
import { DetectiveAgent } from './agents/DetectiveAgent';
import { AuditorAgent } from './agents/AuditorAgent';
import { InsiderAgent } from './agents/InsiderAgent';
import { StatAgent } from './agents/StatAgent';
import { ResearchData, ResearchDataSchema, BookSchema } from './core/SchemaValidator';
import { RESEARCH_SYSTEM_PROMPT, AUTHOR_SYSTEM_PROMPT } from '../constants';
import { Type } from '@google/genai';
import { AgentResult } from './agents/BaseAgent';
import { GenSettings, Book } from '../types';

export class ResearchCoordinator {
    private static instance: ResearchCoordinator;

    // Callback for UI updates
    private statusCallback?: (message: string) => void;

    private constructor() {}

    public static getInstance(): ResearchCoordinator {
        if (!ResearchCoordinator.instance) {
            ResearchCoordinator.instance = new ResearchCoordinator();
        }
        return ResearchCoordinator.instance;
    }

    public setStatusCallback(cb: (message: string) => void) {
        this.statusCallback = cb;
    }

    private log(message: string) {
        if (this.statusCallback) this.statusCallback(message);
        console.log(`[Coordinator] ${message}`);
    }

    public async performResearch(topic: string, caseStudyCount: number = 7): Promise<ResearchData> {
        this.log(`Initiating Deep Forensic Research on: ${topic}`);

        // 1. Initialize Agents
        const agents = [
            new DetectiveAgent(),
            new AuditorAgent(),
            new InsiderAgent(),
            new StatAgent()
        ];

        this.log(`Deploying ${agents.length} agents to the field...`);

        // 2. Parallel Execution with Promise.allSettled
        const results = await Promise.allSettled(agents.map(agent => agent.run(topic)));

        const successfulReports: string[] = [];
        const failedAgents: string[] = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                const agentResult = result.value as AgentResult;
                if (agentResult.success && agentResult.data) {
                    successfulReports.push(`${agentResult.agentName.toUpperCase()} REPORT:\n${agentResult.data}`);
                } else {
                    failedAgents.push(agentResult.agentName);
                }
            } else {
                // This shouldn't happen due to BaseAgent try/catch, but just in case
                failedAgents.push(`Agent ${index}`);
            }
        });

        if (failedAgents.length > 0) {
            this.log(`Warning: The following agents failed or returned no data: ${failedAgents.join(', ')}`);
        }

        if (successfulReports.length === 0) {
            throw new Error("All research agents failed. Cannot proceed.");
        }

        this.log("Synthesizing Forensic Dossier...");

        const rawForensicData = successfulReports.join('\n\n' + '='.repeat(20) + '\n\n');

        // 3. Synthesis (The Analyst)
        const llm = LLMClient.getInstance();

        // Construct the Gemini Schema object for the specific ResearchData structure
        // We have to define this manually for the API, even though we have Zod for validation
        // (The SDK requires the specific Type enum structure)
        const researchSchema = {
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
        };

        const data = await llm.generateStructured(
            `
            Analyze the following FORENSIC DOSSIER on "${topic}".
            Synthesize the reports into a single, cohesive ResearchData object.

            FORENSIC DOSSIER:
            ${rawForensicData}

            REQUIREMENTS:
            - Generate exactly ${caseStudyCount} case studies.
            - If reports are conflicting, prioritize the Detective and Auditor.
            `,
            ResearchDataSchema,
            researchSchema,
            RESEARCH_SYSTEM_PROMPT
        );

        this.log("Research complete.");
        return data;
    }

    public async generateDraft(topic: string, research: ResearchData, settings: GenSettings): Promise<Book> {
        this.log("Drafting Book Structure...");
        const llm = LLMClient.getInstance();

         const lengthInstruction = settings.lengthLevel === 1 ? "Keep chapters short (Nano-sized)."
                            : settings.lengthLevel === 3 ? "Write extensive, deep chapters."
                            : "Standard chapter length.";

        const imageInstruction = settings.imageDensity === 3 ? "Include 3-4 visual descriptions per chapter."
                            : settings.imageDensity === 1 ? "Minimal visuals, text focused."
                            : "Include 1-2 visual descriptions per chapter.";

        const constraints = `
            Target Word Count: ${settings.targetWordCount || "Default"}
            Tone: ${settings.tone || "Default Y-It Satire"}
            Visual Style: ${settings.visualStyle || "Default Forensic/Gritty"}
            ${lengthInstruction}
            ${imageInstruction}
            Tech Level: ${settings.techLevel}
        `;

        const bookSchema = {
             type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
                frontCover: {
                    type: Type.OBJECT,
                    properties: {
                        titleText: { type: Type.STRING },
                        subtitleText: { type: Type.STRING },
                        visualDescription: { type: Type.STRING }
                    }
                },
                backCover: {
                    type: Type.OBJECT,
                    properties: {
                        blurb: { type: Type.STRING },
                        visualDescription: { type: Type.STRING }
                    }
                },
                chapters: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            number: { type: Type.NUMBER },
                            title: { type: Type.STRING },
                            content: { type: Type.STRING },
                            posiBotQuotes: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        position: { type: Type.STRING, enum: ['LEFT', 'RIGHT'] },
                                        text: { type: Type.STRING }
                                    }
                                }
                            },
                            visuals: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        type: { type: Type.STRING, enum: ['HERO', 'CHART', 'CALLOUT', 'PORTRAIT', 'DIAGRAM'] },
                                        description: { type: Type.STRING },
                                        caption: { type: Type.STRING }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } as unknown as Schema; // Casting because the recursive type def in SDK can be tricky

        const book = await llm.generateStructured(
             `
                Topic: ${topic}
                Research Summary: ${JSON.stringify(research.summary)}
                Market Stats: ${JSON.stringify(research.marketStats)}
                Case Studies: ${JSON.stringify(research.caseStudies)}
                User Constraints: ${constraints}
                Custom Spec: ${settings.customSpec || "Use Standard Spec"}
                Cover Art Instructions:
                Front: ${settings.frontCoverPrompt || "Auto-generate based on Y-It Brand (Yellow/Black/Bold)"}
                Back: ${settings.backCoverPrompt || "Auto-generate based on Y-It Brand"}
            `,
            BookSchema,
            bookSchema,
            AUTHOR_SYSTEM_PROMPT
        );

        this.log("Draft complete.");
        return book;
    }
}
