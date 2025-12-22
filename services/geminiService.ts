
import { GoogleGenAI, Type } from "@google/genai";

export const getSmartSuggestions = async (description: string) => {
  if (!description || description.length < 5) return null;

  // Create a new GoogleGenAI instance right before making an API call.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest a more professional version of this task description and a likely project category (e.g., Marketing, Development, Design, Admin). Description: "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            professionalDescription: { type: Type.STRING },
            suggestedProject: { type: Type.STRING },
          },
          required: ["professionalDescription", "suggestedProject"],
        },
      },
    });

    // Directly access the .text property on the response object.
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return null;
  }
};
