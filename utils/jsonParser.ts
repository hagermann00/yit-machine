/**
 * Robustly parses JSON from LLM responses, handling Markdown blocks and common formatting issues.
 */
export function cleanAndParseJSON<T>(text: string): T {
    if (!text) {
        throw new Error("Cannot parse empty string");
    }

    // 1. Remove Markdown code blocks (```json ... ``` or just ``` ... ```)
    let clean = text.replace(/```json/g, '').replace(/```/g, '');

    // 2. Trim whitespace
    clean = clean.trim();

    // 3. Attempt direct parse
    try {
        return JSON.parse(clean) as T;
    } catch (e) {
        // 4. Fallback: Try to find the valid JSON object within the text
        // This handles cases where the LLM adds intro text like "Here is the JSON:"
        const firstBrace = clean.indexOf('{');
        const lastBrace = clean.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
             const candidate = clean.substring(firstBrace, lastBrace + 1);
             try {
                 return JSON.parse(candidate) as T;
             } catch (e2) {
                 // Final failure
                 console.error("JSON Parsing failed. Raw text:", text);
                 throw new Error(`Failed to parse JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
             }
        }

        console.error("JSON Parsing failed (No braces found). Raw text:", text);
        throw e;
    }
}
