import { DatabaseService } from './DatabaseService.js';

/**
 * Authentication service for handling Google OAuth and user management
 */
export class AuthService {
  constructor() {
    this.user = null;
    this.session = null;
    this.isAuthenticated = false;
  }

  /**
   * Initialize auth service and check for existing session
   */
  async initialize() {
    const client = DatabaseService.getClient();
    if (!client) {
      console.warn('Supabase client not available. Auth service disabled.');
      return;
    }

    try {
      // Get initial session
      const { data: { session }, error } = await client.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        return;
      }

      if (session) {
        await this.setSession(session);
      }

      // Listen for auth changes
      client.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          await this.setSession(session);
          this.emit('signedIn', this.user);
        } else if (event === 'SIGNED_OUT') {
          await this.clearSession();
          this.emit('signedOut');
        }
      });

    } catch (error) {
      console.error('Auth initialization failed:', error);
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    const client = DatabaseService.getClient();
    if (!client) {
      throw new Error('Authentication not available');
    }

    try {
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Google sign in failed:', error);
      throw error;
    }
  }

  /**
   * Sign out user
   */
  async signOut() {
    const client = DatabaseService.getClient();
    if (!client) {
      throw new Error('Authentication not available');
    }

    try {
      const { error } = await client.auth.signOut();
      if (error) {
        throw error;
      }

      await this.clearSession();
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Check if user is authenticated
   */
  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  /**
   * Get user profile
   */
  async getUserProfile() {
    if (!this.user) {
      return null;
    }

    const client = DatabaseService.getClient();
    if (!client) {
      return null;
    }

    try {
      const { data, error } = await client
        .from('user_profiles')
        .select('*')
        .eq('id', this.user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates) {
    if (!this.user) {
      throw new Error('No authenticated user');
    }

    const client = DatabaseService.getClient();
    if (!client) {
      throw new Error('Database not available');
    }

    try {
      const { data, error } = await client
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Set session and user data
   */
  async setSession(session) {
    this.session = session;
    this.user = session.user;
    this.isAuthenticated = true;

    // Store session in localStorage for persistence
    localStorage.setItem('supabase.auth.token', JSON.stringify(session));
  }

  /**
   * Clear session and user data
   */
  async clearSession() {
    this.session = null;
    this.user = null;
    this.isAuthenticated = false;

    // Clear stored session
    localStorage.removeItem('supabase.auth.token');
  }

  /**
   * Get access token for API calls
   */
  getAccessToken() {
    return this.session?.access_token || null;
  }

  /**
   * Check if user has completed onboarding
   */
  async hasCompletedOnboarding() {
    const profile = await this.getUserProfile();
    return profile?.full_name && profile?.email;
  }

  // Event system for auth state changes
  emit(event, data) {
    document.dispatchEvent(new CustomEvent(`authService:${event}`, { detail: data }));
  }

  on(event, callback) {
    document.addEventListener(`authService:${event}`, (e) => {
      callback(e.detail);
    });
  }
}

// Create singleton instance
export const authService = new AuthService();