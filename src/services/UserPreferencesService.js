import { DatabaseService } from './DatabaseService.js';
import { authService } from './AuthService.js';

/**
 * Service for managing user preferences across different steps
 */
export class UserPreferencesService {
  constructor() {
    this.steps = {
      UPLOAD: 'upload',
      QUESTIONNAIRE: 'questionnaire',
      INSURANCE: 'insurance',
      SCHEDULE: 'schedule'
    };
  }

  /**
   * Save user preferences for a specific step
   * @param {string} step - The step identifier
   * @param {Object} preferences - The preferences data
   * @returns {Promise<Object>} Result of the save operation
   */
  async savePreferences(step, preferences) {
    const user = authService.getCurrentUser();
    if (!user) {
      console.warn('No authenticated user found');
      return { success: false, error: 'User not authenticated' };
    }

    if (!DatabaseService.isConnected()) {
      console.warn('Database not connected. Preferences saved locally only.');
      this.saveToLocalStorage(step, preferences);
      return { success: true, local: true };
    }

    try {
      // Check if preferences already exist for this step
      const existing = await this.getPreferences(step);
      
      const preferenceData = {
        user_id: user.id,
        step: step,
        preferences: preferences,
        completed_at: new Date().toISOString()
      };

      let result;
      if (existing && existing.id) {
        // Update existing preferences
        result = await DatabaseService.update('user_preferences', existing.id, {
          preferences: preferences,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else {
        // Insert new preferences
        result = await DatabaseService.insert('user_preferences', preferenceData);
      }

      if (result.error) {
        console.error('Failed to save preferences:', result.error);
        // Fallback to local storage
        this.saveToLocalStorage(step, preferences);
        return { success: false, error: result.error, fallback: true };
      }

      console.log(`Preferences saved for step: ${step}`);
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Fallback to local storage
      this.saveToLocalStorage(step, preferences);
      return { success: false, error: error.message, fallback: true };
    }
  }

  /**
   * Get user preferences for a specific step
   * @param {string} step - The step identifier
   * @returns {Promise<Object|null>} The preferences data or null
   */
  async getPreferences(step) {
    const user = authService.getCurrentUser();
    if (!user) {
      console.warn('No authenticated user found');
      return this.getFromLocalStorage(step);
    }

    if (!DatabaseService.isConnected()) {
      console.warn('Database not connected. Loading from local storage.');
      return this.getFromLocalStorage(step);
    }

    try {
      const { data, error } = await DatabaseService.query('user_preferences', {
        select: '*',
        filter: ['user_id', 'eq', user.id],
        order: { column: 'created_at', ascending: false }
      });

      if (error) {
        console.error('Failed to fetch preferences:', error);
        return this.getFromLocalStorage(step);
      }

      const stepPreferences = data?.find(pref => pref.step === step);
      return stepPreferences || this.getFromLocalStorage(step);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      return this.getFromLocalStorage(step);
    }
  }

  /**
   * Get all user preferences
   * @returns {Promise<Array>} Array of all user preferences
   */
  async getAllPreferences() {
    const user = authService.getCurrentUser();
    if (!user) {
      console.warn('No authenticated user found');
      return [];
    }

    if (!DatabaseService.isConnected()) {
      console.warn('Database not connected. Loading from local storage.');
      return this.getAllFromLocalStorage();
    }

    try {
      const { data, error } = await DatabaseService.query('user_preferences', {
        select: '*',
        filter: ['user_id', 'eq', user.id],
        order: { column: 'created_at', ascending: false }
      });

      if (error) {
        console.error('Failed to fetch all preferences:', error);
        return this.getAllFromLocalStorage();
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching all preferences:', error);
      return this.getAllFromLocalStorage();
    }
  }

  /**
   * Delete preferences for a specific step
   * @param {string} step - The step identifier
   * @returns {Promise<boolean>} Success status
   */
  async deletePreferences(step) {
    const user = authService.getCurrentUser();
    if (!user) {
      console.warn('No authenticated user found');
      return false;
    }

    if (!DatabaseService.isConnected()) {
      console.warn('Database not connected. Removing from local storage only.');
      this.removeFromLocalStorage(step);
      return true;
    }

    try {
      const existing = await this.getPreferences(step);
      if (!existing || !existing.id) {
        return true; // Nothing to delete
      }

      const { error } = await DatabaseService.query('user_preferences', {
        delete: true,
        filter: ['id', 'eq', existing.id]
      });

      if (error) {
        console.error('Failed to delete preferences:', error);
        return false;
      }

      // Also remove from local storage
      this.removeFromLocalStorage(step);
      return true;
    } catch (error) {
      console.error('Error deleting preferences:', error);
      return false;
    }
  }

  /**
   * Check if user has completed a specific step
   * @param {string} step - The step identifier
   * @returns {Promise<boolean>} Whether the step is completed
   */
  async isStepCompleted(step) {
    const preferences = await this.getPreferences(step);
    return preferences && preferences.completed_at;
  }

  /**
   * Get completion progress across all steps
   * @returns {Promise<Object>} Progress information
   */
  async getProgress() {
    const allPreferences = await this.getAllPreferences();
    const stepKeys = Object.values(this.steps);
    
    const completed = stepKeys.filter(step => 
      allPreferences.some(pref => pref.step === step && pref.completed_at)
    );

    return {
      total: stepKeys.length,
      completed: completed.length,
      percentage: Math.round((completed.length / stepKeys.length) * 100),
      completedSteps: completed,
      remainingSteps: stepKeys.filter(step => !completed.includes(step))
    };
  }

  // Local storage fallback methods
  saveToLocalStorage(step, preferences) {
    try {
      const key = `healthsync_preferences_${step}`;
      const data = {
        step,
        preferences,
        completed_at: new Date().toISOString(),
        saved_at: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`Preferences saved to local storage for step: ${step}`);
    } catch (error) {
      console.error('Failed to save to local storage:', error);
    }
  }

  getFromLocalStorage(step) {
    try {
      const key = `healthsync_preferences_${step}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load from local storage:', error);
      return null;
    }
  }

  getAllFromLocalStorage() {
    try {
      const preferences = [];
      const stepKeys = Object.values(this.steps);
      
      stepKeys.forEach(step => {
        const data = this.getFromLocalStorage(step);
        if (data) {
          preferences.push(data);
        }
      });
      
      return preferences;
    } catch (error) {
      console.error('Failed to load all from local storage:', error);
      return [];
    }
  }

  removeFromLocalStorage(step) {
    try {
      const key = `healthsync_preferences_${step}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from local storage:', error);
    }
  }

  /**
   * Clear all user preferences (useful for logout)
   */
  async clearAllPreferences() {
    const user = authService.getCurrentUser();
    if (!user) return;

    if (DatabaseService.isConnected()) {
      try {
        const { error } = await DatabaseService.query('user_preferences', {
          delete: true,
          filter: ['user_id', 'eq', user.id]
        });
        
        if (error) {
          console.error('Failed to clear preferences from database:', error);
        }
      } catch (error) {
        console.error('Error clearing preferences:', error);
      }
    }

    // Clear local storage
    const stepKeys = Object.values(this.steps);
    stepKeys.forEach(step => {
      this.removeFromLocalStorage(step);
    });
  }
}

// Create singleton instance
export const userPreferencesService = new UserPreferencesService();