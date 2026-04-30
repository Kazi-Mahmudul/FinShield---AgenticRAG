import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Phone, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function LoginForm({ onSuccess }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!/^\d{11}$/.test(phone)) {
      setError('Phone number must be exactly 11 digits');
      return;
    }

    setLoading(true);
    try {
      await login(name.trim(), phone);
      onSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`w-full max-w-md mx-auto rounded-3xl p-8 ${
        theme === 'dark'
          ? 'glass glow-purple'
          : 'glass-light shadow-2xl'
      }`}
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="flex justify-center mb-8"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-purple-dark flex items-center justify-center shadow-xl shadow-accent-purple/30">
          <Shield className="w-8 h-8 text-white" />
        </div>
      </motion.div>

      <h2 className={`text-2xl font-bold text-center mb-2 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        Welcome to FinShield
      </h2>
      <p className={`text-sm text-center mb-8 ${
        theme === 'dark' ? 'text-dark-300' : 'text-gray-500'
      }`}>
        Sign in with your registered name and phone number
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name input */}
        <div>
          <label className={`block text-xs font-medium mb-1.5 ${
            theme === 'dark' ? 'text-dark-200' : 'text-gray-600'
          }`}>
            Full Name
          </label>
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-dark-800 border border-dark-600 focus-within:border-accent-purple/50'
              : 'bg-gray-50 border border-gray-200 focus-within:border-purple-300'
          }`}>
            <User className={`w-4 h-4 flex-shrink-0 ${
              theme === 'dark' ? 'text-dark-400' : 'text-gray-400'
            }`} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className={`flex-1 bg-transparent outline-none text-sm ${
                theme === 'dark' ? 'text-white placeholder-dark-400' : 'text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
        </div>

        {/* Phone input */}
        <div>
          <label className={`block text-xs font-medium mb-1.5 ${
            theme === 'dark' ? 'text-dark-200' : 'text-gray-600'
          }`}>
            Phone Number
          </label>
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-dark-800 border border-dark-600 focus-within:border-accent-purple/50'
              : 'bg-gray-50 border border-gray-200 focus-within:border-purple-300'
          }`}>
            <Phone className={`w-4 h-4 flex-shrink-0 ${
              theme === 'dark' ? 'text-dark-400' : 'text-gray-400'
            }`} />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="01XXXXXXXXX"
              className={`flex-1 bg-transparent outline-none text-sm ${
                theme === 'dark' ? 'text-white placeholder-dark-400' : 'text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-accent-red text-xs bg-accent-red/10 px-3 py-2 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-accent-purple to-accent-purple-dark text-white font-semibold text-sm transition-all duration-300 hover:shadow-xl hover:shadow-accent-purple/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing In...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      <p className={`text-[10px] text-center mt-6 ${
        theme === 'dark' ? 'text-dark-500' : 'text-gray-400'
      }`}>
        Protected by FinShield AI Security • v1.0
      </p>
    </motion.div>
  );
}
