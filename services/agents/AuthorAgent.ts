import { LLMClient } from "../core/LLMClient";
import { BookSchema, ValidatedBook } from "../core/SchemaValidator";
import { ResearchData, GenSettings, Book } from "../../types";
import { AUTHOR_SYSTEM_PROMPT } from "../../constants";
import { Type } from "@google/genai";
import { cleanAndParseJSON } from "../../utils/jsonParser";

export class AuthorAgent {
    private llm: LLMClient;

    constructor() {
        this.llm = LLMClient.getInstance();
    }

    async generateDraft(topic: string, research: ResearchData, settings: GenSettings): Promise<ValidatedBook> {
        // Construct instructions based on settings
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

        // Request a longer timeout (120s) for drafting as it's a heavy task
        const response = await this.llm.generateContentWithRetry({
            model: 'gemini-2.5-flash',
            contents: `
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
            config: {
                systemInstruction: AUTHOR_SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: {
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
                }
            }
        }, 3, 2000, 120000); // 120s timeout

        const text = response.text || "{}";

        try {
            // Robust parsing + Zod Validation
            const parsed = cleanAndParseJSON(text);
            return BookSchema.parse(parsed);
        } catch (e) {
            console.error("Drafting failed validation:", e);
            throw new Error("The Author Agent produced an invalid draft structure. Please try again.");
        }
    }
}
