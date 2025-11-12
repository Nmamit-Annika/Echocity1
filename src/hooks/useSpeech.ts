import { useState, useEffect, useRef } from 'react';

// The global `webkitSpeechRecognition` is not in standard TS libs
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useSpeech = (onResult: (transcript: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSpeechSupported = !!SpeechRecognition && !!window.speechSynthesis;
    setIsSupported(isSpeechSupported);

    if (isSpeechSupported) {
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };
    }
    
    // Cleanup
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        window.speechSynthesis.cancel();
    }
  }, [onResult]);

  const startListening = () => {
    if (isSupported && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (isSupported && isListening) {
      recognitionRef.current.stop();
    }
  };

  const speak = (text: string, lang: 'en-US' | 'hi-IN' = 'en-US') => {
    if (isSupported && !isSpeaking) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.error('Speech synthesis error', e);
        setIsSpeaking(false);
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  return { isListening, isSpeaking, isSupported, startListening, stopListening, speak };
};