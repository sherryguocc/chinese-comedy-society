// Debug utilities for development
export const debugAuth = {
  clearAuthData() {
    if (typeof window !== 'undefined') {
      console.log('Clearing all authentication data...');
      localStorage.removeItem('chinese-comedy-society-auth');
      localStorage.removeItem('chinese-comedy-society-user');
      localStorage.removeItem('chinese-comedy-society-profile');
      
      // Also clear any Supabase auth data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('Authentication data cleared. Please refresh the page.');
    }
  },
  
  showAuthState() {
    if (typeof window !== 'undefined') {
      console.log('Current auth state in localStorage:');
      console.log('User:', localStorage.getItem('chinese-comedy-society-user'));
      console.log('Profile:', localStorage.getItem('chinese-comedy-society-profile'));
      console.log('Auth:', localStorage.getItem('chinese-comedy-society-auth'));
    }
  }
};

// Make it available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugAuth = debugAuth;
}