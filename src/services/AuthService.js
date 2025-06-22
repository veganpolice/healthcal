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
      // Check if we're returning from OAuth (tokens in URL hash)
      await this.handleOAuthCallback();

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
   * Handle OAuth callback from URL hash
   */
  async handleOAuthCallback() {
    const client = DatabaseService.getClient();
    if (!client) return;

    // Check if we have OAuth tokens in the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken) {
      try {
        console.log('Processing OAuth callback...');
        
        // Set the session using the tokens from the URL
        const { data, error } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          console.error('Error setting session from OAuth callback:', error);
          return;
        }

        // Clean up the URL by removing the hash
        window.history.replaceState({}, document.title, window.location.pathname);
        
        console.log('OAuth callback processed successfully');
      } catch (error) {
        console.error('Error handling OAuth callback:', error);
      }
    }
  }

  /**
   * Get the appropriate redirect URL for OAuth
   */
  getRedirectUrl() {
    // Always use the production URL for OAuth redirects
    // This ensures consistent behavior regardless of where the auth is initiated
    return 'https://healthcalai.netlify.app';
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
      const redirectTo = this.getRedirectUrl();
      console.log('Redirecting OAuth to:', redirectTo);

      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
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

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
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