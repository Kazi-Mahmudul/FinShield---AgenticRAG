import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';
import AppLayout from './components/Layout/AppLayout';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-950">
        <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return token ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return null;
  return token ? <Navigate to="/chat" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ChatProvider>
            <Routes>
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/chat" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
              <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
