import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  mobile: string;
  role: 'customer' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAdmin: () => boolean;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('od_token', token);
        set({ user, token });
      },
      clearAuth: () => {
        localStorage.removeItem('od_token');
        set({ user: null, token: null });
      },
      isAdmin: () => get().user?.role === 'admin',
      isLoggedIn: () => !!get().user,
    }),
    {
      name: 'od_auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
