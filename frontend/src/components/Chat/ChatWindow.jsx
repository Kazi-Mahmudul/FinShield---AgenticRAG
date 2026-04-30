import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import SuggestedActions from './SuggestedActions';
import ChatInput from './ChatInput';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { getSettings } from '../../utils/sessionStorage';

export default function ChatWindow() {
  const { messages, isLoading, suggestions, sendChatMessage } = useChat();
  const { theme } = useTheme();
  const bottomRef = useRef(null);
  const settings = getSettings();

  useEffect(() => {
    if (settings.autoScroll !== false) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (text) => {
    try {
      await sendChatMessage(text);
    } catch {
      // Error already handled in context
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full text-center py-16"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-cyan/20 flex items-center justify-center mb-6 glow-purple">
              <Shield className={`w-10 h-10 ${theme === 'dark' ? 'text-accent-purple-light' : 'text-purple-500'}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome to FinShield Agent
            </h3>
            <p className={`text-sm max-w-md mb-8 ${
              theme === 'dark' ? 'text-dark-300' : 'text-gray-500'
            }`}>
              Your AI-powered fraud detection assistant. Ask me about transactions,
              risk analysis, or financial policies.
            </p>
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-4 h-4 text-accent-orange" />
              <span className={`text-xs font-medium ${
                theme === 'dark' ? 'text-dark-300' : 'text-gray-500'
              }`}>
                Try asking:
              </span>
            </div>
            <SuggestedActions suggestions={suggestions} onSelect={handleSend} />
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <MessageBubble key={msg.id} message={msg} index={i} />
          ))}
        </AnimatePresence>

        {isLoading && <TypingIndicator />}

        {/* Show suggestions after last bot message */}
        {!isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
          <SuggestedActions suggestions={suggestions} onSelect={handleSend} />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} isLoading={isLoading} settings={settings} />
    </div>
  );
}
