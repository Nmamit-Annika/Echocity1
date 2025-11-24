import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  MapPin, 
  Globe, 
  Loader2,
  Map,
  Search as SearchIcon,
  AlertCircle,
  Info,
  Camera,
  Mic,
  X,
  Image as ImageIcon,
  FileText,
  Trash2
} from 'lucide-react';
import { sendMessageToGemini, GroundingChunk, LocationData } from '@/services/newGeminiService';
import { complaintExtractor } from '@/services/complaintExtractor';

const STORAGE_KEY = 'echocity_chat_history';
const MAX_STORED_MESSAGES = 50; // Limit to prevent localStorage overflow

const saveMessagesToStorage = (messages: ChatMessage[]) => {
  try {
    // Keep only the last MAX_STORED_MESSAGES
    const messagesToSave = messages.slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToSave));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
};

const loadMessagesFromStorage = (): ChatMessage[] | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load chat history:', error);
  }
  return null;
};

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'model';
  timestamp: number;
  isError?: boolean;
  groundingChunks?: GroundingChunk[];
  attachment?: {
    data: string;
    mimeType: string;
  };
  detectedComplaint?: {
    title: string;
    description: string;
    category: string;
    severity: string;
  };
}

interface GeminiChatbotProps {
  complaints?: any[];
  onFileComplaint?: (data: { title: string; description: string; category: string; imageData?: { data: string; mimeType: string } }) => void;
}

export function NewGeminiChatbot({ complaints = [], onFileComplaint }: GeminiChatbotProps) {
  const welcomeMessage: ChatMessage = {
    id: 'welcome',
    text: "Hello! I'm Echo, your Civic Assistant. I can help you find local government offices, parks, emergency services, and answer questions about civic issues or policies.\n\nYou can also **upload images** of civic issues like potholes or graffiti, and I'll help categorize them!\n\nTry asking: **\"Where is the nearest post office?\"** or upload a photo of a local issue.",
    sender: 'model',
    timestamp: Date.now()
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const savedMessages = loadMessagesFromStorage();
    return savedMessages && savedMessages.length > 0 ? savedMessages : [welcomeMessage];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const [useSearch, setUseSearch] = useState(true);
  const [useMaps, setUseMaps] = useState(true);
  const [model, setModel] = useState('gemini-2.5-flash');

  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech error:", event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    saveMessagesToStorage(messages);
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationError(null);
        },
        (error) => {
          console.warn("Location access denied:", error);
          setLocationError("Location access needed for nearby searches");
        }
      );
    } else {
      setLocationError("Geolocation not supported");
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: Date.now(),
      attachment: selectedImage ? { ...selectedImage } : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentImage = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Check if message contains a complaint
      const complaintCheck = await complaintExtractor.extractComplaint(
        userMsg.text,
        currentImage || undefined
      );

      const history = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await sendMessageToGemini({
        prompt: userMsg.text,
        model: model,
        history: history,
        useSearch: useSearch,
        useMaps: useMaps,
        location: location,
        image: currentImage
      });

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'model',
        timestamp: Date.now(),
        groundingChunks: response.groundingChunks,
        detectedComplaint: complaintCheck.isComplaint && complaintCheck.confidence > 0.7 ? {
          title: complaintCheck.title,
          description: complaintCheck.description,
          category: complaintCheck.category,
          severity: complaintCheck.severity
        } : undefined
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: 'model',
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all chat history?')) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome-' + Date.now(),
        text: "Hello! I'm Echo, your Civic Assistant. I can help you find local government offices, parks, emergency services, and answer questions about civic issues or policies.\n\nYou can also **upload images** of civic issues like potholes or graffiti, and I'll help categorize them!\n\nTry asking: **\"Where is the nearest post office?\"** or upload a photo of a local issue.",
        sender: 'model',
        timestamp: Date.now()
      };
      setMessages([welcomeMessage]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const renderGroundingSource = (chunk: GroundingChunk, index: number) => {
    if (chunk.web) {
      return (
        <a 
          key={`web-${index}`}
          href={chunk.web.uri}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs text-blue-800 transition-colors"
        >
          <Globe className="w-3 h-3 flex-shrink-0" />
          <span className="truncate max-w-[200px]">{chunk.web.title || chunk.web.uri}</span>
        </a>
      );
    }
    if (chunk.maps) {
      return (
        <a 
          key={`map-${index}`}
          href={chunk.maps.uri}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-xs text-green-800 transition-colors"
        >
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate max-w-[200px]">{chunk.maps.title || "View on Maps"}</span>
        </a>
      );
    }
    return null;
  };

  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.sender === 'user';

    return (
      <div key={msg.id} className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          
          <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1 ${
            isUser ? 'bg-indigo-600 ml-3' : 'bg-teal-600 mr-3'
          }`}>
            {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
          </div>

          <div className={`flex flex-col p-3 rounded-2xl shadow-sm ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
          }`}>
            {msg.attachment && (
              <div className="mb-3 rounded-lg overflow-hidden bg-black/5">
                <img 
                  src={`data:${msg.attachment.mimeType};base64,${msg.attachment.data}`}
                  alt="User upload" 
                  className="max-w-full h-auto max-h-60 object-cover"
                />
              </div>
            )}

            {msg.isError ? (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{msg.text}</span>
              </div>
            ) : (
              <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            )}

            {!isUser && msg.groundingChunks && msg.groundingChunks.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                  Sources & Locations
                </p>
                <div className="flex flex-wrap gap-2">
                  {msg.groundingChunks.map((chunk, idx) => renderGroundingSource(chunk, idx))}
                </div>
              </div>
            )}

            {!isUser && msg.detectedComplaint && onFileComplaint && (
              <div className="mt-3 pt-3 border-t border-amber-200 bg-amber-50/50 -mx-3 -mb-3 px-3 pb-3 rounded-b-2xl">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Complaint Detected
                </p>
                <p className="text-xs text-amber-800 mb-2">
                  <strong>{msg.detectedComplaint.title}</strong> ({msg.detectedComplaint.category})
                </p>
                <Button
                  size="sm"
                  onClick={() => onFileComplaint({
                    title: msg.detectedComplaint!.title,
                    description: msg.detectedComplaint!.description,
                    category: msg.detectedComplaint!.category,
                    imageData: messages.find(m => m.id === msg.id)?.attachment
                  })}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  File This Complaint
                </Button>
              </div>
            )}

            <span className={`text-[10px] mt-2 block opacity-60 ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="border-b bg-gradient-to-r from-teal-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 p-2 rounded-lg">
              <Bot className="text-white w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Echo - Civic Assistant</CardTitle>
              <p className="text-xs text-slate-500">Powered by Gemini with Maps & Search</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-full border border-slate-200">
              <div className={`w-2 h-2 rounded-full ${location ? 'bg-green-500' : 'bg-orange-400'}`}></div>
              <span className="text-[10px] text-slate-600 font-medium">
                {location ? 'Location' : 'No Location'}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {messages.map(msg => renderMessage(msg))}
          
          {isLoading && (
            <div className="flex w-full mb-4 justify-start animate-pulse">
              <div className="flex flex-row">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-teal-600 mr-3 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </ScrollArea>

        <div className="border-t p-4 bg-slate-50 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={useMaps ? "default" : "outline"}
                onClick={() => setUseMaps(!useMaps)}
                className="text-xs"
              >
                <Map className="w-3 h-3 mr-1" />
                Maps {useMaps ? 'On' : 'Off'}
              </Button>
              
              <Button
                size="sm"
                variant={useSearch ? "default" : "outline"}
                onClick={() => setUseSearch(!useSearch)}
                className="text-xs"
              >
                <SearchIcon className="w-3 h-3 mr-1" />
                Search {useSearch ? 'On' : 'Off'}
              </Button>

              <select 
                value={model} 
                onChange={(e) => setModel(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
              >
                <option value="gemini-2.5-flash">Flash (Fast)</option>
                <option value="gemini-3-pro-preview">Pro (Better)</option>
              </select>

              <Button
                size="sm"
                variant="outline"
                onClick={clearHistory}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Clear chat history"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>

            {locationError && (
              <Badge variant="outline" className="text-[10px] text-orange-600">
                <Info className="w-3 h-3 mr-1" />
                {locationError}
              </Badge>
            )}
          </div>

          {selectedImage && (
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
          )}

          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            
            <Button
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Upload image"
            >
              <Camera className="w-4 h-4" />
            </Button>

            <Button
              size="icon"
              variant={isListening ? "default" : "outline"}
              onClick={toggleListening}
              disabled={isLoading}
              title="Voice input"
            >
              <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
            </Button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about local civic issues, offices, or policies..."
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
            <Info className="w-3 h-3" />
            <p>AI can make mistakes. Verify important civic information with official sources.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
