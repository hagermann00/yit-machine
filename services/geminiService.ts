
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Y_IT_SYSTEM_PROMPT, Y_IT_NANO_BOOK_SPEC } from '../constants';
import { GeneratedContent } from '../types';

// Initialize the client. The API key is guaranteed to be in process.env.API_KEY
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Retry helper function with exponential backoff
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      console.warn(`API call failed, retrying... (${retries} attempts left). Error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Validator to ensure API response matches our TypeScript interfaces
function validateResponseStructure(data: any): void {
  if (!data || typeof data !== 'object') throw new Error("Response is not an object");

  // Validate Research
  if (!data.research) throw new Error("Missing 'research' object in response");
  if (!Array.isArray(data.research.caseStudies)) throw new Error("Missing 'caseStudies' array");
  if (!Array.isArray(data.research.affiliates)) throw new Error("Missing 'affiliates' array");
  if (typeof data.research.ethicalRating !== 'number') throw new Error("Missing or invalid 'ethicalRating'");

  // Validate Book
  if (!data.book) throw new Error("Missing 'book' object in response");
  if (!data.book.title) throw new Error("Missing book title");
  if (!Array.isArray(data.book.chapters)) throw new Error("Missing 'chapters' array");
  if (data.book.chapters.length === 0) throw new Error("Book has zero chapters");
  
  // Validate Chapter Structure
  const firstChapter = data.book.chapters[0];
  if (!firstChapter.title || !firstChapter.content) throw new Error("Invalid chapter structure (missing title or content)");
}

const schema: Schema = {
  type: Type.OBJECT,
  properties: {
    research: {
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
              context: { type: Type.STRING },
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
              context: { type: Type.STRING },
            }
          }
        },
        caseStudies: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["WINNER", "LOSER"] },
              background: { type: Type.STRING },
              strategy: { type: Type.STRING },
              outcome: { type: Type.STRING },
              revenue: { type: Type.STRING },
            }
          }
        },
        affiliates: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              program: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["PARTICIPANT", "WRITER"] },
              commission: { type: Type.STRING },
              potential: { type: Type.STRING },
              notes: { type: Type.STRING },
            }
          }
        }
      },
      required: ["summary", "ethicalRating", "profitPotential", "marketStats", "hiddenCosts", "caseStudies", "affiliates"]
    },
    book: {
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
            },
            required: ["titleText", "visualDescription"]
        },
        backCover: {
            type: Type.OBJECT,
            properties: {
                blurb: { type: Type.STRING },
                visualDescription: { type: Type.STRING }
            },
            required: ["blurb", "visualDescription"]
        },
        chapters: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              number: { type: Type.INTEGER },
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              posiBotQuotes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    position: { type: Type.STRING, enum: ["LEFT", "RIGHT"] },
                    text: { type: Type.STRING }
                  }
                },
                nullable: true
              },
              visuals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ['HERO', 'CHART', 'CALLOUT', 'PORTRAIT', 'DIAGRAM'] },
                    description: { type: Type.STRING },
                    caption: { type: Type.STRING, nullable: true }
                  }
                },
                nullable: true
              }
            },
            required: ["number", "title", "content"]
          }
        }
      },
      required: ["title", "subtitle", "chapters", "frontCover", "backCover"]
    }
  },
  required: ["research", "book"]
};

export const generateBookContent = async (
    topic: string, 
    customSpec?: string, 
    tone?: string, 
    visualStyle?: string,
    lengthLevel: number = 2,
    imageDensity: number = 2,
    techLevel: number = 2,
    targetWordCount?: number,
    caseStudyCount?: number,
    frontCoverPrompt?: string,
    backCoverPrompt?: string,
    frontCoverImage?: string,
    backCoverImage?: string
): Promise<GeneratedContent> => {
  const ai = getAiClient();
  
  const specToUse = customSpec || Y_IT_NANO_BOOK_SPEC;
  const userTone = tone || "Satirical, forensic, data-driven";
  const userVisuals = visualStyle || "High contrast, editorial, gritty data visualization";

  // --- Logic for Physics Sliders ---
  
  // Length Logic
  let lengthInstruction = "Ensure standard chapter length (~400-500 words).";
  if (lengthLevel === 1) lengthInstruction = "Keep it NANO. Very condensed chapters (~250-300 words). Highly efficient.";
  if (lengthLevel === 3) lengthInstruction = "DEEP DIVE. Extensive chapters (~700-900 words). Thorough detail.";
  if (targetWordCount) lengthInstruction = `STRICT CONSTRAINT: Each chapter must be exactly ${targetWordCount} words.`;

  // Image Density Logic
  let densityInstruction = "Include 1-2 visual placeholders per chapter.";
  if (imageDensity === 1) densityInstruction = "Text focused. Minimal visuals (0-1 per chapter).";
  if (imageDensity === 3) densityInstruction = "Visual heavy. Include 3-4 visual placeholders per chapter (mix of Hero and Charts).";

  // Tech/Style Logic
  let techInstruction = "Visual descriptions should be a mix of editorial photography and clear charts.";
  if (techLevel === 1) techInstruction = "Visual descriptions should be ARTISTIC, abstract, and metaphorical. Focus on mood over raw data.";
  if (techLevel === 3) techInstruction = "Visual descriptions should be HIGHLY TECHNICAL. Focus on complex charts, data tables, schematics, and flowcharts. Minimal artistic photography.";

  // Case Study Logic
  let caseStudyInstruction = "Identify 10+ specific case study archetypes.";
  if (caseStudyCount) caseStudyInstruction = `You MUST identify exactly ${caseStudyCount} specific case studies.`;

  // Cover Logic - ENFORCING Y-IT BRAND IF EMPTY
  const brandStyle = "Style: High-contrast 'Y-It' brand aesthetic (Black, Yellow, White). Gritty, forensic, satirical, minimalist. Looks like a warning label or a confidential dossier.";
  let coverInstruction = "Generate compelling visual descriptions for the front and back covers.";
  
  if (frontCoverPrompt) {
      coverInstruction += `\nFRONT COVER CONSTRAINT: The front cover visual description MUST incorporate this concept: "${frontCoverPrompt}".`;
  } else {
      coverInstruction += `\nFRONT COVER AUTOMATION: Design a front cover in the Y-It Brand style. ${brandStyle} Metaphor: The shiny lie vs the dark truth of '${topic}'.`;
  }

  if (backCoverPrompt) {
      coverInstruction += `\nBACK COVER CONSTRAINT: The back cover visual description MUST incorporate this concept: "${backCoverPrompt}".`;
  } else {
      coverInstruction += `\nBACK COVER AUTOMATION: Design a back cover in the Y-It Brand style. ${brandStyle} Metaphor: The empty aftermath or the forensic reality of '${topic}'.`;
  }

  const prompt = `Research Topic: "${topic}".
  
  Execute the Y-It Protocol (Deep Dive Mode):
  1.  **DEEP RESEARCH**: Dig deeper than surface level. Find specific, obscure failure mechanisms and real numbers. 
      - ${caseStudyInstruction}
      - Map the ENTIRE affiliate ecosystem (who makes money from the courses/tools).
  2.  **BOOK GENERATION**: Write the book following the SPECIFICATION below.
      - **TONE**: ${userTone}
      - **VISUAL STYLE**: All visual descriptions in the JSON must align with this style: "${userVisuals}".
      
      **PHYSICS CONSTRAINTS:**
      - **LENGTH**: ${lengthInstruction}
      - **IMAGE DENSITY**: ${densityInstruction}
      - **IMAGE TYPE**: ${techInstruction}
      - **COVERS**: ${coverInstruction}
  
  **BOOK SPECIFICATION:**
  ${specToUse}`;

  try {
    // Perform Generation inside the retry loop
    // This ensures that if the model generates invalid JSON, we retry the whole generation step
    const result = await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: Y_IT_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: schema,
          thinkingConfig: { thinkingBudget: 4096 }, 
        }
      });

      let text = response.text;
      if (!text) throw new Error("No content generated from model.");

      // Sanitize Markdown code blocks if present
      text = text.trim();
      if (text.startsWith('```json')) {
        text = text.replace(/^```json/, '').replace(/```$/, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/^```/, '').replace(/```$/, '');
      }

      let data;
      try {
        data = JSON.parse(text) as GeneratedContent;
      } catch (e) {
        throw new Error("Failed to parse JSON response. The model may have hallucinated malformed data.");
      }
      
      // Validate structure before accepting
      validateResponseStructure(data);

      return data;
    });

    // Inject custom cover images if provided (Overrides) - this happens after successful generation
    if (result.book.frontCover && frontCoverImage) {
        result.book.frontCover.imageUrl = frontCoverImage;
    }
    if (result.book.backCover && backCoverImage) {
        result.book.backCover.imageUrl = backCoverImage;
    }
    
    // Attach settings to the response so the UI knows what was used
    result.settings = {
        tone: userTone,
        visualStyle: userVisuals,
        lengthLevel,
        imageDensity,
        techLevel,
        targetWordCount,
        caseStudyCount,
        frontCoverPrompt,
        backCoverPrompt
    };

    return result;
  } catch (error) {
    console.error("Gemini API Error after retries:", error);
    throw error;
  }
};

export const generateImage = async (imageDescription: string, style?: string, highRes: boolean = false): Promise<string> => {
    const ai = getAiClient();
    try {
        const visualStyle = style || "High contrast, editorial, gritty, professional data visualization or photography";
        const prompt = `Create a visual for a book. 
        Description: ${imageDescription}. 
        Style: ${visualStyle}. 
        Constraint: No text in the image, or minimal illegible text if necessary for diagrams.`;

        // Use 'gemini-3-pro-image-preview' for high-res/KDP quality requests (Nano Banana Pro)
        // Use 'gemini-2.5-flash-image' for standard speed
        const model = highRes ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
        
        const config: any = {};
        if (highRes) {
            // "2K" is a good balance for KDP standard without hitting limits too hard, though model supports up to 4K
            config.imageConfig = { imageSize: "2K", aspectRatio: "1:1" }; 
        }

        const response = await callWithRetry(async () => {
            const resp = await ai.models.generateContent({
                model: model,
                contents: {
                    parts: [{ text: prompt }]
                },
                config: config
            });
            
            // Validate image response immediately inside retry
            if (!resp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
                throw new Error("No image data returned from API.");
            }
            return resp;
        });

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("No image data found in response");
    } catch (e) {
        console.error("Image generation failed", e);
        throw e;
    }
};

export const editImage = async (base64Image: string, editInstruction: string): Promise<string> => {
    const ai = getAiClient();
    try {
        // Cleaning the base64 string to get raw data
        const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

        const response = await callWithRetry(async () => {
            const resp = await ai.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: {
                    parts: [
                        {
                            text: editInstruction
                        },
                        {
                            inlineData: {
                                mimeType: 'image/png',
                                data: base64Data
                            }
                        }
                    ]
                },
                config: {
                    imageConfig: { imageSize: "2K" } // Maintain high quality for editing
                }
            });
             
            // Validate response inside retry
            if (!resp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
                throw new Error("No edited image data returned from API.");
            }
            return resp;
        });

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("No edited image data found");
    } catch (e) {
        console.error("Image edit failed", e);
        throw e;
    }
}
