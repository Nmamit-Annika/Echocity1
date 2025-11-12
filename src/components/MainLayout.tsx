import React, { useState } from 'react';
import EchoChatbot from '@/components/EchoChatbot';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => setIsChatOpen(!isChatOpen);

  return (
    <div className="relative min-h-screen">
      {children}
      <EchoChatbot 
        isOpen={isChatOpen} 
        onToggle={toggleChat}
      />
    </div>
  );
};

export default MainLayout;