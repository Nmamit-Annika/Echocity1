import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  Search, 
  TrendingUp, 
  Globe,
  Loader2,
  MapPin,
  Phone,
  Building
} from 'lucide-react';
import { toast } from 'sonner';
import { geminiService } from '@/services/geminiService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'analysis' | 'research' | 'general';
}

interface GeminiChatbotProps {
  complaints?: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    categories: { name: string };
    address: string;
    created_at: string;
  }>;
}

export function GeminiChatbot({ complaints = [] }: GeminiChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Hi! I\'m Echo, your comprehensive civic assistant. I can help you with:\n\n🏛️ **Citizen Services:**\n• Find nearest police stations, hospitals, government offices\n• Emergency contacts and helpline numbers\n• Government service procedures and requirements\n\n📊 **Community Insights:**\n• Analyze complaint patterns and trends\n• Research solutions from other cities\n• Best practices for civic engagement\n\n📍 **Local Information:**\n• Pincode lookup and area information\n• Authority contacts and office hours\n• Document requirements and procedures\n\n💬 **Just ask me anything like:**\n"Where is the nearest police station?"\n"How do I get a birth certificate?"\n"What are the emergency numbers?"\n\nHow can I help you today?',
      timestamp: new Date(),
      type: 'general'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const quickActions = [
    {
      label: 'Find Police Station',
      icon: MapPin,
      query: 'Where is the nearest police station to my area?',
      type: 'general' as const
    },
    {
      label: 'Emergency Numbers',
      icon: Phone,
      query: 'What are the emergency helpline numbers I should know?',
      type: 'general' as const
    },
    {
      label: 'Government Services',
      icon: Building,
      query: 'How do I get a birth certificate or passport?',
      type: 'general' as const
    },
    {
      label: 'Pincode Lookup',
      icon: Search,
      query: 'What is the pincode for [your area name]?',
      type: 'general' as const
    },
    {
      label: 'Analyze Trends',
      icon: TrendingUp,
      query: 'What are the most common complaint types in our community?',
      type: 'analysis' as const
    },
    {
      label: 'Research Solutions',
      icon: Globe,
      query: 'What are successful solutions other cities have implemented?',
      type: 'research' as const
    }
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const lowerQuery = currentInput.toLowerCase();
      let response;

      // Enhanced action detection (inspired by Echo2)
      let responseText = '';

      // Check for pincode queries
      const pincodeMatch = currentInput.match(/\b(\d{6})\b/);
      if (pincodeMatch) {
        const pincode = pincodeMatch[1];
        // Use pincode data from Echo2's constants
        const pincodeData = await import('@/external/echo2/constants').then(module => {
          return module.PINCODE_DATA?.[pincode];
        }).catch(() => null);
        
        if (pincodeData) {
          responseText = `📍 **Pincode ${pincode} Information:**\n\n🏢 **Office:** ${pincodeData.officeName}\n📞 **Contact:** ${pincodeData.contact}\n🗺️ **Location:** ${pincodeData.location[0]}, ${pincodeData.location[1]}`;
        } else {
          responseText = `Sorry, I don't have information for pincode ${pincode} yet. Please try a major city pincode like:\n• 110001 (Delhi)\n• 400001 (Mumbai)\n• 560001 (Bangalore)\n• 600001 (Chennai)`;
        }
      }
      // Check for area to pincode lookup
      else if (lowerQuery.includes('pincode') && (lowerQuery.includes('for') || lowerQuery.includes('of'))) {
        const areaMatch = currentInput.match(/(?:pincode.*?(?:for|of)\s+)([\w\s]+)/i);
        if (areaMatch) {
          const area = areaMatch[1].trim();
          responseText = `🔍 Looking up pincode for **${area}**...\n\nFor accurate pincode information, I recommend:\n• Visit India Post website\n• Use Google Maps for exact pincode\n• Contact local post office\n\nCommon areas:\n• Mumbai Central: 400008\n• Delhi CP: 110001\n• Bangalore MG Road: 560001\n• Chennai Central: 600001`;
        }
      }
      // Regular analysis and research queries
      else if (lowerQuery.includes('trend') || lowerQuery.includes('analyz') || lowerQuery.includes('pattern')) {
        response = await geminiService.analyzeComplaints(complaints);
        responseText = response.content;
      } else if (lowerQuery.includes('research') || lowerQuery.includes('online') || lowerQuery.includes('web') || lowerQuery.includes('similar')) {
        response = await geminiService.researchSimilarIssues(currentInput);
        responseText = response.content;
      } else {
        response = await geminiService.getGeneralResponse(currentInput, { complaints });
        responseText = response.content;
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        type: response?.type || 'general'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get AI response');
      console.error('AI Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setInput(action.query);
    handleSend();
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Echo - Civic Assistant
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-xs">
            Powered by AI
          </Badge>
          <Badge variant="outline" className="text-xs">
            {complaints.length} reports analyzed
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(action)}
              className="justify-start text-left h-auto p-2"
            >
              <action.icon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>

        {/* Chat Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'flex-row-reverse'
                      : 'flex-row'
                  }`}
                >
                  <div
                    className={`p-2 rounded-full flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.type && message.type !== 'general' && (
                        <Badge variant="outline" className="text-xs">
                          {message.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="p-2 rounded-full bg-muted text-muted-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about civic services, emergencies, government offices, or community trends..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}