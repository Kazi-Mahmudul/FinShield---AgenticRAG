import { createContext, useContext, useState, useEffect } from 'react';
import { loginSimple, verifySession, getMyProfile } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('finshield_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      checkSession();
    } else {
      setLoading(false);
    }
  }, []);

  const checkSession = async () => {
    try {
      await verifySession();
      const cached = sessionStorage.getItem('finshield_user');
      if (cached) {
        setUser(JSON.parse(cached));
      } else {
        await fetchProfile();
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await getMyProfile();
      setUser(res.data);
      sessionStorage.setItem('finshield_user', JSON.stringify(res.data));
    } catch {
      // Profile fetch failed but session is valid
    }
  };

  const login = async (name, phone) => {
    const res = await loginSimple(name, phone);
    const { access_token } = res.data;
    sessionStorage.setItem('finshield_token', access_token);
    setToken(access_token);
    // Fetch profile after login
    try {
      const profileRes = await getMyProfile();
      setUser(profileRes.data);
      sessionStorage.setItem('finshield_user', JSON.stringify(profileRes.data));
    } catch {
      setUser({ name, phone });
      sessionStorage.setItem('finshield_user', JSON.stringify({ name, phone }));
    }
    return res.data;
  };

  const logout = () => {
    sessionStorage.removeItem('finshield_token');
    sessionStorage.removeItem('finshield_user');
    sessionStorage.removeItem('finshield_messages');
    sessionStorage.removeItem('finshield_stats');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
