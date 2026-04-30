// Session storage helpers for conversation memory

const MESSAGES_KEY = 'finshield_messages';
const STATS_KEY = 'finshield_stats';
const SETTINGS_KEY = 'finshield_settings';

export const getMessages = () => {
  try {
    const raw = sessionStorage.getItem(MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveMessages = (messages) => {
  sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
};

export const clearMessages = () => {
  sessionStorage.removeItem(MESSAGES_KEY);
};

export const getStats = () => {
  try {
    const raw = sessionStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : { transactionsChecked: 0, alertsTriggered: 0 };
  } catch {
    return { transactionsChecked: 0, alertsTriggered: 0 };
  }
};

export const saveStats = (stats) => {
  sessionStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

export const getSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

export const saveSettings = (settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const defaultSettings = {
  theme: 'dark',
  fontSize: 'medium',
  messageDensity: 'comfortable',
  notificationSound: true,
  language: 'en',
  autoScroll: true,
  showTimestamps: true,
  sendOnEnter: true,
};
