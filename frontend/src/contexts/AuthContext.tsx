import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import type { ReactNode } from 'react';

import { api } from '../api/api';
import { socket } from '../realtime/socket';

interface User {
  id: string;
  fullName: string;
  email: string;
  userType: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  accessToken: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;

  login: (data: LoginData) => Promise<LoginResponse>;
  logout: () => void;
}

const AuthContext = createContext({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

function connectSocket(user: User) {
  if (!socket.connected) {
    socket.connect();
  }

  socket.emit('register-user', {
    userId: user.id,
    userType: user.userType,
  });
}

function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  async function loadUser() {
    const token = localStorage.getItem('@pedal_token');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');

      setUser(response.data);
      connectSocket(response.data);
    } catch {
      localStorage.removeItem('@pedal_token');
      disconnectSocket();
    }

    setLoading(false);
  }

  useEffect(() => {
    loadUser();

    return () => {
      disconnectSocket();
    };
  }, []);

  async function login({
    email,
    password,
  }: LoginData): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });

    const { accessToken, user } = response.data;

    localStorage.setItem('@pedal_token', accessToken);

    setUser(user);
    connectSocket(user);

    return {
      accessToken,
      user,
    };
  }

  function logout() {
    localStorage.removeItem('@pedal_token');
    localStorage.removeItem('public_access_token');
    localStorage.removeItem('public_user');

    setUser(null);
    disconnectSocket();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}