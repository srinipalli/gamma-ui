import React, { useState } from 'react';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import Chatbot from './chatbot';

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const minimizeChatbot = () => setIsMinimized(true);
  const restoreChatbot = () => setIsMinimized(false);

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={toggleChatbot}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 z-50"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            !
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl z-50 transition-all duration-300 ${
          isMinimized ? 'w-80 h-12' : 'w-96 h-[500px]'
        }`}>
          {/* Chat Header */}
          <div className="bg-blue-600 text-white p-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Infrastructure Assistant</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={isMinimized ? restoreChatbot : minimizeChatbot}
                className="hover:bg-blue-700 p-1 rounded"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={toggleChatbot}
                className="hover:bg-blue-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Chat Content */}
          {!isMinimized && (
            <div className="h-[calc(100%-48px)]">
              <Chatbot />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;
