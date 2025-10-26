import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faTimes, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { scroller } from "react-scroll";

// Simple markdown formatter for chat messages
const formatMarkdown = (text) => {
  if (!text) return text;
  
  // Convert markdown to HTML
  let formatted = text
    // Headers: ### Header (h3), ## Header (h2), # Header (h1)
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-3 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
    // Bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text_
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Code: `code`
    .replace(/`(.+?)`/g, '<code class="bg-gray-700 px-1 rounded">$1</code>')
    // Links: [text](url)
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline break-all">$1</a>')
    // Plain URLs (not in markdown format)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline break-all">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br />');
  
  return formatted;
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm Tiago's AI assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
      actionButtons: null,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleActionButton = (action, type) => {
    if (type === 'url') {
      window.open(action, '_blank', 'noopener,noreferrer');
    } else if (type === 'download') {
      if (action === 'cv') {
        // Trigger CV download - look for the download CV button in the navbar
        const cvButton = document.querySelector('[aria-label="Download CV"]') || 
                        document.querySelector('a[download]');
        if (cvButton) {
          cvButton.click();
        } else {
          // Fallback: try to find CV file in public folder
          const link = document.createElement('a');
          link.href = '/CV_Tiago_Dias.pdf'; // Adjust path as needed
          link.download = 'CV_Tiago_Dias.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        // Direct download for other files (like certificates)
        const link = document.createElement('a');
        link.href = action;
        link.download = action.split('/').pop();
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage("");
    setIsTyping(true);

    try {
      // Call the backend chat API
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const botMessage = {
        id: Date.now() + 1,
        text: data.response,
        sender: "bot",
        timestamp: new Date(),
        actionButtons: data.actionButtons || null,
      };
      setMessages((prev) => [...prev, botMessage]);
      
      // Update HTML lang attribute if language is detected
      if (data.detectedLanguage) {
        const currentLang = document.documentElement.lang;
        if (currentLang !== data.detectedLanguage) {
          console.log(`Updating page language from ${currentLang} to ${data.detectedLanguage}`);
          document.documentElement.lang = data.detectedLanguage;
          
          // Also update the meta tag if it exists
          const metaLang = document.querySelector('meta[http-equiv="content-language"]');
          if (metaLang) {
            metaLang.setAttribute('content', data.detectedLanguage);
          } else {
            // Create meta tag if it doesn't exist
            const meta = document.createElement('meta');
            meta.setAttribute('http-equiv', 'content-language');
            meta.setAttribute('content', data.detectedLanguage);
            document.head.appendChild(meta);
          }
        }
      }
      
      // Auto-scroll to section if scrollTarget is provided using react-scroll
      if (data.scrollTarget) {
        setTimeout(() => {
          scroller.scrollTo(data.scrollTarget, {
            duration: 500,
            delay: 0,
            smooth: true,
            offset: -70, // Offset for fixed navbar if you have one
          });
          
          // Only auto-expand Timeline when specifically asking about experience or education
          if (data.scrollTarget === 'about' && data.shouldExpandTimeline) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('expandAboutSection'));
            }, 600); // Wait for scroll to complete
          }
          
          // If filterTag is present and scrolling to projects, trigger filter
          if (data.scrollTarget === 'projects' && data.filterTag) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('filterProjects', { 
                detail: { tag: data.filterTag }
              }));
            }, 700); // Wait for scroll to complete + small delay
          }
        }, 500); // Small delay to let the user see the response first
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting right now. Please try again later or use the contact form.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Simple bot response logic (replace with AI integration)
  const getBotResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes("experience") || lowerMessage.includes("work")) {
      return "Tiago has experience as a Software Engineer with expertise in fullstack development. Check out the Experience section for more details!";
    } else if (lowerMessage.includes("project")) {
      return "Tiago has worked on various projects including web applications, AI integrations, and more. Scroll down to see the Projects section!";
    } else if (lowerMessage.includes("contact") || lowerMessage.includes("email")) {
      return "You can reach out through the Contact form at the bottom of the page or connect on LinkedIn!";
    } else if (lowerMessage.includes("skills") || lowerMessage.includes("tech")) {
      return "Tiago specializes in React, Node.js, Python, AI/ML, and cloud technologies. Visit the About section to learn more!";
    } else if (lowerMessage.includes("cv") || lowerMessage.includes("resume")) {
      return "You can download Tiago's CV using the 'DOWNLOAD CV' button at the top of the page!";
    } else {
      return "Thanks for your question! Feel free to explore the portfolio or use the contact form for specific inquiries.";
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-white text-[#1E1E1E] w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
        aria-label="Toggle chat"
      >
        <FontAwesomeIcon
          icon={isOpen ? faTimes : faComments}
          className="text-2xl"
        />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-[#1E1E1E] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="bg-white text-[#1E1E1E] p-4 rounded-t-2xl">
            <h3 className="font-bold text-lg">Chat with Tiago's Assistant</h3>
            <p className="text-sm text-gray-600">Ask me anything!</p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#1E1E1E]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl break-words ${
                    message.sender === "user"
                      ? "bg-white text-[#1E1E1E]"
                      : "bg-[#1a3b50] text-white"
                  }`}
                >
                  <div className="p-3">
                    <div 
                      className="text-sm break-words overflow-wrap-anywhere"
                      dangerouslySetInnerHTML={{ __html: formatMarkdown(message.text) }}
                    />
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  
                  {/* Action Buttons - Modern Clean Design */}
                  {message.actionButtons && message.actionButtons.length > 0 && (
                    <div className="px-3 pb-3 pt-1 flex gap-2">
                      {message.actionButtons.map((button, index) => (
                        <button
                          key={index}
                          onClick={() => handleActionButton(button.action, button.type)}
                          className="group flex items-center gap-2 bg-white/90 hover:bg-white text-[#1a3b50] text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                          title={button.label}
                        >
                          <span className="text-base">{button.icon}</span>
                          <span className="font-medium">{button.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#1a3b50] text-white p-3 rounded-2xl">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 bg-[#1E1E1E] border-t border-gray-700"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-white text-[#1E1E1E] px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1a3b50]"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="bg-white text-[#1E1E1E] w-10 h-10 rounded-full transition-all duration-300 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Send message"
              >
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
