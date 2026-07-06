import { create } from 'zustand';

const useAuthStore = create((set) => ({
  // User Authentication State
  token: localStorage.getItem('cvcraft_token') || null,
  user: JSON.parse(localStorage.getItem('cvcraft_user')) || null,

  // Admin Authentication State
  adminToken: localStorage.getItem('cvcraft_admin_token') || null,
  admin: JSON.parse(localStorage.getItem('cvcraft_admin')) || null,

  // User Auth Actions
  login: (token, user) => {
    localStorage.setItem('cvcraft_token', token);
    localStorage.setItem('cvcraft_user', JSON.stringify(user));
    set({ token, user });
  },
  
  logout: () => {
    localStorage.removeItem('cvcraft_token');
    localStorage.removeItem('cvcraft_user');
    set({ token: null, user: null });
  },

  update2FASettings: (enabled) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, twoFaEnabled: enabled };
      localStorage.setItem('cvcraft_user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },

  // Admin Auth Actions
  adminLogin: (token, admin) => {
    localStorage.setItem('cvcraft_admin_token', token);
    localStorage.setItem('cvcraft_admin', JSON.stringify(admin));
    set({ adminToken: token, admin });
  },

  adminLogout: () => {
    localStorage.removeItem('cvcraft_admin_token');
    localStorage.removeItem('cvcraft_admin');
    set({ adminToken: null, admin: null });
  }
}));

export default useAuthStore;
