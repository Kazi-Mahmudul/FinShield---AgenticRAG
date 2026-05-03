import { motion } from 'framer-motion';
import { Shield, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function MessageBubble({ message, index }) {
  const { theme } = useTheme();
  const isUser = message.role === 'user';
  const isError = message.content.startsWith('⚠️');

  const normalizeContent = (text) => {
    return text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`+/g, '')
      .replace(/^#+\s*/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '• ')
      .replace(/\|/g, ' ')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^[>\s]+/gm, '')
      .replace(/\r\n/g, '\n')
      .replace(/\n{2,}/g, '\n')
      .trim();
  };

  const formatContent = (text) => {
    const normalized = normalizeContent(text);
    return normalized.split('\n').map((line, index) => (
      <div key={index} className="break-words">
        {line}
      </div>
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Bot avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center shadow-lg">
            <Shield className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      <div
        className={`max-w-[90%] lg:max-w-[82%] rounded-2xl px-4 py-2 text-sm leading-snug ${
          isUser
            ? theme === 'dark'
              ? 'bg-dark-600 text-white rounded-br-md'
              : 'bg-blue-500 text-white rounded-br-md'
            : isError
            ? theme === 'dark'
              ? 'bg-red-900/30 border border-red-500/30 text-red-200 rounded-bl-md'
              : 'bg-red-50 border border-red-200 text-red-700 rounded-bl-md'
            : theme === 'dark'
            ? 'bg-dark-800 border border-dark-600 text-dark-100 rounded-bl-md'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
        }`}
      >
        {/* Content */}
        <div className="whitespace-pre-wrap">{formatContent(message.content)}</div>

        {/* Timestamp */}
        <div className={`flex items-center gap-1 mt-2 text-[10px] ${
          isUser
            ? 'text-white/50 justify-end'
            : theme === 'dark' ? 'text-dark-400' : 'text-gray-400'
        }`}>
          {message.created_at && new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {isUser && <CheckCircle className="w-3 h-3" />}
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-orange to-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
            U
          </div>
        </div>
      )}
    </motion.div>
  );
}
