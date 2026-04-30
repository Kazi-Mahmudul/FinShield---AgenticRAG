import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Shield, Activity, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { getMyProfile } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ProfilePage() {
  const { user, fetchProfile } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const dk = theme === 'dark';

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await fetchProfile(); } catch {}
    finally { setRefreshing(false); }
  };

  const fields = [
    { label: 'User ID', value: user?.user_id, icon: Shield },
    { label: 'Name', value: user?.name, icon: User },
    { label: 'Phone', value: user?.phone, icon: Phone },
    { label: 'Balance', value: user?.balance != null ? `৳${user.balance.toLocaleString()}` : 'N/A', icon: Activity },
    { label: 'Risk Score', value: user?.risk_score != null ? `${(user.risk_score * 100).toFixed(1)}%` : 'N/A', icon: Activity,
      color: user?.risk_score > 0.7 ? 'text-accent-red' : user?.risk_score > 0.4 ? 'text-accent-orange' : 'text-accent-green' },
    { label: 'Verification', value: user?.is_verified ? 'Verified' : 'Not Verified',
      icon: user?.is_verified ? CheckCircle : XCircle,
      color: user?.is_verified ? 'text-accent-green' : 'text-accent-red' },
    { label: 'Last Active', value: user?.last_active ? new Date(user.last_active).toLocaleString() : 'N/A', icon: Clock },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <h1 className={`text-xl font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Profile</h1>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className={`p-2 rounded-xl transition-all cursor-pointer ${dk ? 'bg-dark-700 hover:bg-dark-600 text-dark-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>

      {/* Avatar card */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className={`rounded-2xl p-6 border text-center ${dk ? 'bg-dark-800/60 border-dark-600' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-xl">
          {user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'FS'}
        </div>
        <h2 className={`text-lg font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>{user?.name || 'Agent'}</h2>
        <p className={`text-sm ${dk ? 'text-dark-400' : 'text-gray-500'}`}>{user?.phone || ''}</p>
        {user?.is_verified && (
          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-green/10 text-accent-green">
            <CheckCircle className="w-3 h-3" /> Verified Account
          </span>
        )}
      </motion.div>

      {/* Details */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        className={`rounded-2xl border divide-y ${dk ? 'bg-dark-800/60 border-dark-600 divide-dark-600' : 'bg-white border-gray-200 divide-gray-100 shadow-sm'}`}>
        {fields.map((f, i) => (
          <div key={f.label} className="flex items-center gap-4 px-5 py-4">
            <f.icon className={`w-4 h-4 flex-shrink-0 ${dk ? 'text-dark-400' : 'text-gray-400'}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs ${dk ? 'text-dark-400' : 'text-gray-400'}`}>{f.label}</p>
              <p className={`text-sm font-medium truncate ${f.color || (dk ? 'text-dark-100' : 'text-gray-800')}`}>{f.value}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
