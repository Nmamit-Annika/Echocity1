import { GoogleGenAI } from '@google/genai';

interface ExtractedComplaint {
  isComplaint: boolean;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

class ComplaintExtractorService {
  private apiKey?: string;

  constructor() {
    this.apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                  (typeof process !== 'undefined' && process.env?.API_KEY);
  }

  async extractComplaint(userMessage: string, imageData?: { data: string; mimeType: string }): Promise<ExtractedComplaint> {
    if (!this.apiKey) {
      return this.getDefaultResponse();
    }

    try {
      const ai = new GoogleGenAI({ apiKey: this.apiKey });

      const prompt = `Analyze if this message describes a civic complaint that needs to be filed.

User message: "${userMessage}"

Determine:
1. IS_COMPLAINT: true/false - Does this describe a civic issue that should be reported?
2. TITLE: Short title (5-10 words) if it's a complaint
3. DESCRIPTION: Detailed description of the issue
4. CATEGORY: One of [Infrastructure, Waste Management, Traffic, Public Safety, Water Supply, Electricity, Street Lighting, Parks & Recreation, Noise Pollution, Health & Sanitation]
5. SEVERITY: low/medium/high/critical based on urgency

Examples of complaints:
- "There's a huge pothole on Main Street"
- "Garbage hasn't been collected in 3 days"
- "Street light is broken near the park"
- Image of broken infrastructure

NOT complaints:
- "Where is the nearest hospital?"
- "What are the parking rules?"
- General questions

Format response as:
IS_COMPLAINT: [true/false]
TITLE: [title if complaint]
DESCRIPTION: [description if complaint]
CATEGORY: [category if complaint]
SEVERITY: [severity if complaint]`;

      const parts: any[] = [{ text: prompt }];
      
      if (imageData) {
        parts.push({
          inlineData: {
            data: imageData.data,
            mimeType: imageData.mimeType
          }
        });
      }

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: parts
        }]
      });

      const text = result.text || '';
      return this.parseResponse(text);
    } catch (error) {
      console.error('Complaint extraction failed:', error);
      return this.getDefaultResponse();
    }
  }

  private parseResponse(text: string): ExtractedComplaint {
    const lines = text.split('\n').filter(l => l.trim());
    
    let isComplaint = false;
    let title = '';
    let description = '';
    let category = 'Infrastructure';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    for (const line of lines) {
      if (line.startsWith('IS_COMPLAINT:')) {
        isComplaint = line.toLowerCase().includes('true');
      } else if (line.startsWith('TITLE:')) {
        title = line.replace('TITLE:', '').trim();
      } else if (line.startsWith('DESCRIPTION:')) {
        description = line.replace('DESCRIPTION:', '').trim();
      } else if (line.startsWith('CATEGORY:')) {
        category = line.replace('CATEGORY:', '').trim();
      } else if (line.startsWith('SEVERITY:')) {
        const sev = line.replace('SEVERITY:', '').trim().toLowerCase();
        if (['low', 'medium', 'high', 'critical'].includes(sev)) {
          severity = sev as any;
        }
      }
    }

    const confidence = isComplaint && title && description && category ? 0.9 : 0.5;

    return {
      isComplaint,
      title: title || 'Civic Issue',
      description: description || '',
      category,
      severity,
      confidence
    };
  }

  private getDefaultResponse(): ExtractedComplaint {
    return {
      isComplaint: false,
      title: '',
      description: '',
      category: 'Infrastructure',
      severity: 'medium',
      confidence: 0
    };
  }
}

export const complaintExtractor = new ComplaintExtractorService();
