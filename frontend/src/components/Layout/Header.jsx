import { Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';

export default function Header({ onMenuClick, title = 'FinShield Agent' }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { stats } = useChat();

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'FS';

  return (
    <header className={`sticky top-0 z-30 px-4 lg:px-6 py-3 flex items-center gap-4 border-b ${
      theme === 'dark'
        ? 'bg-dark-900/80 border-dark-700/50 backdrop-blur-xl'
        : 'bg-white/80 border-gray-200 backdrop-blur-xl'
    }`}>
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className={`lg:hidden p-2 rounded-xl transition-colors ${
          theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-gray-100'
        }`}
      >
        <Menu className={`w-5 h-5 ${theme === 'dark' ? 'text-dark-200' : 'text-gray-600'}`} />
      </button>

      {/* Title */}
      <h2 className={`text-lg font-semibold flex-1 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        {title}
      </h2>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={`p-2.5 rounded-xl transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-dark-700 hover:bg-dark-600 text-accent-orange'
            : 'bg-gray-100 hover:bg-gray-200 text-amber-500'
        }`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Stats Badge */}
      <div className={`hidden sm:flex items-center gap-4 px-4 py-2 rounded-xl text-xs ${
        theme === 'dark' ? 'bg-dark-800 border border-dark-600' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div>
          <div className={`font-semibold ${theme === 'dark' ? 'text-dark-200' : 'text-gray-500'}`}>
            Real-time Stats
          </div>
          <div className="flex gap-4 mt-0.5">
            <span className={theme === 'dark' ? 'text-dark-300' : 'text-gray-600'}>
              Transactions Checked:{' '}
              <span className="text-accent-cyan font-bold">{stats.transactionsChecked}</span>
            </span>
            <span className={theme === 'dark' ? 'text-dark-300' : 'text-gray-600'}>
              Alerts Triggered:{' '}
              <span className="text-accent-orange font-bold">{stats.alertsTriggered}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center text-white text-sm font-bold shadow-lg cursor-pointer">
        {initials}
      </div>
    </header>
  );
}
