import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

export default function SuggestedActions({ suggestions, onSelect }) {
  const { theme } = useTheme();

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="px-1 pt-2">
      <p className={`text-xs font-semibold mb-2 ${
        theme === 'dark' ? 'text-dark-300' : 'text-gray-500'
      }`}>
        Suggested Actions:
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, i) => (
          <motion.button
            key={suggestion}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(suggestion)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer ${
              theme === 'dark'
                ? 'border-accent-orange/40 text-accent-orange hover:bg-accent-orange/10 hover:border-accent-orange/70'
                : 'border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400'
            }`}
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
