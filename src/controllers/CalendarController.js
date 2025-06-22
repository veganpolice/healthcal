import { AppointmentService } from '../services/AppointmentService.js';
import { SchedulingService } from '../services/SchedulingService.js';
import { userPreferencesService } from '../services/UserPreferencesService.js';

/**
 * Handles calendar display and appointment management
 */
export class CalendarController {
  constructor() {
    this.appointmentService = new AppointmentService();
    this.schedulingService = new SchedulingService();
    this.appointments = [];
    this.generatedSchedule = null;
    this.isGenerating = false;
  }

  async initialize() {
    this.setupCalendarHandlers();
    await this.loadAppointments();
    await this.loadPreviousSchedule();
  }

  /**
   * Load previously generated schedule
   */
  async loadPreviousSchedule() {
    try {
      // First try to load from backend
      const backendSchedule = await this.schedulingService.getSchedule();
      if (backendSchedule && backendSchedule.length > 0) {
        console.log('Loading schedule from backend');
        this.appointments = backendSchedule;
        this.generatedSchedule = backendSchedule;
        this.renderCalendar();
        return;
      }

      // Fallback to user preferences
      const savedData = await userPreferencesService.getPreferences(
        userPreferencesService.steps.SCHEDULE
      );
      
      if (savedData && savedData.preferences && savedData.preferences.schedule) {
        console.log('Loading previous schedule from preferences');
        this.generatedSchedule = savedData.preferences.schedule;
        this.appointments = this.generatedSchedule;
        this.renderCalendar();
      }
    } catch (error) {
      console.error('Failed to load previous schedule:', error);
    }
  }

  setupCalendarHandlers() {
    // Generate new schedule button
    const generateBtn = document.getElementById('generate-schedule-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', this.generateNewSchedule.bind(this));
    }
  }

  async loadAppointments() {
    try {
      this.appointments = await this.appointmentService.getAppointments();
      this.renderCalendar();
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
  }

  async generateSchedule(userAnswers) {
    try {
      this.appointments = await this.schedulingService.generateSchedule(userAnswers);
      this.generatedSchedule = this.appointments;
      
      // Save the generated schedule
      await this.saveSchedule(userAnswers);
      
      this.renderCalendar();
    } catch (error) {
      console.error('Failed to generate schedule:', error);
    }
  }

  /**
   * Save generated schedule to user preferences
   */
  async saveSchedule(userAnswers = null) {
    try {
      const scheduleData = {
        schedule: this.generatedSchedule,
        userAnswers: userAnswers,
        generatedAt: new Date().toISOString(),
        appointmentCount: this.generatedSchedule ? this.generatedSchedule.length : 0
      };

      const result = await userPreferencesService.savePreferences(
        userPreferencesService.steps.SCHEDULE,
        scheduleData
      );

      if (result.success) {
        console.log('Schedule saved successfully');
      } else {
        console.warn('Failed to save schedule:', result.error);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  }

  renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    let html = '';
    
    months.forEach((month, index) => {
      const monthAppointments = this.appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.getMonth() === index;
      });
      
      html += this.renderMonthCard(month, monthAppointments);
    });
    
    calendarGrid.innerHTML = html;
    this.setupAppointmentHandlers();
  }

  renderMonthCard(month, appointments) {
    let html = `
      <div class="month-card">
        <div class="month-header">
          <h4>${month} 2025</h4>
        </div>
        <div class="month-body">`;
    
    if (appointments.length > 0) {
      appointments.forEach(appointment => {
        const date = new Date(appointment.date);
        const statusIcon = this.getStatusIcon(appointment.status);
        const statusClass = this.getStatusClass(appointment.status);
        
        html += `
          <div class="appointment-item" data-appointment-id="${appointment.id}">
            <div class="appointment-dot ${appointment.category}"></div>
            <div class="appointment-info">
              <p class="appointment-type">${appointment.type}</p>
              <div class="appointment-date">${date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}</div>
            </div>
            <div class="appointment-status ${statusClass}">
              <span class="status-icon">${statusIcon}</span>
              <span class="status-text">${this.getStatusText(appointment.status)}</span>
            </div>
          </div>`;
      });
    } else {
      html += '<p class="text-secondary">No appointments scheduled</p>';
    }
    
    html += '</div></div>';
    return html;
  }

  /**
   * Get status icon for appointment status
   * @param {string} status - Appointment status
   * @returns {string} Icon HTML
   */
  getStatusIcon(status) {
    switch (status) {
      case 'proposed':
        return '📋'; // Clipboard icon for proposed
      case 'requested':
        return '⏳'; // Hourglass icon for requested/pending
      case 'confirmed':
        return '✅'; // Check mark for confirmed
      default:
        return '📋';
    }
  }

  /**
   * Get CSS class for appointment status
   * @param {string} status - Appointment status
   * @returns {string} CSS class
   */
  getStatusClass(status) {
    switch (status) {
      case 'proposed':
        return 'status-proposed';
      case 'requested':
        return 'status-requested';
      case 'confirmed':
        return 'status-confirmed';
      default:
        return 'status-proposed';
    }
  }

  /**
   * Get human-readable status text
   * @param {string} status - Appointment status
   * @returns {string} Status text
   */
  getStatusText(status) {
    switch (status) {
      case 'proposed':
        return 'Proposed';
      case 'requested':
        return 'Requested';
      case 'confirmed':
        return 'Confirmed';
      default:
        return 'Proposed';
    }
  }

  setupAppointmentHandlers() {
    const appointmentItems = document.querySelectorAll('.appointment-item');
    appointmentItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const appointmentId = parseInt(e.currentTarget.dataset.appointmentId);
        const appointment = this.appointments.find(apt => apt.id === appointmentId);
        if (appointment) {
          this.emit('appointmentSelected', appointment);
        }
      });
    });
  }

  async generateNewSchedule() {
    if (this.isGenerating) return;

    try {
      this.isGenerating = true;
      this.showGeneratingState();

      // Get the previous user answers to regenerate with same preferences
      const questionnaireData = await userPreferencesService.getPreferences(
        userPreferencesService.steps.QUESTIONNAIRE
      );
      
      let userAnswers = {};
      if (questionnaireData && questionnaireData.preferences && questionnaireData.preferences.answers) {
        userAnswers = questionnaireData.preferences.answers;
      }

      // Generate new schedule using backend function
      this.appointments = await this.schedulingService.generateSchedule(userAnswers);
      this.generatedSchedule = this.appointments;
      
      // Save the new schedule
      await this.saveSchedule(userAnswers);
      
      this.renderCalendar();
      this.showSuccessMessage(`Generated ${this.appointments.length} appointments based on your preferences!`);
    } catch (error) {
      console.error('Failed to generate new schedule:', error);
      this.showErrorMessage('Failed to generate new schedule. Please try again.');
    } finally {
      this.isGenerating = false;
      this.hideGeneratingState();
    }
  }

  showGeneratingState() {
    const generateBtn = document.getElementById('generate-schedule-btn');
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.innerHTML = `
        <div class="spinner" style="width: 16px; height: 16px; margin-right: 8px;"></div>
        Generating Schedule...
      `;
    }
  }

  hideGeneratingState() {
    const generateBtn = document.getElementById('generate-schedule-btn');
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.innerHTML = 'Generate New Schedule';
    }
  }

  showSuccessMessage(message) {
    // Create and show a temporary success message
    const messageEl = document.createElement('div');
    messageEl.className = 'success-message';
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-success);
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 1000;
      box-shadow: var(--shadow-md);
      max-width: 300px;
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.remove();
    }, 4000);
  }

  showErrorMessage(message) {
    // Create and show a temporary error message
    const messageEl = document.createElement('div');
    messageEl.className = 'error-message';
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-error);
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 1000;
      box-shadow: var(--shadow-md);
      max-width: 300px;
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.remove();
    }, 5000);
  }

  // Event system
  emit(event, data) {
    document.dispatchEvent(new CustomEvent(`calendarController:${event}`, { detail: data }));
  }

  on(event, callback) {
    document.addEventListener(`calendarController:${event}`, callback);
  }
}