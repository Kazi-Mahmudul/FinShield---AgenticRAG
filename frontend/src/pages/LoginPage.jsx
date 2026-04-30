import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoginForm from '../components/Auth/LoginForm';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${
      theme === 'dark' ? 'gradient-bg' : 'gradient-bg-light'
    }`}>
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent-purple/10 rounded-full blur-[80px]"
        />
        <motion.div
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 30, -30, 0],
            scale: [1, 0.95, 1.1, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent-cyan/8 rounded-full blur-[80px]"
        />
        <motion.div
          animate={{
            x: [0, 20, -10, 0],
            y: [0, -20, 30, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 right-1/3 w-48 h-48 bg-accent-orange/5 rounded-full blur-[60px]"
        />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={`absolute top-6 right-6 p-3 rounded-xl transition-all z-10 ${
          theme === 'dark'
            ? 'bg-dark-700/50 hover:bg-dark-600 text-accent-orange'
            : 'bg-white/50 hover:bg-white text-amber-500 shadow-lg'
        }`}
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="relative z-10 w-full">
        <LoginForm onSuccess={() => navigate('/chat')} />
      </div>
    </div>
  );
}
