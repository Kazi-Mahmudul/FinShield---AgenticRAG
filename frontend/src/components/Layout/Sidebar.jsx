import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  History,
  Settings,
  User,
  LogOut,
  Shield,
  X,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className={`flex flex-col h-full ${
      theme === 'dark' ? 'bg-dark-900 border-dark-700' : 'bg-white border-gray-200'
    } border-r`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-dark-700/50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-purple to-accent-purple-dark flex items-center justify-center shadow-lg">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <h1 className={`text-xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          FinShield
        </h1>
        <button
          onClick={onClose}
          className="ml-auto lg:hidden p-1 rounded-lg hover:bg-dark-700 transition-colors"
        >
          <X className={`w-5 h-5 ${theme === 'dark' ? 'text-dark-300' : 'text-gray-500'}`} />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-accent-purple text-white shadow-lg shadow-accent-purple/25'
                  : theme === 'dark'
                  ? 'text-dark-300 hover:text-white hover:bg-dark-700/60'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full transition-all duration-200 ${
            theme === 'dark'
              ? 'text-dark-400 hover:text-accent-red hover:bg-dark-700/60'
              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
          }`}
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
