import { useState, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ChatInput({ onSend, isLoading, settings }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const { theme } = useTheme();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && (settings?.sendOnEnter !== false)) {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`border-t px-4 py-3 ${
      theme === 'dark' ? 'border-dark-700/50 bg-dark-900/50' : 'border-gray-200 bg-white/50'
    }`}>
      <div className={`flex items-center gap-3 rounded-2xl px-4 py-2 transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-dark-800 border border-dark-600 focus-within:border-accent-purple/50 focus-within:shadow-[0_0_15px_rgba(168,85,247,0.1)]'
          : 'bg-gray-50 border border-gray-200 focus-within:border-purple-300 focus-within:shadow-[0_0_15px_rgba(168,85,247,0.08)]'
      }`}>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Ask FinShield: "Is this transaction legitimate?"'
          disabled={isLoading}
          className={`flex-1 bg-transparent outline-none text-sm placeholder-opacity-60 ${
            theme === 'dark'
              ? 'text-white placeholder-dark-400'
              : 'text-gray-900 placeholder-gray-400'
          }`}
        />
        <button
          type="submit"
          disabled={!text.trim() || isLoading}
          className={`p-2 rounded-xl transition-all duration-200 ${
            text.trim() && !isLoading
              ? 'bg-accent-purple hover:bg-accent-purple-dark text-white shadow-lg shadow-accent-purple/25 cursor-pointer'
              : theme === 'dark'
              ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </form>
  );
}
