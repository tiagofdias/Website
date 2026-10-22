import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { scroller } from "react-scroll";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

import useIsMobile from "../utils/useIsMobile";
import { CORRECT_EMAIL, LINKEDIN_URL, GITHUB_URL, CV_PATH } from "../utils/aiKnowledgeEngine";

const API_URL = import.meta.env.VITE_API_URL || '/api';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm Tiago's AI assistant. Ask me anything about his projects, skills, or experience!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const latestMessageRef = useRef(null);
  const prevMessageRef = useRef(null);
  const isMobile = useIsMobile();

  const smartScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const lastMsg = messages[messages.length - 1];

    // 1. If loading or user just typed, scroll to bottom to show typing dots / user question
    if (isLoading || lastMsg?.role === "user") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // 2. When assistant message arrives:
    if (lastMsg?.role === "assistant" && messages.length > 1) {
      const asstEl = latestMessageRef.current;
      const userEl = prevMessageRef.current;

      if (asstEl && userEl) {
        const containerHeight = container.clientHeight;
        const userTop = userEl.offsetTop;
        const asstBottom = asstEl.offsetTop + asstEl.offsetHeight;
        const totalHeight = asstBottom - userTop;

        // If both user question and assistant answer fit, show both starting from user question
        if (totalHeight + 24 <= containerHeight) {
          container.scrollTo({
            top: Math.max(0, userTop - 12),
            behavior: "smooth"
          });
          return;
        } else {
          // If the message is tall, scroll so the TOP of the assistant's response is at the top of the viewport
          // This guarantees the user NEVER has to scroll up to read the start of the response!
          container.scrollTo({
            top: Math.max(0, asstEl.offsetTop - 12),
            behavior: "smooth"
          });
          return;
        }
      } else if (asstEl) {
        container.scrollTo({
          top: Math.max(0, asstEl.offsetTop - 12),
          behavior: "smooth"
        });
        return;
      }
    }

    // Default: smooth scroll
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      const t1 = setTimeout(smartScroll, 60);
      const t2 = setTimeout(smartScroll, 220);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [messages, isLoading]);

  const filterProjectsByTag = (tag) => {
    // Dispatch custom event to filter projects
    const event = new CustomEvent("filterProjects", { detail: { tag } });
    window.dispatchEvent(event);
    
    // Scroll to projects section after a short delay
    setTimeout(() => {
      scroller.scrollTo("projects", {
        smooth: true,
        offset: -70,
        duration: 800,
      });
    }, 300);
  };

  /**
   * Offline-only fallback: simple greeting detection + generic offline message.
   * The real intelligence is server-side via LLM.
   */
  const getOfflineFallback = (rawMessage) => {
    const msg = (rawMessage || "").trim().toLowerCase();

    // Quick Greetings
    if (
      /^(hi|hello|hey|yo|sup|greetings|good\s*(morning|afternoon|evening))\b/i.test(msg) ||
      /^(olá|ola|oi|bom dia|boa tarde|boa noite)\b/i.test(msg) ||
      /^(hola|buenos días|buenas tardes)\b/i.test(msg) ||
      ["hi", "hello", "hey", "ola", "olá", "oi", "hola"].includes(msg)
    ) {
      const isPt = /\b(olá|ola|bom dia|boa tarde|boa noite|oi)\b/i.test(msg);
      if (isPt) {
        return {
          response:
            "Olá! Sou o assistente de IA do Tiago Dias. O Tiago é **Gen AI Software Engineer** no **Banco BPI** e possui **Mestrado em Engenharia Informática** pelo ISTEC.\n\nPosso falar-lhe sobre os seus projetos práticos (como **Condomix**, **Sonar** ou **Automix**), a sua experiência em **Inteligência Artificial Generativa & .NET**, percurso académico ou canais de contacto. Como posso ajudar?",
        };
      }
      return {
        response:
          "Hello! I'm Tiago Dias's AI Assistant. Tiago is a **Gen AI Software Engineer** currently at **Banco BPI**, holding a **Master's degree in Computer Science** from ISTEC.\n\nFeel free to ask me about his enterprise **Gen AI & LLM modernization** work, full-stack projects (like **Condomix**, **Sonar**, and **Automix**), **certifications**, **experience**, or how to get in touch with him!",
      };
    }

    // Generic offline fallback for any other question
    return {
      response:
        "I'm having a bit of trouble connecting right now, but here's what I can tell you:\n\n" +
        "Tiago Dias is a **Gen AI Software Engineer** at **Banco BPI** with a **Master's in Computer Science** from ISTEC.\n\n" +
        `• **Core Stack**: Python, LLMs, .NET 8 (C#), React, Node.js & MongoDB\n` +
        `• **Contact**: [${CORRECT_EMAIL}](mailto:${CORRECT_EMAIL})\n\n` +
        "Please try again in a moment for a more detailed answer!",
      actionButtons: [
        { type: "url", icon: "", label: "LinkedIn", action: LINKEDIN_URL },
        { type: "download", icon: "", label: "Download CV", action: "cv" },
      ],
    };
  };

  const sendMessage = async (overrideMessage = null) => {
    const textToSend = typeof overrideMessage === "string" ? overrideMessage : input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = textToSend; // Save before clearing
    setInput("");
    setIsLoading(true);

    try {
      // Build conversation history (last 6 messages for context)
      const allMessages = [...messages, userMessage];
      const history = allMessages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: messageToSend,
          history: history
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // If the backend AI is unavailable or rate-limited, smoothly handle with offline fallback
      const isUnavailable =
        !data.response ||
        data.response.toLowerCase().includes("temporarily unavailable") ||
        data.response.toLowerCase().includes("high demand") ||
        data.response.toLowerCase().includes("service issues");

      let finalResponse = data.response;
      let finalScrollTarget = data.scrollTarget;
      let finalAboutTab = data.aboutTab;
      let finalFilterTag = data.filterTag;

      let finalActionButtons = data.actionButtons || null;

      if (isUnavailable) {
        const fallback = getOfflineFallback(messageToSend);
        finalResponse = fallback.response;
        finalScrollTarget = fallback.scrollTarget || finalScrollTarget;
        finalAboutTab = fallback.aboutTab || finalAboutTab;
        finalActionButtons = fallback.actionButtons || finalActionButtons;
      }
      
      // Handle My Journey tab switching
      if (finalAboutTab) {
        const event = new CustomEvent('changeMyJourneyTab', { 
          detail: { 
            tab: finalAboutTab,
            expand: data.shouldExpandTimeline || true 
          } 
        });
        window.dispatchEvent(event);
      }
      
      // Handle scrolling to section if provided
      if (finalScrollTarget) {
        setTimeout(() => {
          scroller.scrollTo(finalScrollTarget, {
            smooth: true,
            offset: -70,
            duration: 800,
          });
        }, 300);
      }
      
      // Handle tag filtering
      if (finalFilterTag) {
        if (finalFilterTag === 'clear') {
          window.dispatchEvent(new CustomEvent("filterProjects", { 
            detail: { tag: 'clear' } 
          }));
        } else {
          filterProjectsByTag(finalFilterTag);
        }
      }
      
      const assistantMessage = {
        role: "assistant",
        content: finalResponse,
        actionButtons: finalActionButtons,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Offline / Network fallback: respond gracefully
      const fallback = getOfflineFallback(messageToSend);

      if (fallback.scrollTarget) {
        setTimeout(() => {
          scroller.scrollTo(fallback.scrollTarget, {
            smooth: true,
            offset: -70,
            duration: 800,
          });
        }, 300);
      }

      const assistantMessage = {
        role: "assistant",
        content: fallback.response,
        actionButtons: fallback.actionButtons || null,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Button - Premium Design */}
      <motion.button
        whileHover={isMobile ? {} : { scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`group fixed ${
          isMobile ? "bottom-4 right-4" : "bottom-8 right-8"
        } z-50 ${
          isMobile ? "w-[70px] h-[70px]" : "w-[80px] h-[80px]"
        } rounded-full bg-gradient-to-br from-[#1a3b50] via-[#345164] to-[#00C6FE] shadow-[0_0_40px_rgba(0,198,254,0.4)] flex items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden border-2 border-[#00C6FE]/30`}
      >
        {/* Rotating gradient background */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00C6FE] via-purple-500 to-[#1a3b50] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Animated orbiting ring */}
        <div className="absolute inset-0 rounded-full">
          <div className="absolute inset-0 rounded-full border-2 border-[#00C6FE]/50 animate-spin" style={{ animationDuration: '3s' }}>
            <div className="absolute top-0 left-1/2 w-2 h-2 -mt-1 -ml-1 bg-[#00C6FE] rounded-full shadow-[0_0_10px_#00C6FE]"></div>
          </div>
        </div>
        
        {/* Pulse rings */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00C6FE] to-purple-500 animate-ping opacity-20"></div>
        <div className="absolute inset-0 rounded-full bg-[#00C6FE]/20 animate-pulse"></div>
        
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0, scale: 0 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0 }}
              transition={{ duration: 0.3, type: "spring" }}
              className="w-9 h-9 text-white relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </motion.svg>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3, type: "spring" }}
              className="relative z-10 flex items-center justify-center"
            >
              {/* Brain/AI Icon */}
              <svg 
                className="w-10 h-10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                <path d="M12 5.5c-1.84 0-3.48.5-4.86 1.35.13.26.29.5.48.72C8.73 6.68 10.3 6 12 6c1.7 0 3.27.68 4.38 1.57.19-.22.35-.46.48-.72C15.48 6 13.84 5.5 12 5.5zm0 13c1.84 0 3.48-.5 4.86-1.35-.13-.26-.29-.5-.48-.72C15.27 17.32 13.7 18 12 18c-1.7 0-3.27-.68-4.38-1.57-.19.22-.35.46-.48.72C8.52 18 10.16 18.5 12 18.5z"/>
              </svg>
              
              {/* Sparkle effect */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-12 h-12 border-2 border-white/30 rounded-full"></div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.button>

      {/* Chat Window - Premium Design */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.25 }}
            className={`fixed z-40 ${
              isMobile
                ? "inset-3 bottom-20"
                : "bottom-28 right-6 w-[460px] sm:w-[480px] max-w-[calc(100vw-32px)] h-[700px] max-h-[calc(100vh-130px)]"
            } backdrop-blur-3xl bg-gradient-to-br from-[#1a3b50]/98 via-[#345164]/95 to-[#1a3b50]/98 border-2 border-[#00C6FE]/30 rounded-[28px] shadow-[0_0_60px_rgba(0,198,254,0.25),0_20px_80px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden`}
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00C6FE]/15 via-transparent to-purple-500/15 pointer-events-none"></div>
            
            {/* Mesh pattern overlay */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0, 198, 254, 0.5) 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }}></div>
            
            {/* Top glow effect */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00C6FE] to-transparent"></div>
            
            {/* Header - Premium Compact Design */}
            <div className="relative bg-gradient-to-r from-[#1a3b50]/80 via-[#345164]/80 to-[#1a3b50]/80 border-b-2 border-[#00C6FE]/30 px-5 py-3.5 flex items-center justify-between backdrop-blur-2xl flex-shrink-0">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,198,254,0.2),transparent_50%)]"></div>
              </div>
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="relative">
                  {/* Avatar with enhanced glow */}
                  <motion.div 
                    className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#00C6FE] via-purple-500 to-[#1a3b50] flex items-center justify-center shadow-[0_0_20px_rgba(0,198,254,0.4)] border-2 border-[#00C6FE]/50"
                    animate={{ 
                      boxShadow: [
                        "0_0_20px_rgba(0,198,254,0.4)",
                        "0_0_30px_rgba(0,198,254,0.6)",
                        "0_0_20px_rgba(0,198,254,0.4)"
                      ]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {/* Rotating gradient background */}
                    <motion.div 
                      className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#00C6FE] to-purple-500 opacity-50"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    ></motion.div>
                    
                    {/* AI brain icon */}
                    <svg className="w-6 h-6 text-white relative z-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                      <circle cx="12" cy="8" r="1.5"/>
                      <circle cx="8" cy="12" r="1.5"/>
                      <circle cx="16" cy="12" r="1.5"/>
                      <circle cx="12" cy="16" r="1.5"/>
                      <path d="M12 8.5L8 12l4 4 4-4z" opacity="0.3"/>
                    </svg>
                  </motion.div>
                  
                  {/* Status indicator */}
                  <div className="absolute -bottom-1 -right-1">
                    <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-[#1a3b50] shadow-[0_0_12px_rgba(74,222,128,0.8)]"></div>
                    <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-60"></div>
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <h3 className="text-white font-bold text-base leading-tight">
                    Tiago's AI Assistant
                  </h3>
                  <p className="text-gray-300 text-xs flex items-center gap-1.5 mt-0.5">
                    <motion.span 
                      className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_6px_rgba(74,222,128,0.8)]"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.8, 1]
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    ></motion.span>
                    <span className="font-medium">Online</span>
                  </p>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMessages([messages[0]])}
                className="relative z-10 p-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 hover:border-[#00C6FE]/50 text-gray-300 hover:text-white transition-all duration-300 shadow-md hover:shadow-[0_0_15px_rgba(0,198,254,0.3)]"
                title="Reset conversation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </motion.button>
            </div>

            {/* Messages - Premium Design */}
            <div 
              ref={messagesContainerRef}
              className="relative flex-1 overflow-y-auto px-4 py-3.5 space-y-3 custom-scrollbar"
            >
              {messages.map((msg, idx) => {
                const isLatest = idx === messages.length - 1;
                const isSecondLatest = idx === messages.length - 2;
                return (
                <motion.div
                  key={idx}
                  ref={(el) => {
                    if (isLatest) latestMessageRef.current = el;
                    if (isSecondLatest) prevMessageRef.current = el;
                  }}
                  initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ 
                    duration: 0.35, 
                    delay: idx * 0.04,
                    type: "spring",
                    stiffness: 110
                  }}
                  className={`flex gap-2.5 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Assistant Avatar */}
                  {msg.role === "assistant" && (
                    <motion.div 
                      className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-[#00C6FE] via-purple-500 to-[#1a3b50] flex items-center justify-center shadow-[0_0_15px_rgba(0,198,254,0.35)] border-2 border-[#00C6FE]/40 mt-0.5"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <svg className="w-5 h-5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" opacity="0.3"/>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                        <circle cx="12" cy="8" r="2"/>
                        <path d="M12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </motion.div>
                  )}

                  <motion.div
                    className={`group relative max-w-[85%] rounded-2xl ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-[#00C6FE] via-[#00A8D8] to-purple-500 text-white shadow-[0_8px_30px_rgba(0,198,254,0.35)] border-2 border-[#00C6FE]/30"
                        : "backdrop-blur-2xl bg-gradient-to-br from-white/15 to-white/5 border-2 border-white/20 text-gray-50 shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
                    } overflow-hidden`}
                    whileHover={{ 
                      scale: 1.01,
                      boxShadow: msg.role === "user" 
                        ? "0_12px_40px_rgba(0,198,254,0.45)"
                        : "0_12px_40px_rgba(0,198,254,0.15)"
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Animated gradient overlay */}
                    {msg.role === "user" && (
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear",
                          repeatDelay: 2
                        }}
                      ></motion.div>
                    )}
                    
                    {/* Subtle grid pattern for assistant messages */}
                    {msg.role === "assistant" && (
                      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                        backgroundImage: `linear-gradient(rgba(0,198,254,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,198,254,0.3) 1px, transparent 1px)`,
                        backgroundSize: '10px 10px'
                      }}></div>
                    )}
                    
                    <div className={`relative px-4 py-3 pb-3.5 ${msg.role === "assistant" ? "backdrop-blur-sm" : ""}`}>
                      <div className="text-[14px] sm:text-[14.5px] leading-relaxed prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkBreaks]}
                          components={{
                            p: ({children}) => <p className="mb-1.5 last:mb-0 text-inherit leading-relaxed">{children}</p>,
                            strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
                            a: ({children, href}) => (
                              <a 
                                href={href} 
                                className="text-[#00EAFF] hover:text-purple-300 underline underline-offset-2 transition-colors font-medium"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                            em: ({children}) => <em className="italic text-gray-200">{children}</em>,
                            ul: ({children}) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                            li: ({children}) => <li className="text-inherit">{children}</li>,
                            code: ({children}) => (
                              <code className="px-1.5 py-0.5 rounded bg-black/20 border border-white/10 text-sm font-mono text-[#00EAFF]">
                                {children}
                              </code>
                            ),
                          }}
                        >
                          {msg.content.trim()}
                        </ReactMarkdown>

                        {/* Interactive Action Buttons */}
                        {msg.actionButtons && msg.actionButtons.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
                            {msg.actionButtons.map((btn, btnIdx) => (
                              <a
                                key={btnIdx}
                                href={btn.type === "download" ? "/CV.pdf" : btn.action}
                                target={btn.type === "download" ? "_self" : "_blank"}
                                rel="noopener noreferrer"
                                download={btn.type === "download" ? "Tiago_Dias_CV.pdf" : undefined}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00C6FE]/15 hover:bg-[#00C6FE]/30 text-[#00EAFF] border border-[#00C6FE]/40 hover:border-[#00C6FE] transition-all duration-200 shadow-sm hover:scale-105 active:scale-95"
                              >
                                {btn.type === "download" ? (
                                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                ) : (
                                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                )}
                                <span>{btn.label}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Message timestamp indicator */}
                    <div className={`absolute bottom-1 ${msg.role === "user" ? "left-2" : "right-2"} text-[10px] opacity-40`}>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </motion.div>

                  {/* User Avatar */}
                  {msg.role === "user" && (
                    <motion.div 
                      className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] border-2 border-purple-400/40"
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </motion.div>
                  )}
                </motion.div>
                );
              })}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start gap-3"
                >
                  {/* Assistant Avatar with pulse */}
                  <motion.div 
                    className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C6FE] via-purple-500 to-[#1a3b50] flex items-center justify-center shadow-[0_0_20px_rgba(0,198,254,0.4)] border-2 border-[#00C6FE]/40"
                    animate={{ 
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        "0_0_20px_rgba(0,198,254,0.4)",
                        "0_0_30px_rgba(0,198,254,0.6)",
                        "0_0_20px_rgba(0,198,254,0.4)"
                      ]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <motion.svg 
                      className="w-6 h-6 text-white" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                      animate={{ rotate: 360 }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                      <circle cx="12" cy="8" r="2"/>
                    </motion.svg>
                  </motion.div>
                  
                  <div className="backdrop-blur-2xl bg-gradient-to-br from-white/15 to-white/5 border-2 border-white/20 rounded-2xl px-6 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                    <div className="flex gap-2 items-center">
                      <motion.div 
                        className="w-3 h-3 rounded-full bg-gradient-to-br from-[#00C6FE] to-[#00A8D8]"
                        animate={{ 
                          scale: [1, 1.3, 1],
                          opacity: [1, 0.5, 1]
                        }}
                        transition={{ 
                          duration: 0.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0
                        }}
                      ></motion.div>
                      <motion.div 
                        className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-purple-600"
                        animate={{ 
                          scale: [1, 1.3, 1],
                          opacity: [1, 0.5, 1]
                        }}
                        transition={{ 
                          duration: 0.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.2
                        }}
                      ></motion.div>
                      <motion.div 
                        className="w-3 h-3 rounded-full bg-gradient-to-br from-pink-500 to-pink-600"
                        animate={{ 
                          scale: [1, 1.3, 1],
                          opacity: [1, 0.5, 1]
                        }}
                        transition={{ 
                          duration: 0.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.4
                        }}
                      ></motion.div>
                    </div>
                  </div>
                </motion.div>
              )}

              {messages.length === 1 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="pt-2 pb-1 space-y-2"
                >
                  <p className="text-[11px] font-semibold tracking-wider uppercase text-[#00EAFF]/70 px-1">
                    💡 Suggested Questions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "What is his current role at Banco BPI?",
                      "Is he open to remote work or relocation?",
                      "Tell me about his enterprise Gen AI projects",
                      "What is his core technical stack?",
                      "How can I get in touch or hire him?"
                    ].map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => sendMessage(suggestion)}
                        className="text-left text-xs px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#00C6FE]/20 text-gray-200 hover:text-white border border-white/15 hover:border-[#00C6FE]/50 transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-95"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input - Premium Compact Design */}
            <div className="relative border-t-2 border-[#00C6FE]/30 px-4 py-3 backdrop-blur-2xl bg-gradient-to-br from-[#1a3b50]/90 to-[#345164]/90 flex-shrink-0">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#00C6FE]/5 to-transparent pointer-events-none"></div>
              
              <div className="flex gap-2.5 relative z-10 items-center">
                <div className="flex-1 relative group">
                  {/* Enhanced input glow effect */}
                  <motion.div 
                    className="absolute -inset-1 bg-gradient-to-r from-[#00C6FE] via-purple-500 to-[#00C6FE] rounded-[18px] blur-md opacity-0 group-focus-within:opacity-40 transition-opacity duration-500"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    style={{
                      backgroundSize: "200% 100%"
                    }}
                  ></motion.div>
                  
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about Tiago..."
                    className="relative w-full bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border-2 border-white/20 focus:border-[#00C6FE]/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-400 outline-none transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)] focus:shadow-[0_4px_30px_rgba(0,198,254,0.2)]"
                    disabled={isLoading}
                  />
                </div>
                
                <motion.button
                  whileHover={isMobile || isLoading || !input.trim() ? {} : { 
                    scale: 1.05,
                    boxShadow: "0_0_20px_rgba(0,198,254,0.5)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="group relative w-[44px] h-[44px] rounded-xl bg-gradient-to-br from-[#00C6FE] via-purple-500 to-[#00C6FE] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_4px_20px_rgba(0,198,254,0.35)] disabled:shadow-none overflow-hidden border-2 border-[#00C6FE]/30 flex-shrink-0"
                  style={{
                    backgroundSize: "200% 200%"
                  }}
                >
                  {/* Animated gradient background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-[#00C6FE] via-purple-500 to-pink-500"
                    animate={{
                      backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    style={{
                      backgroundSize: "200% 200%"
                    }}
                  ></motion.div>
                  
                  {/* Shimmer effect */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                      repeatDelay: 1
                    }}
                  ></motion.div>
                  
                  {isLoading ? (
                    <motion.div
                      className="relative z-10"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </motion.div>
                  ) : (
                    <motion.svg 
                      className="relative z-10 w-5 h-5 text-white drop-shadow-md" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      whileHover={{ scale: 1.1 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </motion.svg>
                  )}
                </motion.button>
              </div>
              
              {/* Quick action hints */}
              <div className="mt-2 flex items-center gap-2 text-[11px] relative z-10">
                <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-md border border-white/10 backdrop-blur-sm text-gray-400">
                  <kbd className="px-1 py-0.2 bg-gradient-to-br from-[#00C6FE]/20 to-purple-500/20 rounded border border-[#00C6FE]/30 text-white font-semibold text-[9px]">Enter</kbd>
                  <span>Send</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-md border border-white/10 backdrop-blur-sm text-gray-400">
                  <kbd className="px-1 py-0.2 bg-gradient-to-br from-[#00C6FE]/20 to-purple-500/20 rounded border border-[#00C6FE]/30 text-white font-semibold text-[9px]">Shift+Enter</kbd>
                  <span>New line</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: linear-gradient(180deg, rgba(26, 59, 80, 0.3) 0%, rgba(52, 81, 100, 0.3) 100%);
          border-radius: 12px;
          margin: 10px 0;
          border: 1px solid rgba(0, 198, 254, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(0, 198, 254, 0.7) 0%, rgba(168, 85, 247, 0.7) 50%, rgba(0, 198, 254, 0.7) 100%);
          border-radius: 12px;
          border: 2px solid rgba(26, 59, 80, 0.5);
          box-shadow: 0 0 10px rgba(0, 198, 254, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(0, 198, 254, 0.9) 0%, rgba(168, 85, 247, 0.9) 50%, rgba(0, 198, 254, 0.9) 100%);
          box-shadow: 0 0 15px rgba(0, 198, 254, 0.5);
        }
        
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        /* Smooth scrolling */
        .custom-scrollbar {
          scroll-behavior: smooth;
        }
      `}} />
    </>
  );
};

export default ChatWidget;
