import React from 'react';

export const ChatIcon: React.FC<{className?: string}> = ({ className = "w-6 h-6"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

export const CloseIcon: React.FC<{className?: string}> = ({ className = "w-6 h-6"}) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const SendIcon: React.FC<{className?: string}> = ({ className = "w-6 h-6"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

export const MicIcon: React.FC<{className?: string}> = ({ className = "w-6 h-6"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M9 11V5a3 3 0 016 0v6a3 3 0 01-6 0z" />
    </svg>
);

export const MicOffIcon: React.FC<{className?: string}> = ({ className = "w-6 h-6"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.084A7.952 7.952 0 0112 5c1.693 0 3.23.593 4.416 1.584M11 10.916V11a3 3 0 006 0v-1.084m-6 0a3 3 0 00-3-3.084M15 11V5a3 3 0 00-6 0v6m0 0v4m0 0H8m4 0h4m-4-8a3 3 0 00-3 3v.084M9 14.158A7.96 7.96 0 0112 15a7.962 7.962 0 013-1.842m-6 0M3 3l18 18" />
    </svg>
);

export const SoundOnIcon: React.FC<{className?: string}> = ({ className = "w-5 h-5"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);

export const SpinnerIcon: React.FC<{className?: string}> = ({ className = "w-5 h-5 animate-spin"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v3m0 12v3m9-9h-3M6 12H3m16.5-6.5L18 7.5M9 18l-1.5 1.5M18 16.5l-1.5-1.5M9 6L7.5 7.5" />
    </svg>
);