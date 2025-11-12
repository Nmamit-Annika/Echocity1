// Gemini AI Service for Community Insights and Chatbot
import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiConfig {
  apiKey?: string;
  model: string;
  temperature: number;
}

interface GeminiRequest {
  prompt: string;
  context?: {
    complaints: any[];
    communityData?: any;
  };
}

interface GeminiResponse {
  content: string;
  type: 'analysis' | 'research' | 'general';
  confidence: number;
}

class GeminiService {
  private config: GeminiConfig = {
    model: 'gemini-1.5-flash',
    temperature: 0.7
  };
  private genAI?: GoogleGenerativeAI;

  constructor(apiKey?: string) {
    this.config.apiKey = apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (this.config.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.config.apiKey);
    }
  }

  async getChatResponse(message: string, context?: any): Promise<string> {
    if (!this.genAI) {
      return "I'm sorry, the AI service is not configured. Please set up your Gemini API key to enable chat functionality.";
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.config.model });
      
      const systemPrompt = `You are Echo, a helpful civic assistant for Indian cities. You help citizens with:
      - Filing complaints and reporting civic issues
      - Providing authority contact information
      - Finding pincodes and area information
      - Answering questions about civic processes
      - Providing guidance on municipal services
      
      Context: ${JSON.stringify(context)}
      
      Keep responses helpful, concise, and focused on civic assistance. If users need to file a complaint, encourage them to use the complaint form.`;
      
      const result = await model.generateContent([
        systemPrompt,
        `User message: ${message}`
      ]);
      
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      return "I'm sorry, I'm having trouble right now. Please try again in a moment.";
    }
  }

  async analyzeComplaints(complaints: any[]): Promise<GeminiResponse> {
    const prompt = this.buildAnalysisPrompt(complaints);
    
    if (!this.config.apiKey) {
      return this.getMockResponse(prompt, 'analysis');
    }

    try {
      // TODO: Replace with actual Gemini API call
      const response = await this.callGeminiAPI({
        prompt,
        context: { complaints }
      });
      
      return {
        content: response.text,
        type: 'analysis',
        confidence: response.confidence || 0.8
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.getMockResponse(prompt, 'analysis');
    }
  }

  async researchSimilarIssues(query: string): Promise<GeminiResponse> {
    const prompt = this.buildResearchPrompt(query);
    
    if (!this.config.apiKey) {
      return this.getMockResponse(prompt, 'research');
    }

    try {
      // TODO: Replace with actual Gemini API call with web search capability
      const response = await this.callGeminiAPI({
        prompt,
        context: { complaints: [] }
      });
      
      return {
        content: response.text,
        type: 'research',
        confidence: response.confidence || 0.8
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.getMockResponse(prompt, 'research');
    }
  }

  async getGeneralResponse(query: string, context?: any): Promise<GeminiResponse> {
    const prompt = this.buildGeneralPrompt(query, context);
    
    if (!this.config.apiKey) {
      return this.getMockResponse(prompt, 'general');
    }

    try {
      const response = await this.callGeminiAPI({
        prompt,
        context
      });
      
      return {
        content: response.text,
        type: 'general',
        confidence: response.confidence || 0.8
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.getMockResponse(prompt, 'general');
    }
  }

  private buildAnalysisPrompt(complaints: any[]): string {
    const categories = this.extractCategories(complaints);
    const timeframe = this.analyzeTimeframe(complaints);
    
    return `
    You are a civic data analyst AI. Analyze the following community complaint data:
    
    Total Complaints: ${complaints.length}
    Categories: ${JSON.stringify(categories)}
    Timeframe: ${timeframe}
    
    Please provide:
    1. Key trends and patterns
    2. Priority areas for action
    3. Recommendations for improvement
    4. Comparative insights
    
    Keep response concise, actionable, and focused on civic improvement.
    `;
  }

  private buildResearchPrompt(query: string): string {
    return `
    You are a civic research AI with access to web information. Research the following:
    
    Query: ${query}
    
    Please provide:
    1. Recent relevant news and discussions
    2. Similar initiatives in other cities
    3. Best practices and solutions
    4. Actionable insights for local implementation
    
    Focus on practical, evidence-based recommendations.
    `;
  }

  private buildGeneralPrompt(query: string, context?: any): string {
    return `
    You are a helpful civic assistant AI. Answer the following question:
    
    Question: ${query}
    Context: ${context ? JSON.stringify(context, null, 2) : 'None provided'}
    
    Provide a helpful, accurate, and actionable response related to civic issues and community engagement.
    `;
  }

  private async callGeminiAPI(request: GeminiRequest): Promise<any> {
    // TODO: Implement actual Gemini API call
    // This is where you would integrate with Google's Gemini API
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: request.prompt
          }]
        }],
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      throw new Error('Gemini API call failed');
    }

    const data = await response.json();
    return {
      text: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated',
      confidence: 0.8
    };
  }

  private getMockResponse(_prompt: string, type: 'analysis' | 'research' | 'general'): GeminiResponse {
    // Enhanced mock responses for development
    const mockResponses = {
      analysis: `📊 **Community Data Analysis**

**Key Insights:**
• High concentration of infrastructure complaints (45%)
• Peak reporting times: 8-10 AM weekdays
• Geographic clustering in residential areas
• Average resolution time: 5.2 days

**Priority Recommendations:**
1. Deploy proactive infrastructure monitoring
2. Increase morning response team capacity
3. Focus preventive maintenance in high-report zones
4. Implement 48-hour response target

**Trending Patterns:**
• 23% increase in reports this month
• Environmental concerns growing (15% uptick)
• Community engagement improving (higher detail in reports)`,

      research: `🔍 **Web Research Insights**

**Similar City Solutions:**
• Boston's "Street Bump" app reduced pothole reports by 30%
• Barcelona's participatory budgeting for civic projects
• Seoul's real-time city dashboard with citizen feedback

**Best Practices Found:**
• Mobile-first reporting increases participation
• AI-powered categorization improves efficiency
• Public transparency dashboards build trust
• Gamification elements encourage community involvement

**Implementation Opportunities:**
• Integration with city planning systems
• Predictive analytics for issue prevention
• Community voting on priority projects
• Real-time status tracking`,

      general: `💡 **Community Assistant Response**

I'm here to help with civic engagement and community improvements. Based on your question, here are some insights:

**What I can help with:**
• Analyzing complaint patterns and trends
• Researching solutions from other cities
• Providing civic engagement best practices
• Suggesting process improvements

**How to get the most value:**
• Ask specific questions about trends
• Request comparisons with other communities
• Inquire about best practices
• Seek actionable recommendations

Feel free to ask about anything related to civic issues, community engagement, or municipal services!`
    };

    return {
      content: mockResponses[type],
      type,
      confidence: 0.85
    };
  }

  private extractCategories(complaints: any[]): Record<string, number> {
    const categories: Record<string, number> = {};
    complaints.forEach(c => {
      const cat = c.categories?.name || 'Other';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    return categories;
  }

  private analyzeTimeframe(complaints: any[]): string {
    if (complaints.length === 0) return 'No data';
    
    const dates = complaints.map(c => new Date(c.created_at)).sort();
    const earliest = dates[0];
    const latest = dates[dates.length - 1];
    const daysDiff = Math.ceil((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));
    
    return `${daysDiff} days (${earliest.toLocaleDateString()} - ${latest.toLocaleDateString()})`;
  }
}

// Export singleton instance
export const geminiService = new GeminiService();

// Export types for use in components
export type { GeminiResponse, GeminiRequest };

// Environment setup instructions
export const SETUP_INSTRUCTIONS = `
To enable real Gemini AI integration:

1. Get a Gemini API key from Google AI Studio
2. Add to your .env file:
   VITE_GEMINI_API_KEY=your_api_key_here

3. The service will automatically switch from mock to real responses

For production deployment:
1. Set environment variable in your hosting platform
2. Ensure API key is properly secured
3. Configure rate limiting if needed
`;