import { createContext, useContext, useState, useCallback } from 'react';
import { sendMessage as apiSendMessage } from '../api/client';
import { getMessages, saveMessages, clearMessages as clearStoredMessages, getStats, saveStats } from '../utils/sessionStorage';

const ChatContext = createContext(null);

// Generate suggested follow-up questions based on the last response
function generateSuggestions(reply) {
  const lower = reply.toLowerCase();

  if (lower.includes('fraud') || lower.includes('fraudulent') || lower.includes('risk score')) {
    return [
      'Show me recent high-risk transactions',
      'What fraud patterns were detected?',
      'How can I improve my account security?',
    ];
  }
  if (lower.includes('transaction') || lower.includes('transfer')) {
    return [
      'Check my latest transactions',
      'Are there any suspicious transfers?',
      'Show transaction summary for this month',
    ];
  }
  if (lower.includes('alert') || lower.includes('notification')) {
    return [
      'Show all active alerts',
      'Clear resolved alerts',
      'Configure alert thresholds',
    ];
  }
  if (lower.includes('policy') || lower.includes('compliance') || lower.includes('regulation')) {
    return [
      'What are the KYC requirements?',
      'Explain the anti-money laundering policy',
      'What happens when a suspicious activity is detected?',
    ];
  }
  if (lower.includes('block') || lower.includes('suspend') || lower.includes('freeze')) {
    return [
      'How to unblock an account?',
      'Show blocked transaction details',
      'Contact support for account issues',
    ];
  }
  // Default suggestions
  return [
    'Check a transaction for fraud',
    'Show my account risk score',
    'What are the latest security policies?',
  ];
}

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState(() => getMessages());
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    'Check a transaction for fraud',
    'Show my account risk score',
    'What are the latest security policies?',
  ]);
  const [stats, setStatsState] = useState(() => getStats());

  const updateStats = useCallback((reply) => {
    const lower = reply.toLowerCase();
    setStatsState(prev => {
      const updated = { ...prev };
      // Count transaction-related queries
      if (lower.includes('transaction') || lower.includes('tx') || lower.includes('transfer') || lower.includes('check')) {
        updated.transactionsChecked = (prev.transactionsChecked || 0) + 1;
      }
      // Count alerts
      if (lower.includes('alert') || lower.includes('fraud') || lower.includes('suspicious') || lower.includes('risk')) {
        updated.alertsTriggered = (prev.alertsTriggered || 0) + 1;
      }
      saveStats(updated);
      return updated;
    });
  }, []);

  const addMessage = useCallback((role, content) => {
    const newMsg = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      role,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => {
      const updated = [...prev, newMsg];
      saveMessages(updated);
      return updated;
    });
    return newMsg;
  }, []);

  const sendChatMessage = useCallback(async (text) => {
    addMessage('user', text);
    setIsLoading(true);
    try {
      const res = await apiSendMessage(text);
      const reply = res.data.reply;
      addMessage('assistant', reply);
      setSuggestions(generateSuggestions(reply));
      updateStats(reply);
      return reply;
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.detail || 'Something went wrong. Please try again.';
      addMessage('assistant', `⚠️ Error: ${errorMsg}`);
      setSuggestions(['Try again', 'Check my account status', 'Help']);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, updateStats]);

  const clearChat = useCallback(() => {
    setMessages([]);
    clearStoredMessages();
    setSuggestions([
      'Check a transaction for fraud',
      'Show my account risk score',
      'What are the latest security policies?',
    ]);
  }, []);

  return (
    <ChatContext.Provider value={{
      messages,
      isLoading,
      suggestions,
      stats,
      sendChatMessage,
      clearChat,
      addMessage,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
