import React, { useState, useRef, useEffect } from 'react';
import { chatbotService, EchoChatMessage, PINCODE_DATA } from '@/services/chatbotService';
import { useSpeech } from '@/hooks/useSpeech';
import { useGeolocation } from '@/hooks/useGeolocation';
import { 
  ChatIcon, 
  CloseIcon, 
  MicIcon, 
  MicOffIcon, 
  SendIcon, 
  SoundOnIcon, 
  SpinnerIcon 
} from '@/components/ui/chat-icons';
import { useNavigate } from 'react-router-dom';

interface ChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
  onLocateMe?: () => void;
  onPincodeSearch?: (location: [number, number]) => void;
  onFileComplaint?: () => void;
}

const EchoChatbot: React.FC<ChatbotProps> = ({ 
  isOpen, 
  onToggle, 
  onLocateMe, 
  onPincodeSearch, 
  onFileComplaint 
}) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<EchoChatMessage[]>([
    { 
      id: 1, 
      text: "Hello! I'm Echo, your civic assistant. I can help you file complaints, find pincode information, get authority contacts, or answer questions about civic issues. How can I help you today?", 
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { location } = useGeolocation();
  const { isListening, startListening, speak } = useSpeech(setInput);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAction = async (action: any) => {
    try {
      switch (action.action) {
        case 'FILE_COMPLAINT':
          addBotMessage("Great! I'll open the complaint form for you. You can describe your issue, add photos, and select the location.");
          if (onFileComplaint) {
            onFileComplaint();
          } else {
            // Navigate to create complaint if no handler provided
            navigate('/app');
            setTimeout(() => {
              // This would trigger the create complaint dialog
              // You might need to add a way to trigger this from the parent
            }, 500);
          }
          break;

        case 'LOCATE_ME':
          addBotMessage("I'm requesting your location to help show nearby issues and relevant authorities.");
          if (onLocateMe) {
            onLocateMe();
          } else if (location) {
            addBotMessage(`I can see you're near coordinates ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}. This helps me provide more relevant assistance!`);
          } else {
            addBotMessage("Please allow location access in your browser so I can provide location-specific help.");
          }
          break;

        case 'PINCODE_SEARCH':
          const pincode = action.pincode;
          const data = PINCODE_DATA[pincode];
          if (data) {
            if (onPincodeSearch) {
              onPincodeSearch(data.location as [number, number]);
            }
            addBotMessage(`Here are the details for pincode ${pincode}:\n\n🏢 Office: ${data.officeName}\n📞 Contact: ${data.contact}\n🏙️ City: ${data.city}\n\nI've also centered the map on this area for you.`);
          } else {
            addBotMessage(`Sorry, I don't have information for pincode ${pincode} yet. I currently support major cities like Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Kolkata, and Pune.`);
          }
          break;

        case 'PINCODE_LOOKUP':
          const area = action.area;
          addBotMessage(`Let me look up the pincode for ${area}...`);
          const foundPincode = await chatbotService.getPincodeFromArea(area);
          addBotMessage(`The pincode for ${area} is likely ${foundPincode}. If you'd like authority details for this area, just send me the pincode!`);
          break;

        default:
          addBotMessage("I'm not sure how to handle that request, but I'm here to help with civic issues!");
      }
    } catch (error) {
      console.error('Action handling error:', error);
      addBotMessage("Sorry, I encountered an error while processing that request. Please try again.");
    }
  };

  const addBotMessage = (text: string) => {
    setMessages(prev => {
      const newMessages = prev.filter(m => !m.isTyping);
      return [...newMessages, { 
        id: Date.now(), 
        text, 
        sender: 'bot',
        timestamp: new Date()
      }];
    });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newUserMessage: EchoChatMessage = { 
      id: Date.now(), 
      text: input, 
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [
      ...prev, 
      newUserMessage, 
      { 
        id: Date.now() + 1, 
        text: '', 
        sender: 'bot', 
        isTyping: true,
        timestamp: new Date()
      }
    ]);

    setInput('');
    setIsLoading(true);

    try {
      const response = await chatbotService.getChatbotResponse(input, {
        currentLocation: location,
        supportedPincodes: chatbotService.getAllSupportedPincodes(),
        platform: 'EchoCity'
      });

      try {
        // Check if response is a structured JSON action
        const action = JSON.parse(response);
        handleAction(action);
      } catch (e) {
        // If not JSON, it's a regular text response
        addBotMessage(response);
      }
    } catch (error) {
      console.error('Chat error:', error);
      addBotMessage("I'm sorry, I'm having trouble right now. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 bg-primary text-primary-foreground rounded-full p-4 shadow-2xl transition-transform transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary/30 z-[1000]"
        aria-label="Toggle Echo Assistant"
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 lg:right-8 bg-background w-[calc(100%-3rem)] max-w-sm h-[60vh] max-h-[500px] shadow-2xl rounded-2xl flex flex-col z-[1000] transition-all duration-300 border border-border">
          {/* Header */}
          <div className="p-4 bg-primary text-primary-foreground rounded-t-2xl">
            <h3 className="font-bold text-lg">🤖 Echo Assistant</h3>
            <p className="text-sm opacity-90">Your civic companion</p>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-muted/20 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                {msg.isTyping ? (
                  <div className="bg-muted rounded-xl p-3 inline-block">
                    <SpinnerIcon className="w-4 h-4" />
                  </div>
                ) : (
                  <div className={`rounded-xl p-3 max-w-[85%] ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-background text-foreground shadow-sm border border-border'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    {msg.sender === 'bot' && (
                      <button 
                        onClick={() => speak(msg.text)} 
                        className="mt-2 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity"
                        title="Listen to response"
                      >
                        <SoundOnIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-border bg-background rounded-b-2xl flex items-center gap-2">
            <button 
              onClick={startListening} 
              disabled={isListening || isLoading} 
              className="p-2 text-muted-foreground hover:text-primary disabled:text-muted-foreground/50 transition-colors"
              title={isListening ? "Listening..." : "Voice input"}
            >
              {isListening ? <MicOffIcon className="w-4 h-4 text-red-500" /> : <MicIcon className="w-4 h-4" />}
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about civic issues..."
              className="flex-1 px-3 py-2 bg-transparent border-none focus:outline-none text-sm placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            
            <button 
              onClick={sendMessage} 
              disabled={isLoading || !input.trim()} 
              className="p-2 text-primary hover:text-primary/80 disabled:text-muted-foreground/50 transition-colors"
              title="Send message"
            >
              {isLoading ? <SpinnerIcon className="w-4 h-4" /> : <SendIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EchoChatbot;