import { motion } from 'framer-motion';
import { Shield, Activity, AlertTriangle, TrendingUp, CheckCircle, BarChart3, Zap } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

export default function DashboardPage() {
  const { stats } = useChat();
  const { user } = useAuth();
  const { theme } = useTheme();

  const statCards = [
    {
      title: 'Transactions Checked',
      value: stats.transactionsChecked,
      icon: Activity,
      color: 'from-cyan-500 to-blue-500',
      textColor: 'text-accent-cyan',
    },
    {
      title: 'Alerts Triggered',
      value: stats.alertsTriggered,
      icon: AlertTriangle,
      color: 'from-orange-500 to-amber-500',
      textColor: 'text-accent-orange',
    },
    {
      title: 'Risk Score',
      value: user?.risk_score != null ? (user.risk_score * 100).toFixed(0) + '%' : 'N/A',
      icon: TrendingUp,
      color: 'from-purple-500 to-violet-500',
      textColor: 'text-accent-purple-light',
    },
    {
      title: 'Account Status',
      value: user?.is_verified ? 'Verified' : 'Pending',
      icon: user?.is_verified ? CheckCircle : Shield,
      color: 'from-green-500 to-emerald-500',
      textColor: 'text-accent-green',
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 border ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-dark-800 to-dark-700 border-dark-600'
            : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Welcome back, {user?.name || 'Agent'}
            </h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-gray-500'}`}>
              Here's your FinShield security overview
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.title}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`rounded-2xl p-5 border transition-all ${
              theme === 'dark'
                ? 'bg-dark-800/60 border-dark-600 hover:border-dark-500'
                : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <BarChart3 className={`w-4 h-4 ${theme === 'dark' ? 'text-dark-500' : 'text-gray-300'}`} />
            </div>
            <p className={`text-xs font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-gray-500'}`}>
              {card.title}
            </p>
            <p className={`text-2xl font-bold mt-1 ${card.textColor}`}>
              {card.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`rounded-2xl p-6 border ${
          theme === 'dark'
            ? 'bg-dark-800/40 border-dark-600'
            : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <h3 className={`text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-dark-200' : 'text-gray-700'}`}>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Check Transaction', desc: 'Analyze a transaction for fraud' },
            { label: 'View Risk Report', desc: 'See your account risk analysis' },
            { label: 'Security Policies', desc: 'Browse compliance documents' },
          ].map((action, i) => (
            <motion.a
              key={action.label}
              href="/chat"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`block p-4 rounded-xl border transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-dark-600 hover:border-accent-purple/40 hover:bg-dark-700/50'
                  : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50/50'
              }`}
            >
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {action.label}
              </p>
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-dark-400' : 'text-gray-400'}`}>
                {action.desc}
              </p>
            </motion.a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
