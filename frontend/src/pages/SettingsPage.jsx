import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Sun, Moon, Monitor, Volume2, VolumeX, Type, LayoutGrid, Clock, Keyboard, Trash2, Globe, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../context/ChatContext';
import { getSettings, saveSettings } from '../utils/sessionStorage';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { clearChat } = useChat();
  const [settings, setSettings] = useState(() => getSettings());
  const dk = theme === 'dark';

  const update = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
    if (key === 'theme') setTheme(value);
  };

  const Section = ({ title, children }) => (
    <div className={`rounded-2xl p-5 border ${dk ? 'bg-dark-800/60 border-dark-600' : 'bg-white border-gray-200 shadow-sm'}`}>
      <h3 className={`text-sm font-semibold mb-4 ${dk ? 'text-dark-100' : 'text-gray-800'}`}>{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const Toggle = ({ label, icon: Icon, value, onChange }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${dk ? 'text-dark-400' : 'text-gray-400'}`} />
        <span className={`text-sm ${dk ? 'text-dark-200' : 'text-gray-700'}`}>{label}</span>
      </div>
      <button onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition-all duration-300 cursor-pointer relative ${value ? 'bg-accent-purple' : dk ? 'bg-dark-600' : 'bg-gray-300'}`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${value ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );

  const OptionGroup = ({ label, icon: Icon, options, value, onChange }) => (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-4 h-4 ${dk ? 'text-dark-400' : 'text-gray-400'}`} />
        <span className={`text-sm ${dk ? 'text-dark-200' : 'text-gray-700'}`}>{label}</span>
      </div>
      <div className="flex gap-2 ml-7">
        {options.map(opt => (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              value === opt.value
                ? 'bg-accent-purple text-white'
                : dk ? 'bg-dark-700 text-dark-300 hover:bg-dark-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-2xl mx-auto">
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <h1 className={`text-xl font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
      </motion.div>

      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }} className="space-y-4">
        <Section title="Appearance">
          <OptionGroup label="Theme" icon={Sun} value={settings.theme}
            onChange={v => update('theme', v)}
            options={[
              { value:'dark', label:'Dark' },
              { value:'light', label:'Light' },
            ]} />
          <OptionGroup label="Font Size" icon={Type} value={settings.fontSize}
            onChange={v => update('fontSize', v)}
            options={[
              { value:'small', label:'Small' },
              { value:'medium', label:'Medium' },
              { value:'large', label:'Large' },
            ]} />
          <OptionGroup label="Message Density" icon={LayoutGrid} value={settings.messageDensity}
            onChange={v => update('messageDensity', v)}
            options={[
              { value:'compact', label:'Compact' },
              { value:'comfortable', label:'Comfortable' },
              { value:'spacious', label:'Spacious' },
            ]} />
        </Section>

        <Section title="Chat Behavior">
          <Toggle label="Notification Sounds" icon={settings.notificationSound ? Volume2 : VolumeX}
            value={settings.notificationSound} onChange={v => update('notificationSound', v)} />
          <Toggle label="Auto-scroll to Latest" icon={Clock}
            value={settings.autoScroll} onChange={v => update('autoScroll', v)} />
          <Toggle label="Show Timestamps" icon={Clock}
            value={settings.showTimestamps} onChange={v => update('showTimestamps', v)} />
          <Toggle label="Send on Enter" icon={Keyboard}
            value={settings.sendOnEnter} onChange={v => update('sendOnEnter', v)} />
        </Section>

        <Section title="Language">
          <OptionGroup label="Language" icon={Globe} value={settings.language}
            onChange={v => update('language', v)}
            options={[
              { value:'en', label:'English' },
              { value:'bn', label:'বাংলা' },
            ]} />
        </Section>

        <Section title="Privacy & Data">
          <button onClick={clearChat}
            className="flex items-center gap-3 text-sm text-accent-red hover:text-red-400 transition-colors cursor-pointer">
            <Trash2 className="w-4 h-4" /> Clear Current Chat Session
          </button>
        </Section>

        <Section title="About">
          <div className="flex items-center gap-3">
            <Info className={`w-4 h-4 ${dk ? 'text-dark-400' : 'text-gray-400'}`} />
            <div>
              <p className={`text-sm ${dk ? 'text-dark-200' : 'text-gray-700'}`}>FinShield Agent v1.0</p>
              <p className={`text-xs ${dk ? 'text-dark-400' : 'text-gray-400'}`}>AI-Powered Fraud Detection System</p>
            </div>
          </div>
        </Section>
      </motion.div>
    </div>
  );
}
