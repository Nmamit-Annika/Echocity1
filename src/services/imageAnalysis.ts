// AI Image Analysis Service using Gemini Vision
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ImageAnalysisResult {
  title: string;
  description: string;
  suggestedCategory: string;
  confidence: number;
  details: string[];
}

class ImageAnalysisService {
  private genAI?: GoogleGenerativeAI;
  private apiKey?: string;

  constructor() {
    this.apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  async analyzeComplaintImage(imageBase64: string): Promise<ImageAnalysisResult> {
    if (!this.genAI) {
      return this.getMockAnalysis();
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Analyze this civic complaint image and provide:

1. A clear, concise TITLE (5-10 words) describing the issue
2. A detailed DESCRIPTION (2-3 sentences) of what you see
3. The most appropriate CATEGORY from: Infrastructure, Waste Management, Traffic, Public Safety, Water Supply, Electricity, Street Lighting, Parks & Recreation, Noise Pollution, Health & Sanitation
4. SPECIFIC DETAILS about the issue (location markers, severity, urgency)

Focus on civic/municipal issues. Be specific and actionable.

Format your response as:
TITLE: [title]
DESCRIPTION: [description]
CATEGORY: [category name]
DETAILS: [bullet points]`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();

      return this.parseResponse(text);
    } catch (error) {
      console.error('Image analysis error:', error);
      return this.getMockAnalysis();
    }
  }

  private parseResponse(text: string): ImageAnalysisResult {
    const lines = text.split('\n').filter(l => l.trim());
    
    let title = '';
    let description = '';
    let category = '';
    const details: string[] = [];

    for (const line of lines) {
      if (line.startsWith('TITLE:')) {
        title = line.replace('TITLE:', '').trim();
      } else if (line.startsWith('DESCRIPTION:')) {
        description = line.replace('DESCRIPTION:', '').trim();
      } else if (line.startsWith('CATEGORY:')) {
        category = line.replace('CATEGORY:', '').trim();
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

    return {
      title,
      description,
      suggestedCategory: category,
      confidence: 0.85,
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
