import React, { useState, useEffect, useRef } from 'react';
import { logAPI } from '../api/client';
import { getGlobalServerName } from '../utils/serverNameMapping';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);

  // Fetch chat history (excluding system prompts)
  useEffect(() => {
    loadChatHistory();
    // Show suggestions on reload
    setShowSuggestions(true);
  }, []);

  useEffect(() => {
    scrollToBottom();
    setShowSuggestions(messages.length === 0);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatHistory = async () => {
    try {
      // Backend now returns only user/bot messages (system prompts stored separately)
      const history = await logAPI.getChatHistory(20);
      setMessages(history);
      setShowSuggestions(history.length === 0);
    } catch (error) {
      setMessages([]);
      setShowSuggestions(true);
      console.error('Failed to load chat history:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const response = await logAPI.sendChatMessage(inputMessage);
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.response,
        context: response.context,
        timestamp: response.timestamp
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setError('Failed to get response. Please try again.');
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Render server names using the global mapping
  const renderServerName = (server, environment) => getGlobalServerName(server, environment);

  const MessageBubble = ({ message }) => {
    const isUser = message.type === 'user';
    const isError = message.type === 'error';
    // If context contains server/environment, map name
    let contextInfo = null;
    if (message.context && message.context.infrastructure_data?.recent_metrics) {
      contextInfo = message.context.infrastructure_data.recent_metrics.map((m, i) => (
        <div key={i} className="text-xs">
          <b>Server:</b> {renderServerName(m.server, m.environment)} | <b>CPU:</b> {m.cpu}% | <b>Mem:</b> {m.memory}% | <b>Status:</b> {m.status}
        </div>
      ));
    }
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : isError 
            ? 'bg-red-100 text-red-800 border border-red-300'
            : 'bg-gray-100 text-gray-800'
        }`}>
          <div className="text-sm">{message.content}</div>
          {contextInfo && (
            <div className="mt-2 text-xs opacity-75">
              <details>
                <summary className="cursor-pointer">View Context Data</summary>
                <div className="mt-1 text-xs bg-gray-800 text-green-400 p-2 rounded overflow-auto">
                  {contextInfo}
                </div>
              </details>
            </div>
          )}
          <div className="text-xs opacity-75 mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  const suggestions = [
    "How is server 1 performing?",
    "Show me error logs from Production",
    "What's the status of app1 in Staging?",
    "Are there any critical issues today?",
    "Show server metrics for the last hour"
  ];

  const SuggestedQueries = () => (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-600 mb-2">Suggested queries:</h3>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => setInputMessage(suggestion)}
            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-bold">Infrastructure Assistant</h2>
        <p className="text-blue-100 text-sm">Ask me about your servers, logs, and system performance</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && showSuggestions ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-4xl mb-4">💬</div>
            <p>Welcome! Ask me anything about your infrastructure.</p>
            <SuggestedQueries />
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about your infrastructure..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;
