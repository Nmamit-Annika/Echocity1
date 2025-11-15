import { useState, useEffect, useRef } from 'react';

// Enhanced Speech Recognition with better browser support
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useEnhancedSpeech = (onResult: (transcript: string) => void) => {
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
      recognition.lang = 'en-IN'; // Better for Indian English

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };
    }
  }, [onResult]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const speak = (text: string, lang = 'en-US') => {
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.error('Speech synthesis error', e);
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  return { isListening, isSpeaking, isSupported, startListening, stopListening, speak };
};