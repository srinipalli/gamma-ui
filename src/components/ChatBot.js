"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { MessageCircle, Maximize2, Minimize2, Send, X, Grip } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { api } from "../api/client"

const ChatBot = ({ selectedEnvironment, selectedApp, isDarkMode }) => {
  // Core chat states
  const [showChatBot, setShowChatBot] = useState(false)
  const [isChatMaximized, setIsChatMaximized] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: "bot",
      content: "Hello! I'm your infrastructure monitoring assistant. How can I help you today?",
      timestamp: new Date().toISOString()
    },
  ])
  const [chatInput, setChatInput] = useState("")
  const [showContextModal, setShowContextModal] = useState(false)
  const [selectedContext, setSelectedContext] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Resizable chat states
  const [chatSize, setChatSize] = useState({ width: 550, height: 700 })
  const [isResizing, setIsResizing] = useState(false)

  // Refs
  const chatRef = useRef(null)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  const suggestedQuestions = [
    "How is the development environment performing?",
    "What are the major issues in the system?",
    "Show me the latest alerts",
    "Any predicted server failures?",
    "What is the current network status?",
    "Show me error logs from production",
    "What servers are at risk?",
    "Check database performance metrics",
    "Show me CPU and memory usage trends"
  ]

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const history = await api.getChatHistory()

        if (history.length > 1) {
          setChatMessages(history)

          const userMessages = history.filter(msg => msg.type === "user")

          if (userMessages.length > 0) {
            setHasUserInteracted(true)
          }
        }
        setChatHistory(history)
        setIsInitialLoad(false)

      } catch (error) {
        console.error("Failed to load chat history:", error)
        setIsInitialLoad(false)
      }
    }

    if (isInitialLoad) {
      loadChatHistory()
    }
  }, [isInitialLoad])

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      requestAnimationFrame(() => {
        const container = messagesContainerRef.current
        container.scrollTop = container.scrollHeight

        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "nearest"
        })
      })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, isLoading, scrollToBottom])

  useEffect(() => {
    if (showChatBot) {
      setTimeout(scrollToBottom, 300)
    }
  }, [showChatBot, scrollToBottom])

  const handleResizeStart = useCallback((e) => {
    if (!chatRef.current) return

    e.preventDefault()
    e.stopPropagation()

    setIsResizing(true)

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = chatSize.width
    const startHeight = chatSize.height

    const handleMouseMove = (moveEvent) => {
      const deltaX = startX - moveEvent.clientX
      const deltaY = startY - moveEvent.clientY

      const newWidth = Math.max(320, Math.min(800, startWidth + deltaX))
      const newHeight = Math.max(400, Math.min(800, startHeight + deltaY))

      setChatSize({ width: newWidth, height: newHeight })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'nw-resize'
  }, [chatSize])

  const handleChatOpen = () => {
    setShowChatBot(true)
    setShowSuggestions(true)
    setTimeout(scrollToBottom, 400)
  }

  const handleSuggestionClick = (question) => {
    setChatInput(question)
    setHasUserInteracted(true)
    setShowSuggestions(false)

    setTimeout(() => {
      handleSendMessage(question)
    }, 100)
  }

  const handleSendMessage = async (messageText = null) => {
    const textToSend = messageText || chatInput.trim()

    if (textToSend) {
      setHasUserInteracted(true)
      setShowSuggestions(false)

      const newMessage = {
        id: Date.now(),
        type: "user",
        content: textToSend,
        timestamp: new Date().toISOString()
      }

      setChatMessages((prev) => [...prev, newMessage])
      setChatInput("")
      setIsLoading(true)

      try {
        const response = await api.sendChatMessage(textToSend, {
          environment: selectedEnvironment,
          application: selectedApp,
          timestamp: new Date().toISOString()
        })

        const botResponse = {
          id: Date.now() + 1,
          type: "bot",
          content: response.response,
          context: response.context,
          timestamp: response.timestamp,
          has_context: response.context && Object.keys(response.context).length > 0
        }

        setChatMessages((prev) => [...prev, botResponse])

        const updatedHistory = await api.getChatHistory()
        setChatHistory(updatedHistory)

      } catch (error) {
        console.error("Chat API error:", error)
        const errorResponse = {
          id: Date.now() + 1,
          type: "bot",
          content: "I'm having trouble connecting to the server. Please try again in a moment.",
          timestamp: new Date().toISOString()
        }
        setChatMessages((prev) => [...prev, errorResponse])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleViewContext = async (messageId) => {
    try {
      const contextData = await api.getChatContext(messageId)
      setSelectedContext(contextData)
      setShowContextModal(true)
    } catch (error) {
      console.error("Failed to load context:", error)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearChat = async () => {
    try {
      await api.clearChatHistory()
      setChatMessages([
        {
          id: 1,
          type: "bot",
          content: "Hello! I'm your infrastructure monitoring assistant. How can I help you today?",
          timestamp: new Date().toISOString()
        }
      ])
      setChatHistory([])
      setHasUserInteracted(false)
      setShowSuggestions(true)
    } catch (error) {
      console.error("Failed to clear chat history:", error)
    }
  }

  const handleShowSuggestions = () => {
    setShowSuggestions(true)
  }

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!showChatBot && (
          <button
            onClick={handleChatOpen}
            className="group relative w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            <MessageCircle className="w-7 h-7 mx-auto" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              InnoWatch Assistant
            </div>
          </button>
        )}

        {/* Chat Window */}
        {showChatBot && (
          <div
            ref={chatRef}
            className={`transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-sm flex flex-col ${
              isChatMaximized
                ? "fixed inset-4 w-auto h-auto"
                : "relative"
            } ${isDarkMode ? "bg-gray-900/95 border border-gray-700" : "bg-white/95 border border-gray-200"}`}
            style={!isChatMaximized ? {
              width: `${chatSize.width}px`,
              height: `${chatSize.height}px`,
              minWidth: '320px',
              minHeight: '400px'
            } : {}}
          >
            {/* Resize Handle */}
            {!isChatMaximized && (
              <div
                className="absolute top-2 left-2 cursor-nw-resize p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors z-20 group"
                onMouseDown={handleResizeStart}
                title="Drag to resize"
              >
                <Grip className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              </div>
            )}

            {/* Header */}
            <div className={`flex-shrink-0 p-4 border-b flex items-center justify-between ${
              isDarkMode
                ? "bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600 text-white" // Added text-white for dark mode
                : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            }`}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative flex-shrink-0">
                  <MessageCircle className="w-6 h-6" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-lg leading-tight truncate ">AI Assistant</h3>
                  <p className="text-xs opacity-80 leading-tight truncate">Infrastructure Monitoring</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!showSuggestions && (
                  <button
                    onClick={handleShowSuggestions}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors text-xs"
                    title="Show Suggestions"
                  >
                    💡
                  </button>
                )}
                <button
                  onClick={handleClearChat}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors text-xs"
                  title="Clear Chat"
                >
                  Clear Chat
                </button>
                <button
                  onClick={() => setIsChatMaximized(!isChatMaximized)}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  title={isChatMaximized ? "Minimize" : "Maximize"}
                >
                  {isChatMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setShowChatBot(false)
                    setIsChatMaximized(false)
                  }}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(to bottom, rgba(17, 24, 39, 0.7), rgba(31, 41, 55, 0.7))' // Slightly adjusted opacity
                  : 'linear-gradient(to bottom, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 0.8))'
              }}
            >
              {/* Chat Messages */}
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${msg.type === "user" ? "order-2" : "order-1"}`}>
                    <div className={`flex items-end gap-3 ${msg.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        msg.type === "user"
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                          : "bg-gradient-to-r from-green-500 to-teal-500 text-white"
                      }`}>
                        {msg.type === "user" ? "U" : "AI"}
                      </div>

                      <div className={`relative px-4 py-3 rounded-2xl shadow-lg max-w-full ${
                        msg.type === "user"
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-sm"
                          : isDarkMode
                            ? "bg-gray-700 text-gray-100 rounded-bl-sm border border-gray-600" // Added border for clarity
                            : "bg-white text-gray-800 rounded-bl-sm border border-gray-200" // Added border for clarity
                      }`}>
                        <div className="text-sm leading-relaxed break-words">
                          {msg.type === "bot" ? (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <p className="mb-2 last:mb-0 text-inherit">{children}</p>,
                                  code: ({ children }) => <code className="bg-gray-800 text-gray-50 px-1 py-0.5 rounded text-xs">{children}</code>, // Dark mode code bg
                                  pre: ({ children }) => <pre className="bg-gray-800 text-gray-50 p-2 rounded text-xs overflow-x-auto">{children}</pre>, // Dark mode pre bg
                                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                  li: ({ children }) => <li className="text-inherit">{children}</li>,
                                  strong: ({ children }) => <strong className="font-semibold text-inherit">{children}</strong>
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            msg.content
                          )}
                        </div>

                        {msg.type === "bot" && msg.has_context && (
                          <button
                            onClick={() => handleViewContext(msg.id)}
                            className="mt-2 text-xs text-blue-300 hover:text-blue-200 flex items-center gap-1 transition-colors" // Adjusted text color for dark mode
                          >
                            <span>📊</span> View Context
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={`text-xs text-gray-500 mt-2 px-11 ${msg.type === "user" ? "text-right" : "text-left"}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading Animation */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-end gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 text-white flex items-center justify-center text-xs font-bold">
                      AI
                    </div>
                    <div className="bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-sm border border-gray-600"> {/* Dark mode background and border */}
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {showSuggestions && (
                <div className="mt-6 space-y-4">
                  <div className="text-center">
                    <h4 className={`text-sm font-medium mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {hasUserInteracted
                        ? "💬 Continue the conversation with these suggestions:"
                        : "💡 Try asking me about:"
                      }
                    </h4>
                  </div>
                  <div className="grid gap-2">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(question)}
                        className={`w-full text-left p-3 rounded-xl border transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
                          isDarkMode
                            ? "bg-gray-800/60 border-gray-600 text-gray-200 hover:bg-gray-700/70 hover:border-blue-600" // Darker bg, clearer hover border
                            : "bg-white/80 border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-blue-500 text-lg flex-shrink-0"></span>
                          <span className="text-sm font-medium">{question}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className={`text-center text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {hasUserInteracted
                      ? "Click any suggestion above or type a new message below."
                      : "Click any question above or type your own below"
                    }
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={`flex-shrink-0 p-4 border-t ${isDarkMode ? "border-gray-700 bg-gray-800/70" : "border-gray-200 bg-gray-50/50"}`}> {/* Darker bg for input area */}
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about your infrastructure..."
                    className={`w-full px-4 py-3 pr-28 rounded-xl border text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 placeholder-gray-500"
                    }`}
                    rows={1}
                    style={{
                      minHeight: '48px',
                      maxHeight: '120px'
                    }}
                  />
                  <div className="absolute bottom-2 right-4 text-xs text-gray-500 pointer-events-none"> {/* Adjusted for dark mode */}
                    Press Enter to send
                  </div>
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!chatInput.trim() || isLoading}
                  className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Context Modal */}
      {showContextModal && selectedContext && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"> {/* Darker overlay */}
          <div className={`rounded-2xl shadow-2xl p-6 w-full max-w-5xl max-h-[80vh] overflow-y-auto m-4 ${
            isDarkMode ? "bg-gray-800 text-gray-100" : "bg-white" // Lighter text for dark modal
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Chat Context Data</h3>
              </div>
              <button
                onClick={() => setShowContextModal(false)}
                className="p-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors" // Dark mode hover
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3 text-blue-400">User Message:</h4> {/* Lighter blue for dark mode */}
                <div className="bg-blue-900/30 p-4 rounded-xl border border-blue-800 text-gray-200"> {/* Darker blue bg, lighter border, lighter text */}
                  {selectedContext.user_message}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-green-400">Bot Response:</h4> {/* Lighter green for dark mode */}
                <div className="bg-green-900/30 p-4 rounded-xl border border-green-800 text-gray-200"> {/* Darker green bg, lighter border, lighter text */}
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        code: ({ children }) => <code className="bg-gray-700 text-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>,
                        pre: ({ children }) => <pre className="bg-gray-700 text-gray-100 p-2 rounded text-xs overflow-x-auto">{children}</pre>
                      }}
                    >
                      {selectedContext.bot_response}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {selectedContext.context && selectedContext.context.infrastructure_data && (
                <div>
                  <h4 className="font-semibold mb-3 text-purple-400">Infrastructure Data Used:</h4> {/* Lighter purple for dark mode */}
                  <div className="bg-purple-900/30 p-4 rounded-xl border border-purple-800 text-gray-200"> {/* Darker purple bg, lighter border, lighter text */}
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedContext.context.infrastructure_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3 text-orange-400">Full Context:</h4> {/* Lighter orange for dark mode */}
                <div className="bg-orange-900/30 p-4 rounded-xl border border-orange-800 text-gray-200"> {/* Darker orange bg, lighter border, lighter text */}
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedContext.context, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatBot;