import { GoogleGenAI, Type, Schema } from "@google/genai";
import { 
    RESEARCH_SYSTEM_PROMPT, 
    AUTHOR_SYSTEM_PROMPT, 
    Y_IT_NANO_BOOK_SPEC,
    DETECTIVE_AGENT_PROMPT,
    AUDITOR_AGENT_PROMPT,
    INSIDER_AGENT_PROMPT,
    STAT_AGENT_PROMPT,
    IMAGE_MODELS
} from '../constants';
import { ResearchData, Book, GenSettings, ImageModelID } from '../types';

// Initialize the client.
// NOTE: In a real app, ensure process.env.API_KEY is available. 
// For this demo, we assume the environment variable or a global placeholder is handled by the framework.
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Retry helper
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isFatal = error.status === 403 || (error.message && error.message.includes("403"));
    if (retries > 0 && !isFatal) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Helper: Run a single search agent
async function runSearchAgent(topic: string, systemPrompt: string): Promise<string> {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Investigate the topic: "${topic}". Find facts, figures, and user stories.`,
    config: {
      systemInstruction: systemPrompt,
      tools: [{ googleSearch: {} }], // Enable Live Search
      // No schema for search tools
    }
  });
  
  // Extract text and grounding chunks (urls)
  // For now, we just return the text to be synthesized
  return response.text || "No data found by this agent.";
}

// Phase 1: Deep Forensic Research (Multi-Agent)
export const performResearch = async (topic: string, caseStudyCount: number = 7): Promise<ResearchData> => {
  const ai = getAiClient();

  // 1. Parallel Agent Swarm
  // We spawn multiple agents to look at the topic from different angles simultaneously
  const [detectiveReport, auditorReport, insiderReport, statReport] = await Promise.all([
      runSearchAgent(topic, DETECTIVE_AGENT_PROMPT),
      runSearchAgent(topic, AUDITOR_AGENT_PROMPT),
      runSearchAgent(topic, INSIDER_AGENT_PROMPT),
      runSearchAgent(topic, STAT_AGENT_PROMPT)
  ]);

  const rawForensicData = `
    DETECTIVE REPORT (SCAMS/VICTIMS):
    ${detectiveReport}

    AUDITOR REPORT (COSTS/FEES):
    ${auditorReport}

    INSIDER REPORT (AFFILIATES/GURUS):
    ${insiderReport}

    STATISTICIAN REPORT (NUMBERS):
    ${statReport}
  `;

  // 2. The Analyst (Synthesis)
  // Takes the raw mess from the agents and structures it into the ResearchData schema
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze the following FORENSIC DOSSIER on "${topic}".
        Synthesize the conflicting reports into a single, cohesive ResearchData object.
        
        FORENSIC DOSSIER:
        ${rawForensicData}
        
        REQUIREMENTS:
        - Generate exactly ${caseStudyCount} case studies based on the victim stories found.
        - Calculate an "Ethical Rating" (1-10) based on the severity of scams found.
        - List the specific affiliate programs found in the Insider Report.
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

    const text = response.text || "{}";
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '');
    const data = JSON.parse(cleanText) as ResearchData;
    
    // Basic validation
    if (!data.caseStudies || !data.marketStats) {
        throw new Error("Invalid research data structure");
    }

    return data;
  });
};

// Phase 2: Draft Generation
export const generateDraft = async (topic: string, research: ResearchData, settings: GenSettings): Promise<Book> => {
    const ai = getAiClient();
    
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

    return callWithRetry(async () => {
        const response = await ai.models.generateContent({
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
        });

        const text = response.text || "{}";
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '');
        return JSON.parse(cleanText) as Book;
    });
};

// Image Generation with Hierarchy Support
export const generateImage = async (prompt: string, visualStyle: string = '', highRes: boolean = false, hierarchy: ImageModelID[] = ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image', 'imagen-3.0-generate-001']): Promise<string> => {
    const ai = getAiClient();
    const fullPrompt = `Style: ${visualStyle || "Photorealistic, Gritty, Forensic, High Contrast"}. Subject: ${prompt}. No text in image.`;

    // Try models in the user-defined order
    for (const modelId of hierarchy) {
        try {
            console.log(`Attempting image gen with ${modelId}...`);
            
            if (modelId === 'imagen-3.0-generate-001') {
                const response = await ai.models.generateImages({
                    model: modelId,
                    prompt: fullPrompt,
                    config: {
                        numberOfImages: 1,
                        outputMimeType: 'image/jpeg',
                        aspectRatio: '3:4'
                    }
                });
                return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
            } 
            else {
                // Gemini Models
                // Filter incompatible config for standard flash
                const imageConfig: any = { aspectRatio: "3:4" };
                if (modelId === 'gemini-3-pro-image-preview' && highRes) {
                    imageConfig.imageSize = "2K"; // Only for Pro
                }

                const response = await ai.models.generateContent({
                    model: modelId,
                    contents: { parts: [{ text: fullPrompt }] },
                    config: {
                        imageConfig: imageConfig
                    }
                });

                // Extract image
                for (const part of response.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData && part.inlineData.data) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
        } catch (error: any) {
            console.warn(`Model ${modelId} failed:`, error.message);
            // Continue to next model in hierarchy
        }
    }

    throw new Error("All image generation models failed.");
};

export const editImage = async (base64Image: string, prompt: string, hierarchy: ImageModelID[] = ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image']): Promise<string> => {
    const ai = getAiClient();
    
    // Imagen 3 doesn't support editing in this SDK flow usually, so we limit to Gemini models
    const editingHierarchy = hierarchy.filter(id => id.startsWith('gemini'));
    if (editingHierarchy.length === 0) editingHierarchy.push('gemini-2.5-flash-image');

    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    for (const modelId of editingHierarchy) {
        try {
            const response = await ai.models.generateContent({
                model: modelId,
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
                        { text: `Modify this image: ${prompt}. Keep the same aspect ratio.` }
                    ]
                }
            });

             for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        } catch (error) {
             console.warn(`Edit with ${modelId} failed.`, error);
        }
    }
    
    throw new Error("Image editing failed on all available models.");
};