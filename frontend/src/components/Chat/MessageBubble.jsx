import { motion } from 'framer-motion';
import { Shield, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function MessageBubble({ message, index }) {
  const { theme } = useTheme();
  const isUser = message.role === 'user';
  const isError = message.content.startsWith('⚠️');

  // Format content: bold text between ** **, highlight risk scores
  const formatContent = (text) => {
    // Split by **bold** markers
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        // Check if it's a risk-related bold text
        if (inner.toLowerCase().includes('fraud') || inner.toLowerCase().includes('risk')) {
          return <span key={i} className="font-bold text-accent-orange">{inner}</span>;
        }
        return <span key={i} className="font-bold text-accent-purple-light">{inner}</span>;
      }
      // Highlight risk scores like (Risk Score: 0.85/1)
      const scored = part.replace(
        /\(Risk Score:\s*([\d.]+)\/[\d.]+\)/gi,
        (match) => `⚡${match}⚡`
      );
      if (scored.includes('⚡')) {
        const scoreParts = scored.split('⚡');
        return scoreParts.map((sp, j) => {
          if (sp.match(/\(Risk Score:/i)) {
            return <span key={`${i}-${j}`} className="text-accent-orange font-semibold">{sp}</span>;
          }
          return sp;
        });
      }
      return part;
    });
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
        className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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
