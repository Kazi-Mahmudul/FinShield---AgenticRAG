import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Loader2, MessageSquare, RefreshCw, ChevronDown } from 'lucide-react';
import { getChatHistory } from '../api/client';
import { useTheme } from '../context/ThemeContext';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { theme } = useTheme();
  const limit = 50;
  const dk = theme === 'dark';

  const fetchHistory = async (reset = false) => {
    setLoading(true);
    try {
      const o = reset ? 0 : offset;
      const res = await getChatHistory(limit, o);
      const items = res.data.items || [];
      if (reset) { setHistory(items); setOffset(items.length); }
      else { setHistory(p => [...p, ...items]); setOffset(p => p + items.length); }
      setTotal(res.data.total);
      setHasMore(res.data.has_more);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHistory(true); }, []);

  const grouped = history.reduce((a, m) => {
    const d = new Date(m.created_at).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    if (!a[d]) a[d] = [];
    a[d].push(m);
    return a;
  }, {});

  const filtered = Object.entries(grouped).reduce((a, [d, msgs]) => {
    const f = msgs.filter(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()));
    if (f.length) a[d] = f;
    return a;
  }, {});

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Chat History</h1>
            <p className={`text-xs ${dk ? 'text-dark-400' : 'text-gray-400'}`}>{total} total messages</p>
          </div>
        </div>
        <button onClick={() => fetchHistory(true)} className={`p-2 rounded-xl transition-all cursor-pointer ${dk ? 'bg-dark-700 hover:bg-dark-600 text-dark-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </motion.div>

      <div className={`rounded-xl px-4 py-2.5 ${dk ? 'bg-dark-800 border border-dark-600' : 'bg-white border border-gray-200'}`}>
        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search conversations..."
          className={`w-full bg-transparent outline-none text-sm ${dk ? 'text-white placeholder-dark-400' : 'text-gray-900 placeholder-gray-400'}`} />
      </div>

      {loading && history.length === 0 ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-accent-purple" /></div>
      ) : Object.keys(filtered).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <MessageSquare className={`w-12 h-12 mb-4 ${dk ? 'text-dark-500' : 'text-gray-300'}`} />
          <p className={`text-sm ${dk ? 'text-dark-400' : 'text-gray-400'}`}>{searchTerm ? 'No matching messages' : 'No chat history yet'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(filtered).map(([date, msgs]) => (
            <motion.div key={date} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
              <div className={`text-xs font-medium mb-3 px-1 ${dk ? 'text-dark-400' : 'text-gray-400'}`}>{date}</div>
              <div className="space-y-2">
                {msgs.map(msg => (
                  <div key={msg.id} className={`rounded-xl px-4 py-3 text-sm border ${
                    msg.role === 'user' ? (dk ? 'bg-dark-700/50 border-dark-600 ml-8' : 'bg-blue-50 border-blue-100 ml-8')
                    : (dk ? 'bg-dark-800/50 border-dark-600 mr-8' : 'bg-gray-50 border-gray-100 mr-8')}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${msg.role === 'user' ? 'text-accent-cyan' : 'text-accent-purple-light'}`}>{msg.role}</span>
                      <span className={`text-[10px] ${dk ? 'text-dark-500' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                    <p className={`leading-relaxed ${dk ? 'text-dark-200' : 'text-gray-700'}`}>
                      {msg.content.length > 300 ? msg.content.slice(0, 300) + '...' : msg.content}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button onClick={() => fetchHistory(false)} disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer ${dk ? 'bg-dark-700 hover:bg-dark-600 text-dark-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
