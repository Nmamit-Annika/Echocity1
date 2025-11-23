import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  maps?: {
    uri?: string;
    title?: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        content?: string;
      }[];
    }[];
  };
}

export interface LocationData {
  latitude: number;
  longitude: number;
}

interface GenerateResponseParams {
  prompt: string;
  model: string;
  history?: { role: string; parts: { text: string }[] }[];
  useSearch?: boolean;
  useMaps?: boolean;
  location?: LocationData | null;
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
  location
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
    systemInstruction: "You are Echo, a knowledgeable civic assistant for Indian cities. Help users find information about their local area, civic issues, government policies, and locate amenities or offices. When users ask about locations, use Google Maps. When users ask about current events or regulations, use Google Search. Be concise, polite, and accurate. Format responses in Markdown.",
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

  const contents = [
    ...history.map(msg => ({
      role: msg.role,
      parts: msg.parts
    })),
    {
      role: 'user',
      parts: [{ text: prompt }]
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
