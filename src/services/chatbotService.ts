// Enhanced Chatbot Service - Integrates with existing Gemini service
import { geminiService } from '@/services/geminiService';

export interface EchoChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatAction {
  action: string;
  pincode?: string;
  area?: string;
  data?: any;
}

// Enhanced pincode data for major Indian cities
const PINCODE_DATA: Record<string, {
  officeName: string;
  contact: string;
  location: [number, number];
  city: string;
}> = {
  "110001": {
    officeName: "New Delhi Municipal Corporation",
    contact: "011-23456789",
    location: [28.6330, 77.2193],
    city: "New Delhi"
  },
  "400001": {
    officeName: "Mumbai Municipal Corporation",
    contact: "022-22694725",
    location: [18.9300, 72.8200],
    city: "Mumbai"
  },
  "560001": {
    officeName: "Bruhat Bengaluru Mahanagara Palike",
    contact: "080-22975732",
    location: [12.9716, 77.5946],
    city: "Bangalore"
  },
  "600001": {
    officeName: "Greater Chennai Corporation",
    contact: "044-25619021",
    location: [13.0827, 80.2707],
    city: "Chennai"
  },
  "500001": {
    officeName: "Greater Hyderabad Municipal Corporation",
    contact: "040-23434910",
    location: [17.3850, 78.4867],
    city: "Hyderabad"
  },
  "700001": {
    officeName: "Kolkata Municipal Corporation",
    contact: "033-22862345",
    location: [22.5726, 88.3639],
    city: "Kolkata"
  },
  "411001": {
    officeName: "Pune Municipal Corporation",
    contact: "020-26123456",
    location: [18.5204, 73.8567],
    city: "Pune"
  }
};

class ChatbotService {
  private chat: any = null;

  async initializeChat() {
    if (this.chat) return this.chat;

    // Use a simpler approach since we already have geminiService
    this.chat = {
      isInitialized: true
    };
    
    return this.chat;
  }

  async getChatbotResponse(message: string, context?: any): Promise<string> {
    try {
      await this.initializeChat();

      // First try to detect special actions
      const actionResponse = this.detectActions(message);
      if (actionResponse) {
        return JSON.stringify(actionResponse);
      }

      // For general conversation, use the existing gemini service
      const prompt = this.buildChatPrompt(message, context);
      
      try {
        const response = await geminiService.getGeneralResponse(prompt, context);
        return this.formatChatResponse(response.content);
      } catch (error) {
        console.error('Gemini service error:', error);
        return this.getFallbackResponse(message);
      }

    } catch (error) {
      console.error('Chatbot service error:', error);
      return "I'm sorry, I'm having trouble right now. Please try again in a moment.";
    }
  }

  private detectActions(message: string): ChatAction | null {
    const lowerMessage = message.toLowerCase();

    // File complaint action
    if (lowerMessage.includes('file a complaint') || 
        lowerMessage.includes('report issue') || 
        lowerMessage.includes('submit complaint')) {
      return { action: 'FILE_COMPLAINT' };
    }

    // Location action
    if (lowerMessage.includes('current location') || 
        lowerMessage.includes('locate me') || 
        lowerMessage.includes('my location')) {
      return { action: 'LOCATE_ME' };
    }

    // Pincode search
    const pincodeMatch = lowerMessage.match(/\b(\d{6})\b/);
    if (pincodeMatch) {
      return { 
        action: 'PINCODE_SEARCH', 
        pincode: pincodeMatch[1] 
      };
    }

    // Area pincode lookup
    if (lowerMessage.includes('pincode for') || 
        lowerMessage.includes('pincode of')) {
      const areaMatch = message.match(/(?:pincode (?:for|of) )(.+)/i);
      if (areaMatch) {
        return { 
          action: 'PINCODE_LOOKUP', 
          area: areaMatch[1].trim() 
        };
      }
    }

    return null;
  }

  private buildChatPrompt(message: string, context?: any): string {
    const contextInfo = context ? JSON.stringify(context, null, 2) : 'No additional context';
    
    return `You are 'Echo', a friendly and helpful AI assistant for EchoCity, a civic issue reporting platform in India. 
    Your personality is polite, empathetic, and professional. You are fluent in both English and Hinglish (a mix of Hindi and English).

    User message: ${message}
    Context: ${contextInfo}

    Your capabilities:
    1. Help citizens file civic complaints
    2. Provide information about municipal services
    3. Guide users on using the EchoCity platform
    4. Answer questions about civic issues and processes
    5. Provide support in both English and Hinglish

    Please provide a helpful, empathetic response that assists the user with their civic needs. Keep responses concise but informative.`;
  }

  private formatChatResponse(content: string): string {
    // Clean up the response to make it more chat-friendly
    return content
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
      .replace(/\*(.*?)\*/g, '$1')     // Remove markdown italic
      .replace(/#{1,6}\s/g, '')        // Remove markdown headers
      .replace(/•/g, '•')              // Keep bullet points
      .trim();
  }

  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm Echo, your civic assistant. I can help you file complaints, find local authority details, or answer questions about civic issues. How can I help you today?";
    }

    if (lowerMessage.includes('help')) {
      return "I can help you with:\n\n• Filing civic complaints\n• Finding pincode information\n• Getting local authority contacts\n• Understanding how to use EchoCity\n• General civic assistance\n\nWhat would you like to know?";
    }

    if (lowerMessage.includes('complaint') || lowerMessage.includes('issue')) {
      return "To file a complaint, click on 'Create Complaint' on the main page. You can describe the issue, add photos, and select the location. I can guide you through the process if needed!";
    }

    return "I understand you're asking about civic matters. While I'm having trouble accessing my full capabilities right now, I'm here to help with any questions about filing complaints, finding authority contacts, or using the EchoCity platform. Please feel free to ask me anything!";
  }

  async getPincodeFromArea(area: string): Promise<string> {
    try {
      const prompt = `What is the 6-digit pincode for ${area} in India? Please provide only the 6-digit number.`;
      const response = await geminiService.getGeneralResponse(prompt);
      const pincode = response.content.match(/\d{6}/);
      return pincode ? pincode[0] : "Pincode not found.";
    } catch (error) {
      console.error("Error fetching pincode:", error);
      return "Could not fetch pincode.";
    }
  }

  getPincodeData(pincode: string) {
    return PINCODE_DATA[pincode] || null;
  }

  getAllSupportedPincodes() {
    return Object.keys(PINCODE_DATA);
  }
}

// Export singleton instance
export const chatbotService = new ChatbotService();
export { PINCODE_DATA };