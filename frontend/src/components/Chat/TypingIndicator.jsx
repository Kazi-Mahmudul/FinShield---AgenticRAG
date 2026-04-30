import { useTheme } from '../../context/ThemeContext';
import { Shield } from 'lucide-react';

export default function TypingIndicator() {
  const { theme } = useTheme();

  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center shadow-lg">
          <Shield className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className={`rounded-2xl rounded-bl-md px-5 py-4 ${
        theme === 'dark'
          ? 'bg-dark-800 border border-dark-600'
          : 'bg-white border border-gray-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full typing-dot ${
            theme === 'dark' ? 'bg-accent-purple' : 'bg-purple-500'
          }`} />
          <div className={`w-2 h-2 rounded-full typing-dot ${
            theme === 'dark' ? 'bg-accent-purple-light' : 'bg-purple-400'
          }`} />
          <div className={`w-2 h-2 rounded-full typing-dot ${
            theme === 'dark' ? 'bg-accent-cyan' : 'bg-cyan-500'
          }`} />
        </div>
      </div>
    </div>
  );
}
