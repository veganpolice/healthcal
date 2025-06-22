import { PageManager } from './PageManager.js';
import { UploadController } from './UploadController.js';
import { QuestionnaireController } from './QuestionnaireController.js';
import { CalendarController } from './CalendarController.js';
import { ModalController } from './ModalController.js';
import { NavigationController } from './NavigationController.js';
import { AuthController } from './AuthController.js';

/**
 * Main application controller
 * Coordinates all other controllers and manages app state
 */
export class AppController {
  constructor() {
    this.controllers = {};
    this.isInitialized = false;
    this.isAuthenticated = false;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize auth controller first
      this.controllers.auth = new AuthController();
      await this.controllers.auth.initialize();

      // Set up auth state listeners
      this.setupAuthStateListeners();

      // Check if user is already authenticated
      if (this.controllers.auth.isAuthenticated()) {
        await this.initializeMainApp();
      } else {
        this.showAuthenticationRequired();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('AppController initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize main application controllers (after authentication)
   */
  async initializeMainApp() {
    if (this.isAuthenticated) return;

    try {
      // Initialize all other controllers
      this.controllers.pageManager = new PageManager();
      this.controllers.navigation = new NavigationController(this.controllers.pageManager);
      this.controllers.upload = new UploadController();
      this.controllers.questionnaire = new QuestionnaireController();
      this.controllers.calendar = new CalendarController();
      this.controllers.modal = new ModalController();

      // Set up controller communication
      this.setupControllerCommunication();

      // Initialize each controller
      await Promise.all([
        this.controllers.pageManager.initialize(),
        this.controllers.navigation.initialize(),
        this.controllers.upload.initialize(),
        this.controllers.questionnaire.initialize(),
        this.controllers.calendar.initialize(),
        this.controllers.modal.initialize()
      ]);

      this.isAuthenticated = true;
      this.showMainApplication();
    } catch (error) {
      console.error('Main app initialization failed:', error);
      throw error;
    }
  }

  /**
   * Set up authentication state listeners
   */
  setupAuthStateListeners() {
    this.controllers.auth.on('authenticationComplete', async (user) => {
      await this.initializeMainApp();
    });

    this.controllers.auth.on('authenticationRequired', () => {
      this.showAuthenticationRequired();
      this.isAuthenticated = false;
    });
  }

  /**
   * Set up communication between controllers
   */
  setupControllerCommunication() {
    // Upload completion -> Questionnaire (with dynamic questions)
    this.controllers.upload.on('uploadComplete', (e) => {
      const data = e.detail || e;
      this.controllers.pageManager.showPage('questionnaire');
      
      // Start questionnaire with dynamic questions if available
      if (data && data.dynamicQuestionnaire) {
        console.log('Starting questionnaire with AI-generated questions');
        this.controllers.questionnaire.start(data.dynamicQuestionnaire);
      } else {
        this.controllers.questionnaire.start();
      }
    });

    // Questionnaire completion -> Calendar
    this.controllers.questionnaire.on('questionnaireComplete', (e) => {
      const answers = e.detail || e; // Handle both CustomEvent and direct data
      this.controllers.pageManager.showPage('calendar');
      this.controllers.calendar.generateSchedule(answers);
    });

    // Calendar appointment selection -> Modal
    this.controllers.calendar.on('appointmentSelected', (e) => {
      const appointment = e.detail || e; // Handle both CustomEvent and direct data
      this.controllers.modal.showAppointmentDetails(appointment);
    });
  }

  /**
   * Show authentication required screen
   */
  showAuthenticationRequired() {
    // Hide main app
    const mainApp = document.getElementById('main-app');
    if (mainApp) mainApp.classList.add('hidden');

    // Show auth screen
    const authScreen = document.getElementById('auth-screen');
    if (authScreen) authScreen.classList.remove('hidden');
  }

  /**
   * Show main application
   */
  showMainApplication() {
    // Hide auth screen
    const authScreen = document.getElementById('auth-screen');
    if (authScreen) authScreen.classList.add('hidden');

    // Show main app
    const mainApp = document.getElementById('main-app');
    if (mainApp) mainApp.classList.remove('hidden');
  }

  /**
   * Get a specific controller
   */
  getController(name) {
    return this.controllers[name];
  }
}