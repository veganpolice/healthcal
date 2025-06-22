import { authService } from '../services/AuthService.js';

/**
 * Handles authentication UI and user interactions
 */
export class AuthController {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await authService.initialize();
      this.setupAuthHandlers();
      this.setupAuthStateListeners();
      this.isInitialized = true;
    } catch (error) {
      console.error('AuthController initialization failed:', error);
      throw error;
    }
  }

  setupAuthHandlers() {
    // Google sign in button
    const googleSignInBtn = document.getElementById('google-signin-btn');
    if (googleSignInBtn) {
      googleSignInBtn.addEventListener('click', this.handleGoogleSignIn.bind(this));
    }

    // Sign out button
    const signOutBtn = document.getElementById('signout-btn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', this.handleSignOut.bind(this));
    }

    // Profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', this.handleProfileUpdate.bind(this));
    }
  }

  setupAuthStateListeners() {
    authService.on('signedIn', (user) => {
      this.handleSignedIn(user);
    });

    authService.on('signedOut', () => {
      this.handleSignedOut();
    });
  }

  async handleGoogleSignIn() {
    try {
      this.showLoading('Signing in with Google...');
      await authService.signInWithGoogle();
    } catch (error) {
      console.error('Google sign in failed:', error);
      this.showError('Failed to sign in with Google. Please try again.');
    } finally {
      this.hideLoading();
    }
  }

  async handleSignOut() {
    try {
      this.showLoading('Signing out...');
      await authService.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
      this.showError('Failed to sign out. Please try again.');
    } finally {
      this.hideLoading();
    }
  }

  async handleProfileUpdate(e) {
    e.preventDefault();
    
    try {
      this.showLoading('Updating profile...');
      
      const formData = new FormData(e.target);
      const updates = {
        full_name: formData.get('full_name'),
        email: formData.get('email')
      };

      await authService.updateUserProfile(updates);
      this.showSuccess('Profile updated successfully!');
      
      // Refresh profile display
      await this.loadUserProfile();
    } catch (error) {
      console.error('Profile update failed:', error);
      this.showError('Failed to update profile. Please try again.');
    } finally {
      this.hideLoading();
    }
  }

  async handleSignedIn(user) {
    console.log('User signed in:', user);
    
    // Load user profile
    await this.loadUserProfile();
    
    // Show main application
    this.emit('authenticationComplete', user);
  }

  handleSignedOut() {
    console.log('User signed out');
    
    // Clear any cached data
    this.clearUserData();
    
    // Show login screen
    this.emit('authenticationRequired');
  }

  async loadUserProfile() {
    try {
      const profile = await authService.getUserProfile();
      if (profile) {
        this.displayUserProfile(profile);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  displayUserProfile(profile) {
    // Update profile display elements
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileAvatar = document.getElementById('profile-avatar');
    const headerUserName = document.getElementById('header-user-name');

    if (profileName) profileName.textContent = profile.full_name || 'User';
    if (profileEmail) profileEmail.textContent = profile.email || '';
    if (headerUserName) headerUserName.textContent = profile.full_name || 'User';
    
    if (profileAvatar && profile.avatar_url) {
      profileAvatar.src = profile.avatar_url;
      profileAvatar.style.display = 'block';
    }

    // Update form fields
    const fullNameInput = document.getElementById('profile-full-name');
    const emailInput = document.getElementById('profile-email-input');
    
    if (fullNameInput) fullNameInput.value = profile.full_name || '';
    if (emailInput) emailInput.value = profile.email || '';
  }

  clearUserData() {
    // Clear profile display
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileAvatar = document.getElementById('profile-avatar');
    const headerUserName = document.getElementById('header-user-name');

    if (profileName) profileName.textContent = '';
    if (profileEmail) profileEmail.textContent = '';
    if (headerUserName) headerUserName.textContent = '';
    if (profileAvatar) profileAvatar.style.display = 'none';
  }

  showLoading(message = 'Loading...') {
    const loadingEl = document.getElementById('auth-loading');
    const loadingMessage = document.getElementById('auth-loading-message');
    
    if (loadingMessage) loadingMessage.textContent = message;
    if (loadingEl) loadingEl.classList.remove('hidden');
  }

  hideLoading() {
    const loadingEl = document.getElementById('auth-loading');
    if (loadingEl) loadingEl.classList.add('hidden');
  }

  showError(message) {
    const errorEl = document.getElementById('auth-error');
    const errorMessage = document.getElementById('auth-error-message');
    
    if (errorMessage) errorMessage.textContent = message;
    if (errorEl) {
      errorEl.classList.remove('hidden');
      setTimeout(() => errorEl.classList.add('hidden'), 5000);
    }
  }

  showSuccess(message) {
    const successEl = document.getElementById('auth-success');
    const successMessage = document.getElementById('auth-success-message');
    
    if (successMessage) successMessage.textContent = message;
    if (successEl) {
      successEl.classList.remove('hidden');
      setTimeout(() => successEl.classList.add('hidden'), 3000);
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return authService.isUserAuthenticated();
  }

  // Get current user
  getCurrentUser() {
    return authService.getCurrentUser();
  }

  // Event system
  emit(event, data) {
    document.dispatchEvent(new CustomEvent(`authController:${event}`, { detail: data }));
  }

  on(event, callback) {
    document.addEventListener(`authController:${event}`, (e) => {
      callback(e.detail);
    });
  }
}