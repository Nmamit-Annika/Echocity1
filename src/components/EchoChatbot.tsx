import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToGemini, LocationData } from '@/services/newGeminiService';
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
import { Camera, Trash2, X, Image as ImageIcon, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const STORAGE_KEY = 'echo_corner_chat_history';
const MAX_STORED_MESSAGES = 30;

const loadMessagesFromStorage = (): ChatMessage[] | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  } catch (error) {
    console.error('Failed to load messages:', error);
    return null;
  }
};

const saveMessagesToStorage = (messages: ChatMessage[]) => {
  try {
    const toStore = messages.slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.error('Failed to save messages:', error);
  }
};

interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isTyping?: boolean;
  groundingChunks?: any[];
  attachment?: {
    data: string;
    mimeType: string;
  };
}

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
  
  const welcomeMessage: ChatMessage = { 
    id: 1, 
    text: "Hello! I'm Echo, your civic assistant with access to real-time Maps and Search. I can help you:\n\n• Find nearby government offices, police stations, hospitals\n• Get pincode information and authority contacts\n• Answer questions about civic procedures\n• File complaints about local issues\n\nHow can I help you today?", 
    sender: 'bot',
    timestamp: new Date()
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const savedMessages = loadMessagesFromStorage();
    return savedMessages && savedMessages.length > 0 ? savedMessages : [welcomeMessage];
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const [useMaps, setUseMaps] = useState(true);
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [model, setModel] = useState('gemini-2.5-flash');
  const [showSettings, setShowSettings] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { location } = useGeolocation();
  const { isListening, startListening, speak } = useSpeech(setInput);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    saveMessagesToStorage(messages);
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      setSelectedImage({
        data: base64Data,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const clearHistory = () => {
    if (confirm('Clear all chat history?')) {
      const welcomeMsg: ChatMessage = {
        id: Date.now(),
        text: "Hello! I'm Echo, your civic assistant. How can I help you today?",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([welcomeMsg]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

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
    if (!input.trim() && !selectedImage) return;

    const newUserMessage: ChatMessage = { 
      id: Date.now(), 
      text: input || '📷 [Image]', 
      sender: 'user',
      timestamp: new Date(),
      attachment: selectedImage || undefined
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
    const currentImage = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const geoLocation: LocationData | null = location ? {
        latitude: location.latitude,
        longitude: location.longitude
      } : null;

      const response = await sendMessageToGemini({
        prompt: newUserMessage.text,
        model: model,
        history: history,
        useSearch: useSearch,
        useMaps: useMaps,
        location: geoLocation,
        image: currentImage || undefined
      });

      setMessages(prev => {
        const newMessages = prev.filter(m => !m.isTyping);
        return [...newMessages, { 
          id: Date.now(), 
          text: response.text, 
          sender: 'bot',
          timestamp: new Date(),
          groundingChunks: response.groundingChunks
        }];
      });
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
          <div className="p-3 bg-primary text-primary-foreground rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">🤖 Echo Assistant</h3>
                <p className="text-xs opacity-90">Your civic companion</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1.5 hover:bg-primary-foreground/10 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={clearHistory}
                  className="p-1.5 hover:bg-primary-foreground/10 rounded-lg transition-colors"
                  title="Clear history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Settings Panel */}
            {showSettings && (
              <div className="mt-3 pt-3 border-t border-primary-foreground/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Model:</span>
                  <select 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="bg-primary-foreground/10 text-primary-foreground border-none rounded px-2 py-1 text-xs"
                  >
                    <option value="gemini-2.5-flash">Flash (Fast)</option>
                    <option value="gemini-3-pro-preview">Pro (Better)</option>
                  </select>
                </div>
                <div className="flex gap-2 text-xs">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={useSearch}
                      onChange={(e) => setUseSearch(e.target.checked)}
                      className="rounded"
                    />
                    Search
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={useMaps}
                      onChange={(e) => setUseMaps(e.target.checked)}
                      className="rounded"
                    />
                    Maps
                  </label>
                </div>
              </div>
            )}
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
                    {msg.attachment && (
                      <div className="mb-2 rounded-lg overflow-hidden bg-black/5">
                        <img 
                          src={`data:${msg.attachment.mimeType};base64,${msg.attachment.data}`}
                          alt="Attachment" 
                          className="max-w-full h-auto max-h-40 object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="text-sm prose prose-sm max-w-none">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                    
                    {/* Grounding Sources */}
                    {msg.sender === 'bot' && msg.groundingChunks && msg.groundingChunks.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-[9px] uppercase text-muted-foreground mb-1">Sources</p>
                        <div className="flex flex-wrap gap-1">
                          {msg.groundingChunks.map((chunk: any, idx: number) => {
                            if (chunk.web) {
                              return (
                                <a 
                                  key={`web-${idx}`}
                                  href={chunk.web.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded truncate max-w-[120px]"
                                  title={chunk.web.title}
                                >
                                  🌐 {chunk.web.title?.substring(0, 15) || 'Link'}
                                </a>
                              );
                            }
                            if (chunk.maps) {
                              return (
                                <a 
                                  key={`map-${idx}`}
                                  href={chunk.maps.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded truncate max-w-[120px]"
                                  title={chunk.maps.title}
                                >
                                  📍 {chunk.maps.title?.substring(0, 15) || 'Maps'}
                                </a>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    )}
                    
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
          <div className="border-t border-border bg-background rounded-b-2xl">
            {selectedImage && (
              <div className="p-2 border-b border-border">
                <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-800 flex-1">Image attached</span>
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            <div className="p-3 flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="p-2 text-muted-foreground hover:text-primary disabled:text-muted-foreground/50 transition-colors"
                title="Upload image"
              >
                <Camera className="w-4 h-4" />
              </button>
            
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
                disabled={isLoading || (!input.trim() && !selectedImage)} 
                className="p-2 text-primary hover:text-primary/80 disabled:text-muted-foreground/50 transition-colors"
                title="Send message"
              >
                {isLoading ? <SpinnerIcon className="w-4 h-4" /> : <SendIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EchoChatbot;