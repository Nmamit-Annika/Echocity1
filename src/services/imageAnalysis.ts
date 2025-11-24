import { GoogleGenAI } from '@google/genai';

interface ImageAnalysisResult {
  title: string;
  description: string;
  suggestedCategory: string;
  confidence: number;
  details: string[];
}

class ImageAnalysisService {
  private apiKey?: string;

  constructor() {
    this.apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                  (typeof process !== 'undefined' && process.env?.API_KEY);
  }

  async analyzeComplaintImage(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<ImageAnalysisResult> {
    if (!this.apiKey) {
      return this.getMockAnalysis();
    }

    try {
      const ai = new GoogleGenAI({ apiKey: this.apiKey });

      const prompt = `You are a civic issue analyzer. Analyze this image and provide a structured analysis for a municipal complaint system.

**AI Categorization & Analysis:**
1. Carefully examine the image for civic/infrastructure issues (potholes, garbage, broken lights, damaged roads, etc.)
2. Start with a bold category tag: **[Category: Infrastructure]** or **[Category: Sanitation]** etc.
3. Provide specific, actionable details about severity, location markers, and urgency.

Provide analysis in this format:
TITLE: [5-10 word clear title]
DESCRIPTION: [2-3 sentences describing the issue, severity, and visible conditions]
CATEGORY: [One of: Infrastructure, Waste Management, Traffic, Public Safety, Water Supply, Electricity, Street Lighting, Parks & Recreation, Noise Pollution, Health & Sanitation]
DETAILS: 
- [Specific detail 1]
- [Specific detail 2]
- [Urgency/severity assessment]

Be precise, professional, and focus on actionable information for city officials.`;

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType
              }
            }
          ]
        }]
      });

      const text = result.text || '';

      return this.parseResponse(text);
    } catch (error) {
      console.error('Image analysis failed:', error);
      return this.getMockAnalysis();
    }
  }

  private parseResponse(text: string): ImageAnalysisResult {
    const lines = text.split('\n').filter(l => l.trim());
    let title = '';
    let description = '';
    let category = '';
    const details: string[] = [];

    // Extract category tag if present (e.g., **[Category: Infrastructure]**)
    const categoryTagMatch = text.match(/\*\*\[Category:\s*([^\]]+)\]\*\*/i);
    if (categoryTagMatch) {
      category = categoryTagMatch[1].trim();
    }

    for (const line of lines) {
      if (line.startsWith('TITLE:')) {
        title = line.replace('TITLE:', '').trim();
      } else if (line.startsWith('DESCRIPTION:')) {
        description = line.replace('DESCRIPTION:', '').trim();
      } else if (line.startsWith('CATEGORY:')) {
        category = category || line.replace('CATEGORY:', '').trim();
      } else if (line.startsWith('DETAILS:')) {
        // Skip the header
      } else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        details.push(line.trim().substring(1).trim());
      }
    }

    // If parsing failed, try to extract from free text
    if (!title || !description) {
      const sentences = text.split('.').filter(s => s.trim());
      title = title || sentences[0]?.trim().substring(0, 80) || 'Civic Issue Detected';
      description = description || text.substring(0, 200);
      category = category || 'Infrastructure';
    }

    // Calculate confidence based on how complete the analysis is
    let confidence = 0.70;
    if (title && description && category && details.length > 0) confidence = 0.95;
    else if (title && description && category) confidence = 0.85;
    else if (title && description) confidence = 0.75;

    return {
      title,
      description,
      suggestedCategory: category,
      confidence,
      details
    };
  }

  private getMockAnalysis(): ImageAnalysisResult {
    return {
      title: 'Infrastructure Issue Detected',
      description: 'AI image analysis is not available. Please provide a description manually.',
      suggestedCategory: 'Infrastructure',
      confidence: 0.5,
      details: ['Image uploaded successfully', 'Manual categorization required']
    };
  }
}

export const imageAnalysisService = new ImageAnalysisService();
