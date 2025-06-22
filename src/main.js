import { AppController } from './controllers/AppController.js';
import { DatabaseService } from './services/DatabaseService.js';
import './styles/main.css';

/**
 * Main application entry point
 * Initializes the app when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize database connection
    await DatabaseService.initialize();
    
    // Initialize main app controller
    const app = new AppController();
    await app.initialize();
    
    console.log('HealthSync AI initialized successfully');
  } catch (error) {
    console.error('Failed to initialize HealthSync AI:', error);
    // Show user-friendly error message
    document.body.innerHTML = `
      <div class="error-container">
        <h1>Unable to start HealthSync AI</h1>
        <p>Please refresh the page or contact support if the problem persists.</p>
      </div>
    `;
  }
});