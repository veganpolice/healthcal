import { PageManager } from './PageManager.js';
import { UploadController } from './UploadController.js';
import { QuestionnaireController } from './QuestionnaireController.js';
import { CalendarController } from './CalendarController.js';
import { ModalController } from './ModalController.js';
import { NavigationController } from './NavigationController.js';

/**
 * Main application controller
 * Coordinates all other controllers and manages app state
 */
export class AppController {
  constructor() {
    this.controllers = {};
    this.isInitialized = false;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize all controllers
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

      this.isInitialized = true;
    } catch (error) {
      console.error('AppController initialization failed:', error);
      throw error;
    }
  }

  /**
   * Set up communication between controllers
   */
  setupControllerCommunication() {
    // Upload completion -> Questionnaire
    this.controllers.upload.on('uploadComplete', () => {
      this.controllers.pageManager.showPage('questionnaire');
      this.controllers.questionnaire.start();
    });

    // Questionnaire completion -> Calendar
    this.controllers.questionnaire.on('questionnaireComplete', (answers) => {
      this.controllers.pageManager.showPage('calendar');
      this.controllers.calendar.generateSchedule(answers);
    });

    // Calendar appointment selection -> Modal
    this.controllers.calendar.on('appointmentSelected', (appointment) => {
      this.controllers.modal.showAppointmentDetails(appointment);
    });
  }

  /**
   * Get a specific controller
   */
  getController(name) {
    return this.controllers[name];
  }
}