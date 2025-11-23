import { GoogleGenAI, GenerateContentResponse, GroundingChunk } from "@google/genai";

export type { GroundingChunk };

export interface LocationData {
  latitude: number;
  longitude: number;
}

interface GenerateResponseParams {
  prompt: string;
  model: string;
  history?: { role: string; parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] }[];
  useSearch?: boolean;
  useMaps?: boolean;
  location?: LocationData | null;
  image?: { data: string; mimeType: string } | null;
}

const getApiKey = (): string => {
  const key = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
               (import.meta as any).env?.GEMINI_API_KEY ||
               (typeof process !== 'undefined' && process.env?.API_KEY);
  return key || '';
};

export const sendMessageToGemini = async ({
  prompt,
  model,
  history = [],
  useSearch = false,
  useMaps = false,
  location,
  image
}: GenerateResponseParams): Promise<{ text: string; groundingChunks?: GroundingChunk[] }> => {
  
  const apiKey = getApiKey();
  if (!apiKey) {
    return { text: "API key not configured. Please set VITE_GEMINI_API_KEY in your environment." };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const tools: any[] = [];
  if (useSearch) {
    tools.push({ googleSearch: {} });
  }
  if (useMaps) {
    tools.push({ googleMaps: {} });
  }

  const config: any = {
    systemInstruction: "You are Echo, a knowledgeable civic assistant for Indian cities. Help users find information about their local area, civic issues, government policies, and locate amenities or offices.\n\n**AI Categorization & Analysis:**\nIf the user provides an image or describes a civic issue (like a pothole, graffiti, trash, infrastructure damage, etc.):\n1. Analyze the visual or textual details carefully.\n2. Start your response with a bold category tag, e.g., **[Category: Infrastructure]** or **[Category: Sanitation]**.\n3. Provide specific advice on how to report or resolve the issue.\n\nWhen users ask about locations, use Google Maps. When users ask about current events or regulations, use Google Search. Be concise, polite, and accurate. Format responses in Markdown.",
  };

  if (tools.length > 0) {
    config.tools = tools;
  }

  if (useMaps && location) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      }
    };
  }

  const currentUserParts: any[] = [];
  
  if (image) {
    currentUserParts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.data
      }
    });
  }
  
  if (prompt) {
    currentUserParts.push({ text: prompt });
  }

  const contents = [
    ...history.map(msg => ({
      role: msg.role,
      parts: msg.parts
    })),
    {
      role: 'user',
      parts: currentUserParts
    }
  ];

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: config
    });

    const text = response.text || "I couldn't generate a response.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return { text, groundingChunks };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Sorry, I encountered an error. Please try again." };
  }
};
