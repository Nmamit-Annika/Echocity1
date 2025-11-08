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
  Loader2
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
      content: 'Hi! I\'m your AI assistant for civic issues. I can help you:\n\n• Analyze community complaint patterns\n• Research similar issues online\n• Provide insights on trending civic problems\n• Suggest solutions based on other cities\n\nWhat would you like to know?',
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
      label: 'Analyze Current Trends',
      icon: TrendingUp,
      query: 'What are the most common complaint types in our community right now?',
      type: 'analysis' as const
    },
    {
      label: 'Research Online',
      icon: Search,
      query: 'Find recent news and discussions about civic issues similar to our community complaints',
      type: 'research' as const
    },
    {
      label: 'Best Practices',
      icon: Globe,
      query: 'What are some successful solutions other cities have implemented for similar civic issues?',
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
    setInput('');
    setIsLoading(true);

    try {
      const lowerQuery = input.toLowerCase();
      let response;

      if (lowerQuery.includes('trend') || lowerQuery.includes('analyz') || lowerQuery.includes('pattern')) {
        response = await geminiService.analyzeComplaints(complaints);
      } else if (lowerQuery.includes('research') || lowerQuery.includes('online') || lowerQuery.includes('web') || lowerQuery.includes('similar')) {
        response = await geminiService.researchSimilarIssues(input);
      } else {
        response = await geminiService.getGeneralResponse(input, { complaints });
      }
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        type: response.type
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get AI response');
      console.error('AI Error:', error);
    } finally {
      setIsLoading(false);
    }
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
          Community AI Assistant
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
            placeholder="Ask about civic trends, research solutions, or get insights..."
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