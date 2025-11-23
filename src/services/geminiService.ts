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
      
      const systemPrompt = `You are Echo, a comprehensive civic assistant for Indian cities. You help citizens with:

🏛️ CIVIC SERVICES:
- Finding nearest police stations, hospitals, government offices
- Authority contact information and office hours  
- Municipal service procedures and requirements
- Emergency contact numbers and helplines

📍 LOCATION ASSISTANCE:
- Pincode lookup and area information
- Directions to civic facilities
- Local authority contacts
- Emergency service locations

🔧 GOVERNMENT SERVICES:
- Document requirements (birth certificate, passport, etc.)
- Property tax and utility bill procedures
- License and permit applications
- Complaint filing and tracking

📞 EMERGENCY & CONTACTS:
- Police: 100 | Fire: 101 | Ambulance: 108
- Women Helpline: 1091 | Child Helpline: 1098
- Municipal helpline numbers
- Department-specific contacts

INSTRUCTIONS:
- Provide specific, actionable information
- Include contact numbers and addresses when available
- Use proper formatting with emojis for clarity
- For location queries, ask for area/pincode if not provided
- Prioritize emergency information when relevant
- Be helpful and civic-minded

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
    You are Echo, a comprehensive civic assistant AI for Indian cities. You help citizens with:
    
    🏛️ CIVIC SERVICES:
    - Finding nearest police stations, hospitals, government offices
    - Authority contact information and office hours
    - Municipal service procedures and requirements
    - Complaint filing guidance and tracking
    
    📍 LOCATION SERVICES:
    - Pincode lookup and area information
    - Distance and directions to civic facilities
    - Emergency service locations
    - Public transport information
    
    🔍 GENERAL ASSISTANCE:
    - Legal rights and civic procedures
    - Document requirements for services
    - Best practices for civic engagement
    - Community resources and helplines
    
    Query: ${query}
    Context: ${context ? JSON.stringify(context, null, 2) : 'None provided'}
    
    INSTRUCTIONS:
    - Provide specific, actionable information
    - Include contact numbers and addresses when possible
    - Use proper formatting with emojis for clarity
    - If location-specific, ask for the user's area/pincode
    - For emergencies, prioritize immediate contact information
    - Always be helpful and civic-minded
    
    Provide a comprehensive, helpful response:
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

  private getMockResponse(prompt: string, type: 'analysis' | 'research' | 'general'): GeminiResponse {
    // Query-aware mock responses for development/fallback
    const lowerPrompt = prompt.toLowerCase();
    
    // Check if it's a specific query type
    if (lowerPrompt.includes('police') || lowerPrompt.includes('station')) {
      return {
        content: `🚔 **Police Station Information**

**Emergency Contact:** 100 (24/7)

**To find your nearest police station:**
1. Provide your area/pincode
2. Or visit your city's police website
3. Use Google Maps: search "police station near me"

**Common Services:**
• FIR registration
• Lost property reports
• Verification certificates
• Emergency assistance

**Online Services:**
Many police departments now offer online:
• FIR filing
• Complaint tracking
• NOC applications

*What's your area/pincode? I can help you find the nearest station.*`,
        type: 'general',
        confidence: 0.85
      };
    }
    
    if (lowerPrompt.includes('hospital') || lowerPrompt.includes('medical') || lowerPrompt.includes('emergency')) {
      return {
        content: `🏥 **Medical & Hospital Information**

**Emergency Numbers:**
• Ambulance: 108 (Free Emergency)
• Private Ambulance: 1298
• Medical Emergency: 102

**Government Hospitals:**
Most cities have district hospitals offering:
• 24/7 emergency services
• Free/subsidized treatment
• Specialist consultation
• Diagnostic facilities

**Finding Nearest Hospital:**
1. Call 108 for immediate help
2. Use Google Maps: "hospital near me"
3. City health department helpline
4. Provide your area for specific recommendations

*Share your location/pincode for nearby hospital details.*`,
        type: 'general',
        confidence: 0.85
      };
    }
    
    if (lowerPrompt.includes('birth certificate') || lowerPrompt.includes('passport') || lowerPrompt.includes('document')) {
      return {
        content: `📄 **Document Services Guide**

**Birth Certificate:**
1. Visit local Municipal Corporation office
2. Required: Hospital birth record, parents' ID
3. Online: Most cities offer e-services portal
4. Time: 7-15 days
5. Fee: ₹50-200 (varies by city)

**Passport:**
1. Apply online: www.passportindia.gov.in
2. Book appointment at PSK
3. Required: Address proof, ID proof, birth certificate
4. Time: 30-45 days (normal), 7 days (tatkal)
5. Fee: ₹1,500 (normal), ₹3,500 (tatkal)

**General Documents:**
• Ration Card: Food & Civil Supplies dept
• Driving License: RTO office
• Voter ID: Election Commission office

*Which specific document do you need help with?*`,
        type: 'general',
        confidence: 0.9
      };
    }
    
    if (lowerPrompt.includes('emergency') || lowerPrompt.includes('helpline') || lowerPrompt.includes('number')) {
      return {
        content: `📞 **Emergency & Helpline Numbers**

**General Emergencies:**
• Police: 100
• Fire: 101
• Ambulance: 108
• Disaster Management: 1078

**Special Services:**
• Women Helpline: 1091
• Child Helpline: 1098
• Senior Citizen: 1291
• Road Accident: 1073

**Utilities:**
• Electricity: Check state board number
• Gas Leak: 1906
• Water Supply: Municipal helpline

**Government Services:**
• IVRS Citizen Services: 155300
• Railway Enquiry: 139
• Airlines: 1800-180-1407

**Mental Health:**
• NIMHANS: 080-46110007
• Vandrevala Foundation: 9999 666 555

*Save these numbers! Need specific department contact?*`,
        type: 'general',
        confidence: 0.95
      };
    }
    
    // Default responses by type
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

      general: `🏛️ **Civic Assistant - How Can I Help You?**

**I can help you find:**
• 🚔 **Police Stations**: Nearest police stations and emergency contacts
• 🏥 **Hospitals**: Government and private hospitals with emergency services  
• 🏢 **Government Offices**: Municipal offices, document centers, licensing
• 📮 **Post Offices**: Postal services and government forms
• 🚌 **Transport**: Bus stops, metro stations, auto stands
• 💡 **Utilities**: Electricity board, water authority, gas agencies

**Common Questions I Answer:**
• "Where is the nearest police station to [area]?"
• "How do I get a birth certificate in [city]?"
• "What are the helpline numbers for [service]?"
• "Where can I pay my property tax?"
• "How to file a complaint about [issue]?"

**Emergency Numbers:**
• Police: 100 | Fire: 101 | Ambulance: 108
• Women Helpline: 1091 | Child Helpline: 1098

**Tips:**
✅ Provide your area/pincode for location-specific help
✅ Ask about specific services you need
✅ I can also help with civic procedures and requirements

*What would you like to know about your city's services?*`
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